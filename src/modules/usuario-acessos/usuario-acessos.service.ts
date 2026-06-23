import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnoLetivo } from '../anos-letivos/anos-letivos.entities';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { Escola } from '../escolas/escolas.entities';
import { Perfil } from '../perfis-permissoes/perfis-permissoes.entities';
import { Secretaria } from '../secretarias/secretarias.entities';
import {
  AtualizarUsuarioAcessoDto,
  CriarUsuarioAcessoDto,
} from './usuario-acessos.dto';
import { UsuarioAcesso } from './usuario-acessos.entities';

@Injectable()
export class UsuarioAcessosService {
  constructor(
    @InjectRepository(UsuarioAcesso)
    private readonly usuarioAcessosRepositorio: Repository<UsuarioAcesso>,
    @InjectRepository(Usuario)
    private readonly usuariosRepositorio: Repository<Usuario>,
    @InjectRepository(Perfil)
    private readonly perfisRepositorio: Repository<Perfil>,
    @InjectRepository(Secretaria)
    private readonly secretariasRepositorio: Repository<Secretaria>,
    @InjectRepository(Escola)
    private readonly escolasRepositorio: Repository<Escola>,
    @InjectRepository(AnoLetivo)
    private readonly anosLetivosRepositorio: Repository<AnoLetivo>,
  ) {}

  async criar(dados: CriarUsuarioAcessoDto) {
    await this.validarRelacionamentos(dados);
    await this.garantirAcessoNaoDuplicado(dados);

    const acesso = this.usuarioAcessosRepositorio.create({
      ...dados,
      secretariaId: dados.secretariaId ?? null,
      escolaId: dados.escolaId ?? null,
      anoLetivoId: dados.anoLetivoId ?? null,
      ativo: dados.ativo ?? true,
    });

    return this.usuarioAcessosRepositorio.save(acesso);
  }

  listar() {
    return this.usuarioAcessosRepositorio.find({
      relations: {
        usuario: true,
        perfil: true,
        secretaria: true,
        escola: true,
        anoLetivo: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async buscarPorId(id: string) {
    const acesso = await this.usuarioAcessosRepositorio.findOne({
      where: { id },
      relations: {
        usuario: true,
        perfil: true,
        secretaria: true,
        escola: true,
        anoLetivo: true,
      },
    });

    if (!acesso) {
      throw new NotFoundException('Acesso do usuário não encontrado.');
    }

    return acesso;
  }

  async atualizar(id: string, dados: AtualizarUsuarioAcessoDto) {
    const acesso = await this.buscarPorId(id);
    const dadosCompletos = {
      usuarioId: dados.usuarioId ?? acesso.usuarioId,
      perfilId: dados.perfilId ?? acesso.perfilId,
      secretariaId: dados.secretariaId ?? acesso.secretariaId ?? undefined,
      escolaId: dados.escolaId ?? acesso.escolaId ?? undefined,
      anoLetivoId: dados.anoLetivoId ?? acesso.anoLetivoId ?? undefined,
      ativo: dados.ativo ?? acesso.ativo,
    };

    await this.validarRelacionamentos(dadosCompletos);
    await this.garantirAcessoNaoDuplicado(dadosCompletos, id);

    Object.assign(acesso, {
      ...dados,
      secretariaId: dadosCompletos.secretariaId ?? null,
      escolaId: dadosCompletos.escolaId ?? null,
      anoLetivoId: dadosCompletos.anoLetivoId ?? null,
    });

    return this.usuarioAcessosRepositorio.save(acesso);
  }

  async remover(id: string) {
    const acesso = await this.buscarPorId(id);
    await this.usuarioAcessosRepositorio.remove(acesso);

    return { mensagem: 'Acesso do usuário removido com sucesso.' };
  }

  async inativar(id: string) {
    const acesso = await this.buscarPorId(id);
    acesso.ativo = false;

    return this.usuarioAcessosRepositorio.save(acesso);
  }

  private async validarRelacionamentos(dados: CriarUsuarioAcessoDto) {
    const usuario = await this.usuariosRepositorio.findOneBy({ id: dados.usuarioId });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const perfil = await this.perfisRepositorio.findOneBy({ id: dados.perfilId });
    if (!perfil) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    const secretaria = dados.secretariaId
      ? await this.secretariasRepositorio.findOneBy({ id: dados.secretariaId })
      : null;

    if (dados.secretariaId && !secretaria) {
      throw new NotFoundException('Secretaria não encontrada.');
    }

    const escola = dados.escolaId
      ? await this.escolasRepositorio.findOneBy({ id: dados.escolaId })
      : null;

    if (dados.escolaId && !escola) {
      throw new NotFoundException('Escola não encontrada.');
    }

    if (escola && !dados.secretariaId) {
      throw new BadRequestException('Acesso com escola deve informar secretaria.');
    }

    if (escola && dados.secretariaId !== escola.secretariaId) {
      throw new BadRequestException('Escola não pertence à secretaria informada.');
    }

    const anoLetivo = dados.anoLetivoId
      ? await this.anosLetivosRepositorio.findOneBy({ id: dados.anoLetivoId })
      : null;

    if (dados.anoLetivoId && !anoLetivo) {
      throw new NotFoundException('Ano letivo não encontrado.');
    }

    if (anoLetivo && dados.secretariaId && anoLetivo.secretariaId !== dados.secretariaId) {
      throw new BadRequestException('Ano letivo não pertence à secretaria informada.');
    }
  }

  private async garantirAcessoNaoDuplicado(
    dados: CriarUsuarioAcessoDto,
    ignorarId?: string,
  ) {
    const consulta = this.usuarioAcessosRepositorio
      .createQueryBuilder('acesso')
      .where('acesso.usuario_id = :usuarioId', { usuarioId: dados.usuarioId })
      .andWhere('acesso.perfil_id = :perfilId', { perfilId: dados.perfilId })
      .andWhere(this.condicaoEscopo('secretaria_id', dados.secretariaId))
      .andWhere(this.condicaoEscopo('escola_id', dados.escolaId))
      .andWhere(this.condicaoEscopo('ano_letivo_id', dados.anoLetivoId));

    if (ignorarId) {
      consulta.andWhere('acesso.id != :ignorarId', { ignorarId });
    }

    const existente = await consulta.getOne();

    if (existente) {
      throw new BadRequestException('Já existe acesso para este usuário, perfil e escopo.');
    }
  }

  private condicaoEscopo(coluna: string, valor?: string | null) {
    return valor
      ? `acesso.${coluna} = '${valor}'`
      : `acesso.${coluna} IS NULL`;
  }
}
