import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
import { Perfil } from '../perfis-permissoes/perfis-permissoes.entities';
import { Secretaria } from '../secretarias/secretarias.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { AtualizarEscolaDto, CriarEscolaDto } from './escolas.dto';
import { Escola } from './escolas.entities';

@Injectable()
export class EscolasService {
  constructor(
    @InjectRepository(Escola)
    private readonly escolasRepositorio: Repository<Escola>,
    @InjectRepository(Secretaria)
    private readonly secretariasRepositorio: Repository<Secretaria>,
    @InjectRepository(Usuario)
    private readonly usuariosRepositorio: Repository<Usuario>,
    @InjectRepository(Perfil)
    private readonly perfisRepositorio: Repository<Perfil>,
    @InjectRepository(UsuarioAcesso)
    private readonly usuarioAcessosRepositorio: Repository<UsuarioAcesso>,
    private readonly escopoUsuarioService: EscopoUsuarioService,
  ) {}

  async criar(dados: CriarEscolaDto, usuarioId: string) {
    await this.garantirSecretariaExiste(dados.secretariaId);
    await this.escopoUsuarioService.garantirSecretariaPermitida(
      usuarioId,
      dados.secretariaId,
    );
    await this.garantirDiretorExiste(dados.diretorId);

    const escola = this.escolasRepositorio.create({
      ...dados,
      tipoEscola: dados.tipoEscola ?? null,
      modalidadesEnsino: dados.modalidadesEnsino ?? null,
      diretorId: dados.diretorId ?? null,
      observacoes: dados.observacoes ?? null,
      uf: dados.uf?.toUpperCase(),
      ativa: dados.ativa ?? true,
    });

    const escolaSalva = await this.escolasRepositorio.save(escola);
    await this.sincronizarDiretorGestorEscolar(
      null,
      escolaSalva.diretorId,
      escolaSalva,
      null,
    );

    return this.buscarPorId(escolaSalva.id, usuarioId);
  }

  async listar(usuarioId: string) {
    const where = await this.escopoUsuarioService.filtroEscolas(usuarioId);

    if (where === null) {
      return [];
    }

    const escolas = await this.escolasRepositorio.find({
      where,
      relations: {
        secretaria: true,
        diretor: true,
      },
      order: {
        nome: 'ASC',
      },
    });

    return escolas.map((escola) => this.serializarEscola(escola));
  }

  async buscarPorId(id: string, usuarioId: string) {
    return this.serializarEscola(await this.buscarEntidadePorId(id, usuarioId));
  }

  private async buscarEntidadePorId(id: string, usuarioId: string) {
    const escola = await this.escolasRepositorio.findOne({
      where: { id },
      relations: {
        secretaria: true,
        diretor: true,
      },
    });

    if (!escola) {
      throw new NotFoundException('Escola nao encontrada.');
    }

    await this.escopoUsuarioService.garantirEscolaPermitida(usuarioId, escola);

    return escola;
  }

  async atualizar(id: string, dados: AtualizarEscolaDto, usuarioId: string) {
    const escola = await this.buscarEntidadePorId(id, usuarioId);
    const diretorAnteriorId = escola.diretorId;
    const secretariaAnteriorId = escola.secretariaId;

    if (dados.secretariaId) {
      await this.garantirSecretariaExiste(dados.secretariaId);
      await this.escopoUsuarioService.garantirSecretariaPermitida(
        usuarioId,
        dados.secretariaId,
      );
    }

    if (dados.diretorId !== undefined) {
      await this.garantirDiretorExiste(dados.diretorId);
    }

    const dadosAtualizados = {
      secretariaId:
        dados.secretariaId === undefined ? escola.secretariaId : dados.secretariaId,
      nome: dados.nome === undefined ? escola.nome : dados.nome,
      codigoInep:
        dados.codigoInep === undefined ? escola.codigoInep : dados.codigoInep ?? null,
      tipoEscola:
        dados.tipoEscola === undefined ? escola.tipoEscola : dados.tipoEscola ?? null,
      modalidadesEnsino:
        dados.modalidadesEnsino === undefined
          ? escola.modalidadesEnsino
          : dados.modalidadesEnsino ?? null,
      diretorId:
        dados.diretorId === undefined ? escola.diretorId : dados.diretorId ?? null,
      cnpj: dados.cnpj === undefined ? escola.cnpj : dados.cnpj ?? null,
      telefone:
        dados.telefone === undefined ? escola.telefone : dados.telefone ?? null,
      email: dados.email === undefined ? escola.email : dados.email ?? null,
      cep: dados.cep === undefined ? escola.cep : dados.cep ?? null,
      endereco:
        dados.endereco === undefined ? escola.endereco : dados.endereco ?? null,
      numero: dados.numero === undefined ? escola.numero : dados.numero ?? null,
      complemento:
        dados.complemento === undefined
          ? escola.complemento
          : dados.complemento ?? null,
      bairro: dados.bairro === undefined ? escola.bairro : dados.bairro ?? null,
      municipio:
        dados.municipio === undefined ? escola.municipio : dados.municipio ?? null,
      observacoes:
        dados.observacoes === undefined
          ? escola.observacoes
          : dados.observacoes ?? null,
      uf: dados.uf?.toUpperCase() ?? escola.uf,
      ativa: dados.ativa ?? escola.ativa,
    };

    await this.escolasRepositorio.update(id, dadosAtualizados);
    await this.sincronizarDiretorGestorEscolar(
      diretorAnteriorId,
      dadosAtualizados.diretorId,
      {
        id: escola.id,
        secretariaId: dadosAtualizados.secretariaId,
      },
      secretariaAnteriorId,
    );

    return this.buscarPorId(id, usuarioId);
  }

