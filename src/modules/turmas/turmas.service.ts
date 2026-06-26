import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
import { Escola } from '../escolas/escolas.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { AtualizarTurmaDto, CriarTurmaDto } from './turmas.dto';
import { Turma } from './turmas.entities';

@Injectable()
export class TurmasService {
  constructor(
    @InjectRepository(Turma)
    private readonly turmasRepositorio: Repository<Turma>,
    @InjectRepository(Escola)
    private readonly escolasRepositorio: Repository<Escola>,
    @InjectRepository(Usuario)
    private readonly usuariosRepositorio: Repository<Usuario>,
    @InjectRepository(UsuarioAcesso)
    private readonly usuarioAcessosRepositorio: Repository<UsuarioAcesso>,
    private readonly escopoUsuarioService: EscopoUsuarioService,
  ) {}

  async criar(dados: CriarTurmaDto, usuarioId: string) {
    const escola = await this.buscarEscola(dados.escolaId);
    await this.escopoUsuarioService.garantirEscolaPermitida(usuarioId, escola);
    await this.validarProfessorRegente(dados.professorRegenteId);
    await this.garantirTurmaNaoDuplicada(
      dados.escolaId,
      dados.anoLetivo,
      dados.nome,
    );

    const turma = this.turmasRepositorio.create({
      ...dados,
      salaReferencia: dados.salaReferencia ?? null,
      professorRegenteId: dados.professorRegenteId ?? null,
      ativa: dados.ativa ?? true,
    });

    return this.turmasRepositorio.save(turma);
  }

  async listar(usuarioId: string) {
    const where = await this.filtroTurmasPermitidas(usuarioId);

    if (where === null) {
      return [];
    }

    return this.turmasRepositorio.find({
      where,
      relations: {
        escola: true,
        professorRegente: true,
      },
      order: {
        anoLetivo: 'DESC',
        nome: 'ASC',
      },
    });
  }

  async buscarPorId(id: string, usuarioId: string) {
    const turma = await this.turmasRepositorio.findOne({
      where: { id },
      relations: {
        escola: true,
        professorRegente: true,
      },
    });

    if (!turma) {
      throw new NotFoundException('Turma nao encontrada.');
    }

    await this.escopoUsuarioService.garantirEscolaPermitida(
      usuarioId,
      turma.escola,
    );

    return turma;
  }

  async atualizar(id: string, dados: AtualizarTurmaDto, usuarioId: string) {
    const turma = await this.buscarPorId(id, usuarioId);
    const escolaId = dados.escolaId ?? turma.escolaId;
    const anoLetivo = dados.anoLetivo ?? turma.anoLetivo;
    const nome = dados.nome ?? turma.nome;

    if (dados.escolaId) {
      const escola = await this.buscarEscola(dados.escolaId);
      await this.escopoUsuarioService.garantirEscolaPermitida(usuarioId, escola);
    }

    await this.validarProfessorRegente(dados.professorRegenteId);
    await this.garantirTurmaNaoDuplicada(escolaId, anoLetivo, nome, id);

    Object.assign(turma, {
      ...dados,
      salaReferencia:
        dados.salaReferencia === undefined
          ? turma.salaReferencia
          : dados.salaReferencia ?? null,
      professorRegenteId:
        dados.professorRegenteId === undefined
          ? turma.professorRegenteId
          : dados.professorRegenteId ?? null,
    });

    return this.turmasRepositorio.save(turma);
  }

  async inativar(id: string, usuarioId: string) {
    const turma = await this.buscarPorId(id, usuarioId);
    turma.ativa = false;

    return this.turmasRepositorio.save(turma);
  }

  async remover(id: string, usuarioId: string) {
    const turma = await this.buscarPorId(id, usuarioId);
    await this.turmasRepositorio.remove(turma);

    return { mensagem: 'Turma removida com sucesso.' };
  }

  private async buscarEscola(escolaId: string) {
    const escola = await this.escolasRepositorio.findOneBy({ id: escolaId });

    if (!escola) {
      throw new NotFoundException('Escola nao encontrada.');
    }

    return escola;
  }

  private async validarProfessorRegente(professorRegenteId?: string | null) {
    if (!professorRegenteId) {
      return;
    }

    const professor = await this.usuariosRepositorio.findOneBy({
      id: professorRegenteId,
      ativo: true,
    });

    if (!professor) {
      throw new NotFoundException('Professor regente nao encontrado.');
    }

    const acessosProfessor = await this.usuarioAcessosRepositorio.find({
      where: {
        usuarioId: professorRegenteId,
        ativo: true,
      },
      relations: {
        perfil: true,
      },
    });

    const possuiPerfilProfessor = acessosProfessor.some(
      (acesso) => acesso.perfil?.ativo && acesso.perfil.codigo === 'PROFESSOR',
    );

    if (!possuiPerfilProfessor) {
      throw new BadRequestException(
        'Professor regente deve possuir perfil PROFESSOR ativo.',
      );
    }
  }

  private async garantirTurmaNaoDuplicada(
    escolaId: string,
    anoLetivo: number,
    nome: string,
    ignorarId?: string,
  ) {
    const consulta = this.turmasRepositorio
      .createQueryBuilder('turma')
      .where('turma.escola_id = :escolaId', { escolaId })
      .andWhere('turma.ano_letivo = :anoLetivo', { anoLetivo })
      .andWhere('turma.nome = :nome', { nome });

    if (ignorarId) {
      consulta.andWhere('turma.id != :ignorarId', { ignorarId });
    }

    const existente = await consulta.getOne();

    if (existente) {
      throw new BadRequestException(
        'Ja existe turma com este nome para a escola e ano letivo informados.',
      );
    }
  }

  private async filtroTurmasPermitidas(usuarioId: string) {
    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioId);

    if (escopo.global) {
      return undefined;
    }

    const filtros = [];

    if (escopo.escolaIds.length > 0) {
      filtros.push({ escolaId: In(escopo.escolaIds) });
    }

    if (escopo.secretariaIds.length > 0) {
      const escolas = await this.escolasRepositorio.find({
        where: { secretariaId: In(escopo.secretariaIds) },
        select: { id: true },
      });
      const escolaIds = escolas.map((escola) => escola.id);

      if (escolaIds.length > 0) {
        filtros.push({ escolaId: In(escolaIds) });
      }
    }

    return filtros.length > 0 ? filtros : null;
  }
}
