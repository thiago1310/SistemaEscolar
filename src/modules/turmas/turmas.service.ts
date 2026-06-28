import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
import { Disciplina } from '../disciplinas/disciplinas.entities';
import { Escola } from '../escolas/escolas.entities';
import { Professor } from '../professores/professores.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import {
  AtualizarTurmaDto,
  AtualizarVinculoDocenteTurmaDto,
  CriarTurmaDto,
  CriarVinculoDocenteTurmaDto,
} from './turmas.dto';
import { Turma, TurmaVinculoDocente } from './turmas.entities';

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
    @InjectRepository(Disciplina)
    private readonly disciplinasRepositorio: Repository<Disciplina>,
    @InjectRepository(Professor)
    private readonly professoresRepositorio: Repository<Professor>,
    @InjectRepository(TurmaVinculoDocente)
    private readonly vinculosDocentesRepositorio: Repository<TurmaVinculoDocente>,
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

  async listarVinculosDocentes(turmaId: string, usuarioId: string) {
    await this.buscarPorId(turmaId, usuarioId);

    const vinculos = await this.vinculosDocentesRepositorio.find({
      where: { turmaId },
      relations: {
        turma: true,
        professor: { usuario: true },
        disciplina: true,
      },
      order: { createdAt: 'DESC' },
    });

    return vinculos.map((vinculo) => this.serializarVinculoDocente(vinculo));
  }

  async criarVinculoDocente(
    turmaId: string,
    dados: CriarVinculoDocenteTurmaDto,
    usuarioId: string,
  ) {
    const turma = await this.buscarPorId(turmaId, usuarioId);
    await this.validarDadosVinculoDocente(turma, dados.professorId, dados.disciplinaId);

    const vinculoExistente = await this.vinculosDocentesRepositorio.findOne({
      where: {
        turmaId,
        professorId: dados.professorId,
        disciplinaId: dados.disciplinaId,
      },
    });

    if (vinculoExistente) {
      Object.assign(vinculoExistente, {
        cargaHorariaSemanal: dados.cargaHorariaSemanal,
        ativo: dados.ativo ?? true,
      });

      await this.vinculosDocentesRepositorio.save(vinculoExistente);
      return this.buscarVinculoDocentePorId(turmaId, vinculoExistente.id, usuarioId);
    }

    const vinculo = await this.vinculosDocentesRepositorio.save(
      this.vinculosDocentesRepositorio.create({
        turmaId,
        professorId: dados.professorId,
        disciplinaId: dados.disciplinaId,
        cargaHorariaSemanal: dados.cargaHorariaSemanal,
        ativo: dados.ativo ?? true,
      }),
    );

    return this.buscarVinculoDocentePorId(turmaId, vinculo.id, usuarioId);
  }

  async atualizarVinculoDocente(
    turmaId: string,
    vinculoId: string,
    dados: AtualizarVinculoDocenteTurmaDto,
    usuarioId: string,
  ) {
    const turma = await this.buscarPorId(turmaId, usuarioId);
    const vinculo = await this.obterVinculoDocente(turmaId, vinculoId);
    const professorId = dados.professorId ?? vinculo.professorId;
    const disciplinaId = dados.disciplinaId ?? vinculo.disciplinaId;

    await this.validarDadosVinculoDocente(turma, professorId, disciplinaId);
    await this.garantirVinculoDocenteNaoDuplicado(
      turmaId,
      professorId,
      disciplinaId,
      vinculoId,
    );

    Object.assign(vinculo, {
      professorId,
      disciplinaId,
      cargaHorariaSemanal:
        dados.cargaHorariaSemanal ?? vinculo.cargaHorariaSemanal,
      ativo: dados.ativo ?? vinculo.ativo,
    });

    await this.vinculosDocentesRepositorio.save(vinculo);
    return this.buscarVinculoDocentePorId(turmaId, vinculoId, usuarioId);
  }

  async removerVinculoDocente(
    turmaId: string,
    vinculoId: string,
    usuarioId: string,
  ) {
    await this.buscarPorId(turmaId, usuarioId);
    const vinculo = await this.obterVinculoDocente(turmaId, vinculoId);
    await this.vinculosDocentesRepositorio.remove(vinculo);

    return { mensagem: 'Vinculo docente removido com sucesso.' };
  }

  private async buscarVinculoDocentePorId(
    turmaId: string,
    vinculoId: string,
    usuarioId: string,
  ) {
    await this.buscarPorId(turmaId, usuarioId);
    const vinculo = await this.vinculosDocentesRepositorio.findOne({
      where: { id: vinculoId, turmaId },
      relations: {
        turma: true,
        professor: { usuario: true },
        disciplina: true,
      },
    });

    if (!vinculo) {
      throw new NotFoundException('Vinculo docente da turma nao encontrado.');
    }

    return this.serializarVinculoDocente(vinculo);
  }

  private async buscarEscola(escolaId: string) {
    const escola = await this.escolasRepositorio.findOneBy({ id: escolaId });

    if (!escola) {
      throw new NotFoundException('Escola nao encontrada.');
    }

    return escola;
  }

  private async validarDadosVinculoDocente(
    turma: Turma,
    professorId: string,
    disciplinaId: string,
  ) {
    const disciplina = await this.disciplinasRepositorio.findOneBy({
      id: disciplinaId,
      ativa: true,
    });

    if (!disciplina) {
      throw new NotFoundException('Disciplina nao encontrada.');
    }

    if (disciplina.secretariaId !== turma.escola.secretariaId) {
      throw new BadRequestException(
        'Disciplina deve pertencer a mesma secretaria da escola da turma.',
      );
    }

    const professor = await this.professoresRepositorio.findOne({
      where: { id: professorId, ativo: true },
      relations: { usuario: true },
    });

    if (!professor || !professor.usuario?.ativo) {
      throw new NotFoundException('Professor nao encontrado.');
    }

    const acessos = await this.usuarioAcessosRepositorio.find({
      where: { usuarioId: professor.usuarioId, ativo: true },
      relations: { perfil: true },
    });
    const acessosProfessor = acessos.filter(
      (acesso) => acesso.perfil?.ativo && acesso.perfil.codigo === 'PROFESSOR',
    );

    if (acessosProfessor.length === 0) {
      throw new BadRequestException(
        'Professor deve possuir perfil PROFESSOR ativo.',
      );
    }

    const possuiAcessoNaTurma = acessosProfessor.some(
      (acesso) =>
        (!acesso.secretariaId && !acesso.escolaId) ||
        acesso.escolaId === turma.escolaId ||
        acesso.secretariaId === turma.escola.secretariaId,
    );

    if (!possuiAcessoNaTurma) {
      throw new ForbiddenException(
        'Professor nao possui acesso a escola ou secretaria da turma.',
      );
    }
  }

  private async obterVinculoDocente(turmaId: string, vinculoId: string) {
    const vinculo = await this.vinculosDocentesRepositorio.findOne({
      where: { id: vinculoId, turmaId },
    });

    if (!vinculo) {
      throw new NotFoundException('Vinculo docente da turma nao encontrado.');
    }

    return vinculo;
  }

  private async garantirVinculoDocenteNaoDuplicado(
    turmaId: string,
    professorId: string,
    disciplinaId: string,
    ignorarId?: string,
  ) {
    const consulta = this.vinculosDocentesRepositorio
      .createQueryBuilder('vinculo')
      .where('vinculo.turma_id = :turmaId', { turmaId })
      .andWhere('vinculo.professor_id = :professorId', { professorId })
      .andWhere('vinculo.disciplina_id = :disciplinaId', { disciplinaId });

    if (ignorarId) {
      consulta.andWhere('vinculo.id != :ignorarId', { ignorarId });
    }

    const existente = await consulta.getOne();

    if (existente) {
      throw new BadRequestException(
        'Ja existe vinculo docente para esta turma, professor e disciplina.',
      );
    }
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

    if (escopo.escolaIds.length > 0) {
      return { escolaId: In(escopo.escolaIds) };
    }

    if (escopo.secretariaIds.length > 0) {
      const escolas = await this.escolasRepositorio.find({
        where: { secretariaId: In(escopo.secretariaIds) },
        select: { id: true },
      });
      const escolaIds = escolas.map((escola) => escola.id);

      if (escolaIds.length > 0) {
        return { escolaId: In(escolaIds) };
      }
    }

    return null;
  }

  private serializarVinculoDocente(vinculo: TurmaVinculoDocente) {
    return {
      id: vinculo.id,
      turmaId: vinculo.turmaId,
      professorId: vinculo.professorId,
      disciplinaId: vinculo.disciplinaId,
      cargaHorariaSemanal: vinculo.cargaHorariaSemanal,
      ativo: vinculo.ativo,
      anoLetivo: vinculo.turma?.anoLetivo,
      professor: vinculo.professor
        ? {
            id: vinculo.professor.id,
            usuarioId: vinculo.professor.usuarioId,
            matricula: vinculo.professor.matricula,
            nome: vinculo.professor.usuario?.nome,
            email: vinculo.professor.usuario?.email,
          }
        : null,
      disciplina: vinculo.disciplina
        ? {
            id: vinculo.disciplina.id,
            nome: vinculo.disciplina.nome,
            secretariaId: vinculo.disciplina.secretariaId,
            ativa: vinculo.disciplina.ativa,
          }
        : null,
      createdAt: vinculo.createdAt,
      updatedAt: vinculo.updatedAt,
    };
  }
}