  async remover(id: string, usuarioId: string) {
    const escola = await this.buscarEntidadePorId(id, usuarioId);
    await this.escolasRepositorio.remove(escola);

    return { mensagem: 'Escola removida com sucesso.' };
  }

  async inativar(id: string, usuarioId: string) {
    const escola = await this.buscarEntidadePorId(id, usuarioId);
    escola.ativa = false;

    const escolaSalva = await this.escolasRepositorio.save(escola);

    return this.buscarPorId(escolaSalva.id, usuarioId);
  }

  private async garantirSecretariaExiste(secretariaId: string) {
    const secretaria = await this.secretariasRepositorio.findOneBy({
      id: secretariaId,
    });

    if (!secretaria) {
      throw new NotFoundException('Secretaria nao encontrada.');
    }
  }

  private serializarEscola(escola: Escola) {
    return {
      ...escola,
      diretor: escola.diretor
        ? {
            id: escola.diretor.id,
            nome: escola.diretor.nome,
            email: escola.diretor.email,
            username: escola.diretor.username,
            cpf: escola.diretor.cpf,
            ativo: escola.diretor.ativo,
          }
        : null,
    };
  }

  private async garantirDiretorExiste(diretorId?: string | null) {
    if (!diretorId) {
      return;
    }

    const diretor = await this.usuariosRepositorio.findOneBy({ id: diretorId });

    if (!diretor) {
      throw new NotFoundException('Diretor nao encontrado.');
    }
  }

  private async sincronizarDiretorGestorEscolar(
    diretorAnteriorId: string | null,
    diretorAtualId: string | null,
    escola: { id: string; secretariaId: string },
    secretariaAnteriorId: string | null,
  ) {
    if (!diretorAnteriorId && !diretorAtualId) {
      return;
    }

    if (
      diretorAnteriorId === diretorAtualId &&
      secretariaAnteriorId === escola.secretariaId
    ) {
      return;
    }

    const perfilGestor = await this.buscarPerfilGestorEscolar();

    if (diretorAnteriorId) {
      await this.usuarioAcessosRepositorio.delete({
        usuarioId: diretorAnteriorId,
        perfilId: perfilGestor.id,
        escolaId: escola.id,
      });
    }

    if (!diretorAtualId) {
      return;
    }

    const acessoExistente = await this.usuarioAcessosRepositorio.findOne({
      where: {
        usuarioId: diretorAtualId,
        perfilId: perfilGestor.id,
        secretariaId: escola.secretariaId,
        escolaId: escola.id,
      },
    });

    if (acessoExistente) {
      acessoExistente.ativo = true;
      await this.usuarioAcessosRepositorio.save(acessoExistente);
      return;
    }

    await this.usuarioAcessosRepositorio.save(
      this.usuarioAcessosRepositorio.create({
        usuarioId: diretorAtualId,
        perfilId: perfilGestor.id,
        secretariaId: escola.secretariaId,
        escolaId: escola.id,
        ativo: true,
      }),
    );
  }

  private async buscarPerfilGestorEscolar() {
    const perfil = await this.perfisRepositorio.findOneBy({
      codigo: 'GESTOR_ESCOLAR',
    });

    if (!perfil) {
      throw new NotFoundException('Perfil GESTOR_ESCOLAR nao encontrado.');
    }

    return perfil;
  }
}
