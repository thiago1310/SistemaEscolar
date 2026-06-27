import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
import { Escola } from '../escolas/escolas.entities';
import { AtualizarAlunoDto, CriarAlunoDto } from './alunos.dto';
import { Aluno } from './alunos.entities';

@Injectable()
export class AlunosService {
  constructor(
    @InjectRepository(Aluno)
    private readonly alunosRepositorio: Repository<Aluno>,
    @InjectRepository(Escola)
    private readonly escolasRepositorio: Repository<Escola>,
    private readonly escopoUsuarioService: EscopoUsuarioService,
  ) {}

  async criar(dados: CriarAlunoDto, usuarioId: string) {
    const escolaId = await this.normalizarEscolaId(dados.escolaId, usuarioId);

    const aluno = this.alunosRepositorio.create({
      nomeCompleto: dados.nomeCompleto,
      escolaId,
      cpfOuCertidao: dados.cpfOuCertidao ?? null,
      dataNascimento: dados.dataNascimento ?? null,
      responsavelNome: dados.responsavelNome ?? null,
      responsavelTelefone: dados.responsavelTelefone ?? null,
      ativo: dados.ativo ?? true,
    });

    const alunoSalvo = await this.alunosRepositorio.save(aluno);

    return this.buscarPorId(alunoSalvo.id, usuarioId);
  }

  async listar(usuarioId: string) {
    const where = await this.filtroAlunosPermitidos(usuarioId);

    if (where === null) {
      return [];
    }

    return this.alunosRepositorio.find({
      where,
      relations: {
        escola: true,
      },
      order: {
        nomeCompleto: 'ASC',
      },
    });
  }

  async buscarPorId(id: string, usuarioId: string) {
    const aluno = await this.alunosRepositorio.findOne({
      where: { id },
      relations: {
        escola: true,
      },
    });

    if (!aluno) {
      throw new NotFoundException('Aluno nao encontrado.');
    }

    await this.garantirAlunoPermitido(aluno, usuarioId);

    return aluno;
  }

  async atualizar(id: string, dados: AtualizarAlunoDto, usuarioId: string) {
    const aluno = await this.buscarPorId(id, usuarioId);
    const escolaId =
      dados.escolaId === undefined
        ? aluno.escolaId
        : await this.normalizarEscolaId(dados.escolaId, usuarioId);

    Object.assign(aluno, {
      escolaId,
      nomeCompleto:
        dados.nomeCompleto === undefined ? aluno.nomeCompleto : dados.nomeCompleto,
      cpfOuCertidao:
        dados.cpfOuCertidao === undefined
          ? aluno.cpfOuCertidao
          : dados.cpfOuCertidao ?? null,
      dataNascimento:
        dados.dataNascimento === undefined
          ? aluno.dataNascimento
          : dados.dataNascimento ?? null,
      responsavelNome:
        dados.responsavelNome === undefined
          ? aluno.responsavelNome
          : dados.responsavelNome ?? null,
      responsavelTelefone:
        dados.responsavelTelefone === undefined
          ? aluno.responsavelTelefone
          : dados.responsavelTelefone ?? null,
      ativo: dados.ativo ?? aluno.ativo,
    });

    const alunoSalvo = await this.alunosRepositorio.save(aluno);

    return this.buscarPorId(alunoSalvo.id, usuarioId);
  }

  async inativar(id: string, usuarioId: string) {
    const aluno = await this.buscarPorId(id, usuarioId);
    aluno.ativo = false;

    const alunoSalvo = await this.alunosRepositorio.save(aluno);

    return this.buscarPorId(alunoSalvo.id, usuarioId);
  }

  async remover(id: string, usuarioId: string) {
    const aluno = await this.buscarPorId(id, usuarioId);
    await this.alunosRepositorio.remove(aluno);

    return { mensagem: 'Aluno removido com sucesso.' };
  }

  private async normalizarEscolaId(
    escolaId: string | null | undefined,
    usuarioId: string,
  ) {
    if (escolaId) {
      const escola = await this.buscarEscola(escolaId);
      await this.escopoUsuarioService.garantirEscolaPermitida(usuarioId, escola);
      return escola.id;
    }

    if (escolaId === null) {
      await this.escopoUsuarioService.garantirEscopoGlobal(usuarioId);
      return null;
    }

    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioId);

    if (escopo.global) {
      return null;
    }

    if (escopo.escolaIds.length === 1) {
      return escopo.escolaIds[0];
    }

    throw new BadRequestException(
      'Informe a escola do aluno para este escopo de usuario.',
    );
  }

  private async buscarEscola(escolaId: string) {
    const escola = await this.escolasRepositorio.findOneBy({ id: escolaId });

    if (!escola) {
      throw new NotFoundException('Escola nao encontrada.');
    }

    return escola;
  }

  private async garantirAlunoPermitido(aluno: Aluno, usuarioId: string) {
    if (!aluno.escolaId) {
      await this.escopoUsuarioService.garantirEscopoGlobal(usuarioId);
      return;
    }

    const escola = aluno.escola ?? (await this.buscarEscola(aluno.escolaId));
    await this.escopoUsuarioService.garantirEscolaPermitida(usuarioId, escola);
  }

  private async filtroAlunosPermitidos(usuarioId: string) {
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
