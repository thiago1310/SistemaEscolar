import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { In, IsNull, Repository } from 'typeorm';
import {
  OrigemAutenticacao,
  Usuario,
} from '../autenticacao/autenticacao.entities';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
import { EmailService } from '../email/email.service';
import { Escola } from '../escolas/escolas.entities';
import { Perfil } from '../perfis-permissoes/perfis-permissoes.entities';
import { Secretaria } from '../secretarias/secretarias.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { AtualizarProfessorDto, CriarProfessorDto } from './professores.dto';
import { Professor } from './professores.entities';

@Injectable()
export class ProfessoresService {
  constructor(
    @InjectRepository(Professor)
    private readonly professoresRepositorio: Repository<Professor>,
    @InjectRepository(Usuario)
    private readonly usuariosRepositorio: Repository<Usuario>,
    @InjectRepository(UsuarioAcesso)
    private readonly usuarioAcessosRepositorio: Repository<UsuarioAcesso>,
    @InjectRepository(Perfil)
    private readonly perfisRepositorio: Repository<Perfil>,
    @InjectRepository(Secretaria)
    private readonly secretariasRepositorio: Repository<Secretaria>,
    @InjectRepository(Escola)
    private readonly escolasRepositorio: Repository<Escola>,
    private readonly escopoUsuarioService: EscopoUsuarioService,
    private readonly emailService: EmailService,
  ) {}

  async criar(dados: CriarProfessorDto, usuarioExecutorId: string) {
    this.garantirIdentificador(dados.email, dados.username);
    this.garantirEmailParaBoasVindas(dados.email, dados.enviarEmailBoasVindas);

    const perfilProfessor = await this.buscarPerfilProfessor();
    const escopos = await this.normalizarEscoposProfessor(dados);
    for (const escopo of escopos) {
      await this.validarEscopoAcessoProfessor(
        usuarioExecutorId,
        perfilProfessor,
        escopo,
      );
    }

    const professorPorMatricula = dados.matricula
      ? await this.professoresRepositorio.findOne({
          where: { matricula: dados.matricula },
          relations: { usuario: true },
        })
      : null;
    const usuarioExistente = await this.buscarUsuarioPorIdentificadores(
      dados.email,
      dados.username,
      dados.cpf,
    );

    if (
      professorPorMatricula &&
      usuarioExistente &&
      professorPorMatricula.usuarioId !== usuarioExistente.id
    ) {
      throw new BadRequestException(
        'Matricula e identificadores pertencem a usuarios diferentes.',
      );
    }

    const usuarioBase = professorPorMatricula?.usuario ?? usuarioExistente;
    const senhaTemporaria = this.gerarSenhaTemporaria();
    const agora = new Date();
    const usuario = usuarioBase
      ? await this.usuariosRepositorio.save(
          Object.assign(usuarioBase, {
            nome: dados.nome,
            cpf: dados.cpf === undefined ? usuarioBase.cpf : dados.cpf ?? null,
            email:
              dados.email === undefined ? usuarioBase.email : dados.email ?? null,
            telefone:
              dados.telefone === undefined
                ? usuarioBase.telefone
                : dados.telefone ?? null,
            dataNascimento:
              dados.dataNascimento === undefined
                ? usuarioBase.dataNascimento
                : dados.dataNascimento ?? null,
            cargo: dados.cargo ?? usuarioBase.cargo ?? 'Professor',
            observacoes:
              dados.observacoes === undefined
                ? usuarioBase.observacoes
                : dados.observacoes ?? null,
            username:
              dados.username === undefined
                ? usuarioBase.username
                : dados.username ?? null,
            ativo: dados.ativo ?? true,
            updatedAt: agora,
            deletedAt: null,
          }),
        )
      : await this.usuariosRepositorio.save(
          this.usuariosRepositorio.create({
        nome: dados.nome,
        cpf: dados.cpf ?? null,
        email: dados.email ?? null,
        telefone: dados.telefone ?? null,
        dataNascimento: dados.dataNascimento ?? null,
        cargo: dados.cargo ?? 'Professor',
        observacoes: dados.observacoes ?? null,
        username: dados.username ?? null,
        senhaHash: await bcrypt.hash(senhaTemporaria, 12),
        origemAuth: OrigemAutenticacao.LOCAL,
        ativo: dados.ativo ?? true,
        primeiroAcesso: true,
        ultimoLoginAt: null,
        createdAt: agora,
        updatedAt: agora,
        deletedAt: null,
          }),
        );

    for (const escopo of escopos) {
      await this.salvarAcessoProfessor(usuario.id, perfilProfessor.id, escopo);
    }

    const professorExistente =
      professorPorMatricula ??
      (await this.professoresRepositorio.findOne({
        where: { usuarioId: usuario.id },
        relations: { usuario: true },
      }));

    await this.garantirMatriculaUnica(dados.matricula, professorExistente?.id);

    const professor = await this.professoresRepositorio.save(
      professorExistente
        ? Object.assign(professorExistente, {
            matricula:
              dados.matricula === undefined
                ? professorExistente.matricula
                : dados.matricula ?? null,
            dataAdmissao:
              dados.dataAdmissao === undefined
                ? professorExistente.dataAdmissao
                : dados.dataAdmissao ?? null,
            formacao:
              dados.formacao === undefined
                ? professorExistente.formacao
                : dados.formacao ?? null,
            ativo: dados.ativo ?? true,
          })
        : this.professoresRepositorio.create({
            usuarioId: usuario.id,
            matricula: dados.matricula ?? null,
            dataAdmissao: dados.dataAdmissao ?? null,
            formacao: dados.formacao ?? null,
            ativo: dados.ativo ?? true,
          }),
    );

    if (!usuarioBase && dados.enviarEmailBoasVindas) {
      await this.enviarEmailBoasVindas(usuario, senhaTemporaria);
    }

    const professorCompleto = await this.buscarProfessorCompleto(professor.id);

    return {
      ...this.serializarProfessor(professorCompleto),
      ...(!usuarioBase && !dados.enviarEmailBoasVindas ? { senhaTemporaria } : {}),
    };
  }

  async listar(usuarioExecutorId: string) {
    await this.sincronizarProfessoresComAcessosAtivos();

    const where = await this.filtroProfessoresGerenciaveis(usuarioExecutorId);

    if (where === null) {
      return [];
    }

    const professores = await this.professoresRepositorio.find({
      where,
      relations: { usuario: true },
      order: { createdAt: 'DESC' },
    });

    return professores.map((professor) => this.serializarProfessor(professor));
  }

  async buscarPorId(id: string, usuarioExecutorId: string) {
    const professor = await this.buscarProfessorCompleto(id);
    await this.garantirUsuarioGerenciavel(professor.usuarioId, usuarioExecutorId);

    return this.serializarProfessor(professor);
  }

  async atualizar(
    id: string,
    dados: AtualizarProfessorDto,
    usuarioExecutorId: string,
  ) {
    const professor = await this.buscarProfessorCompleto(id);
    await this.garantirUsuarioGerenciavel(professor.usuarioId, usuarioExecutorId);
    await this.garantirIdentificadoresUnicos(
      dados.email,
      dados.username,
      dados.cpf,
      professor.usuarioId,
    );
    await this.garantirMatriculaUnica(dados.matricula, professor.id);

    Object.assign(professor.usuario, {
      nome: dados.nome === undefined ? professor.usuario.nome : dados.nome,
      cpf:
        dados.cpf === undefined ? professor.usuario.cpf : dados.cpf ?? null,
      email:
        dados.email === undefined ? professor.usuario.email : dados.email ?? null,
      telefone:
        dados.telefone === undefined
          ? professor.usuario.telefone
          : dados.telefone ?? null,
      dataNascimento:
        dados.dataNascimento === undefined
          ? professor.usuario.dataNascimento
          : dados.dataNascimento ?? null,
      cargo:
        dados.cargo === undefined ? professor.usuario.cargo : dados.cargo ?? null,
      observacoes:
        dados.observacoes === undefined
          ? professor.usuario.observacoes
          : dados.observacoes ?? null,
      username:
        dados.username === undefined
          ? professor.usuario.username
          : dados.username ?? null,
      ativo:
        dados.ativo === undefined ? professor.usuario.ativo : dados.ativo,
      updatedAt: new Date(),
    });

    Object.assign(professor, {
      matricula:
        dados.matricula === undefined
          ? professor.matricula
          : dados.matricula ?? null,
      dataAdmissao:
        dados.dataAdmissao === undefined
          ? professor.dataAdmissao
          : dados.dataAdmissao ?? null,
      formacao:
        dados.formacao === undefined ? professor.formacao : dados.formacao ?? null,
      ativo: dados.ativo === undefined ? professor.ativo : dados.ativo,
    });

    await this.usuariosRepositorio.save(professor.usuario);
    const professorSalvo = await this.professoresRepositorio.save(professor);

    return this.serializarProfessor(professorSalvo);
  }

  async inativar(id: string, usuarioExecutorId: string) {
    const professor = await this.buscarProfessorCompleto(id);
    await this.garantirUsuarioGerenciavel(professor.usuarioId, usuarioExecutorId);

    professor.ativo = false;
    professor.usuario.ativo = false;
    professor.usuario.updatedAt = new Date();

    await this.usuariosRepositorio.save(professor.usuario);
    return this.serializarProfessor(await this.professoresRepositorio.save(professor));
  }

  async remover(id: string, usuarioExecutorId: string) {
    const professor = await this.buscarProfessorCompleto(id);
    await this.garantirUsuarioGerenciavel(professor.usuarioId, usuarioExecutorId);
    await this.professoresRepositorio.remove(professor);

    return { mensagem: 'Professor removido com sucesso.' };
  }

  async sincronizarUsuarioProfessor(usuarioId: string) {
    const possuiPerfilProfessorAtivo = await this.usuarioPossuiPerfilProfessorAtivo(
      usuarioId,
    );

    if (possuiPerfilProfessorAtivo) {
      await this.garantirProfessorPorUsuario(usuarioId);
      return;
    }

    await this.inativarPorUsuario(usuarioId);
  }

  private async sincronizarProfessoresComAcessosAtivos() {
    const acessos = await this.usuarioAcessosRepositorio.find({
      where: { ativo: true },
      relations: { perfil: true, usuario: true },
    });
    const usuarioIds = [
      ...new Set(
        acessos
          .filter(
            (acesso) =>
              acesso.perfil?.ativo &&
              acesso.perfil.codigo === 'PROFESSOR' &&
              acesso.usuario?.deletedAt === null,
          )
          .map((acesso) => acesso.usuarioId),
      ),
    ];

    for (const usuarioId of usuarioIds) {
      await this.garantirProfessorPorUsuario(usuarioId);
    }
  }

  async garantirProfessorPorUsuario(usuarioId: string) {
    const usuario = await this.usuariosRepositorio.findOneBy({
      id: usuarioId,
      deletedAt: IsNull(),
    });

    if (!usuario) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    const professor = await this.professoresRepositorio.findOne({
      where: { usuarioId },
    });

    if (professor) {
      if (!professor.ativo && usuario.ativo) {
        professor.ativo = true;
        await this.professoresRepositorio.save(professor);
      }
      return professor;
    }

    return this.professoresRepositorio.save(
      this.professoresRepositorio.create({
        usuarioId,
        matricula: null,
        dataAdmissao: null,
        formacao: null,
        ativo: usuario.ativo,
      }),
    );
  }

  async inativarPorUsuario(usuarioId: string) {
    const professor = await this.professoresRepositorio.findOne({
      where: { usuarioId },
    });

    if (!professor || !professor.ativo) {
      return;
    }

    professor.ativo = false;
    await this.professoresRepositorio.save(professor);
  }

  private async buscarProfessorCompleto(id: string) {
    const professor = await this.professoresRepositorio.findOne({
      where: { id },
      relations: { usuario: true },
    });

    if (!professor) {
      throw new NotFoundException('Professor nao encontrado.');
    }

    return professor;
  }

  private async buscarPerfilProfessor() {
    const perfil = await this.perfisRepositorio.findOneBy({
      codigo: 'PROFESSOR',
      ativo: true,
    });

    if (!perfil) {
      throw new NotFoundException('Perfil PROFESSOR nao encontrado.');
    }

    return perfil;
  }

  private async usuarioPossuiPerfilProfessorAtivo(usuarioId: string) {
    const acesso = await this.usuarioAcessosRepositorio.findOne({
      where: { usuarioId, ativo: true },
      relations: { perfil: true },
    });

    if (acesso?.perfil?.codigo === 'PROFESSOR' && acesso.perfil.ativo) {
      return true;
    }

    const acessos = await this.usuarioAcessosRepositorio.find({
      where: { usuarioId, ativo: true },
      relations: { perfil: true },
    });

    return acessos.some(
      (item) => item.perfil?.ativo && item.perfil.codigo === 'PROFESSOR',
    );
  }

  private async buscarUsuarioPorIdentificadores(
    email?: string | null,
    username?: string | null,
    cpf?: string | null,
  ) {
    const filtros = [];

    if (email) {
      filtros.push({ email });
    }

    if (username) {
      filtros.push({ username });
    }

    if (cpf) {
      filtros.push({ cpf });
    }

    if (filtros.length === 0) {
      return null;
    }

    const usuarios = await this.usuariosRepositorio.find({
      where: filtros,
    });
    const usuariosUnicos = [...new Map(usuarios.map((usuario) => [usuario.id, usuario])).values()];

    if (usuariosUnicos.length > 1) {
      throw new BadRequestException(
        'Email, username ou CPF informados pertencem a usuarios diferentes.',
      );
    }

    return usuariosUnicos[0] ?? null;
  }

  private async normalizarEscoposProfessor(dados: CriarProfessorDto) {
    const escolaIds = dados.escolaIds?.length
      ? dados.escolaIds
      : dados.escolaId
        ? [dados.escolaId]
        : [];

    if (escolaIds.length === 0) {
      return [
        {
          secretariaId: dados.secretariaId ?? null,
          escolaId: null,
        },
      ];
    }

    const escopos = [];

    for (const escolaId of [...new Set(escolaIds)]) {
      const escola = await this.escolasRepositorio.findOneBy({ id: escolaId });

      if (!escola) {
        throw new NotFoundException('Escola nao encontrada.');
      }

      if (dados.secretariaId && escola.secretariaId !== dados.secretariaId) {
        throw new BadRequestException('Escola nao pertence a secretaria informada.');
      }

      escopos.push({
        secretariaId: escola.secretariaId,
        escolaId: escola.id,
      });
    }

    return escopos;
  }

  private async salvarAcessoProfessor(
    usuarioId: string,
    perfilId: string,
    escopo: { secretariaId?: string | null; escolaId?: string | null },
  ) {
    const acessoExistente = await this.usuarioAcessosRepositorio
      .createQueryBuilder('acesso')
      .where('acesso.usuario_id = :usuarioId', { usuarioId })
      .andWhere('acesso.perfil_id = :perfilId', { perfilId })
      .andWhere(
        escopo.secretariaId
          ? 'acesso.secretaria_id = :secretariaId'
          : 'acesso.secretaria_id IS NULL',
        { secretariaId: escopo.secretariaId },
      )
      .andWhere(
        escopo.escolaId
          ? 'acesso.escola_id = :escolaId'
          : 'acesso.escola_id IS NULL',
        { escolaId: escopo.escolaId },
      )
      .getOne();

    if (acessoExistente) {
      Object.assign(acessoExistente, {
        secretariaId: escopo.secretariaId ?? null,
        escolaId: escopo.escolaId ?? null,
        ativo: true,
      });

      return this.usuarioAcessosRepositorio.save(acessoExistente);
    }

    return this.usuarioAcessosRepositorio.save(
      this.usuarioAcessosRepositorio.create({
        usuarioId,
        perfilId,
        secretariaId: escopo.secretariaId ?? null,
        escolaId: escopo.escolaId ?? null,
        ativo: true,
      }),
    );
  }

  private async validarEscopoAcessoProfessor(
    usuarioExecutorId: string,
    perfilProfessor: Perfil,
    dados: {
      secretariaId?: string | null;
      escolaId?: string | null;
    },
  ) {
    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioExecutorId);

    if (perfilProfessor.nivel > escopo.maiorNivel) {
      throw new ForbiddenException('Usuario nao pode conceder perfil superior.');
    }

    if (escopo.global) {
      await this.validarRelacionamentosEscopo(dados);
      return;
    }

    if (!dados.secretariaId && !dados.escolaId) {
      throw new ForbiddenException('Usuario sem permissao para gerenciar escopo global.');
    }

    if (
      dados.secretariaId &&
      !escopo.secretariaIds.includes(dados.secretariaId)
    ) {
      throw new ForbiddenException('Usuario sem acesso a esta secretaria.');
    }

    if (dados.escolaId && !escopo.escolaIds.includes(dados.escolaId)) {
      const escola = await this.escolasRepositorio.findOneBy({ id: dados.escolaId });

      if (!escola || !escopo.secretariaIds.includes(escola.secretariaId)) {
        throw new ForbiddenException('Usuario sem acesso a esta escola.');
      }
    }

    await this.validarRelacionamentosEscopo(dados);
  }

  private async validarRelacionamentosEscopo(dados: {
    secretariaId?: string | null;
    escolaId?: string | null;
  }) {
    const secretaria = dados.secretariaId
      ? await this.secretariasRepositorio.findOneBy({ id: dados.secretariaId })
      : null;

    if (dados.secretariaId && !secretaria) {
      throw new NotFoundException('Secretaria nao encontrada.');
    }

    const escola = dados.escolaId
      ? await this.escolasRepositorio.findOneBy({ id: dados.escolaId })
      : null;

    if (dados.escolaId && !escola) {
      throw new NotFoundException('Escola nao encontrada.');
    }

    if (escola && !dados.secretariaId) {
      throw new BadRequestException('Acesso com escola deve informar secretaria.');
    }

    if (escola && dados.secretariaId !== escola.secretariaId) {
      throw new BadRequestException('Escola nao pertence a secretaria informada.');
    }

  }

  private async filtroProfessoresGerenciaveis(usuarioExecutorId: string) {
    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioExecutorId);

    if (escopo.global) {
      return undefined;
    }

    const filtros = [];

    if (escopo.secretariaIds.length > 0) {
      filtros.push({ secretariaId: In(escopo.secretariaIds), ativo: true });
    }

    if (escopo.escolaIds.length > 0) {
      filtros.push({ escolaId: In(escopo.escolaIds), ativo: true });
    }

    if (filtros.length === 0) {
      return null;
    }

    const acessos = await this.usuarioAcessosRepositorio.find({
      where: filtros,
      relations: { perfil: true },
    });
    const usuarioIds = [
      ...new Set(
        acessos
          .filter((acesso) => acesso.perfil?.codigo === 'PROFESSOR')
          .map((acesso) => acesso.usuarioId),
      ),
    ];

    return usuarioIds.length > 0 ? { usuarioId: In(usuarioIds) } : null;
  }

  private async garantirUsuarioGerenciavel(
    usuarioId: string,
    usuarioExecutorId: string,
  ) {
    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioExecutorId);

    if (escopo.global) {
      return;
    }

    const filtros = [];

    if (escopo.secretariaIds.length > 0) {
      filtros.push({ usuarioId, secretariaId: In(escopo.secretariaIds), ativo: true });
    }

    if (escopo.escolaIds.length > 0) {
      filtros.push({ usuarioId, escolaId: In(escopo.escolaIds), ativo: true });
    }

    if (filtros.length === 0) {
      throw new ForbiddenException('Usuario sem permissao para gerenciar este professor.');
    }

    const acesso = await this.usuarioAcessosRepositorio.findOne({
      where: filtros,
    });

    if (!acesso) {
      throw new ForbiddenException('Usuario sem permissao para gerenciar este professor.');
    }
  }

  private garantirIdentificador(email?: string, username?: string) {
    if (!email && !username) {
      throw new BadRequestException('Informe email ou username para o usuario.');
    }
  }

  private garantirEmailParaBoasVindas(
    email?: string | null,
    enviarEmailBoasVindas?: boolean,
  ) {
    if (enviarEmailBoasVindas && !email) {
      throw new BadRequestException(
        'Informe o email do usuario para enviar o email de boas-vindas.',
      );
    }
  }

  private async garantirIdentificadoresUnicos(
    email?: string | null,
    username?: string | null,
    cpf?: string | null,
    ignorarId?: string,
  ) {
    const filtros = [];

    if (email) {
      filtros.push({ email });
    }

    if (username) {
      filtros.push({ username });
    }

    if (cpf) {
      filtros.push({ cpf });
    }

    if (filtros.length === 0) {
      return;
    }

    const existente = await this.usuariosRepositorio.findOne({ where: filtros });

    if (existente && existente.id !== ignorarId) {
      throw new BadRequestException('Ja existe usuario com email, username ou CPF informado.');
    }
  }

  private async garantirMatriculaUnica(matricula?: string | null, ignorarId?: string) {
    if (!matricula) {
      return;
    }

    const existente = await this.professoresRepositorio.findOneBy({ matricula });

    if (existente && existente.id !== ignorarId) {
      throw new BadRequestException('Ja existe professor com esta matricula.');
    }
  }

  private gerarSenhaTemporaria() {
    const caracteres =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
    const obrigatorios = [
      'ABCDEFGHJKLMNPQRSTUVWXYZ',
      'abcdefghijkmnopqrstuvwxyz',
      '23456789',
      '@#$%',
    ];
    const senha = obrigatorios.map((grupo) => this.sortearCaractere(grupo));

    while (senha.length < 12) {
      senha.push(this.sortearCaractere(caracteres));
    }

    return senha
      .map((caractere) => ({ caractere, ordem: randomInt(0, 1000) }))
      .sort((a, b) => a.ordem - b.ordem)
      .map((item) => item.caractere)
      .join('');
  }

  private sortearCaractere(caracteres: string) {
    return caracteres[randomInt(0, caracteres.length)];
  }

  private async enviarEmailBoasVindas(usuario: Usuario, senhaTemporaria: string) {
    if (!usuario.email) {
      throw new BadRequestException('Usuario sem email cadastrado.');
    }

    const usuarioAcesso = usuario.username ?? usuario.email;
    const texto = [
      `Ola, ${usuario.nome}.`,
      '',
      'Sua conta de professor foi criada no Sistema Escolar.',
      `Email cadastrado: ${usuario.email}`,
      `Usuario de acesso: ${usuarioAcesso}`,
      `Senha temporaria: ${senhaTemporaria}`,
      '',
      'No primeiro acesso, altere sua senha temporaria.',
    ].join('\n');
    const html = `
      <p>Ola, ${this.escaparHtml(usuario.nome)}.</p>
      <p>Sua conta de professor foi criada no Sistema Escolar.</p>
      <ul>
        <li><strong>Email cadastrado:</strong> ${this.escaparHtml(usuario.email)}</li>
        <li><strong>Usuario de acesso:</strong> ${this.escaparHtml(usuarioAcesso)}</li>
        <li><strong>Senha temporaria:</strong> ${this.escaparHtml(senhaTemporaria)}</li>
      </ul>
      <p>No primeiro acesso, altere sua senha temporaria.</p>
    `;

    await this.emailService.enviar({
      to: usuario.email,
      subject: 'Bem-vindo ao Sistema Escolar',
      text: texto,
      html,
    });
  }

  private serializarProfessor(professor: Professor) {
    return {
      id: professor.id,
      usuarioId: professor.usuarioId,
      matricula: professor.matricula,
      dataAdmissao: professor.dataAdmissao,
      formacao: professor.formacao,
      ativo: professor.ativo,
      usuario: professor.usuario
        ? {
            id: professor.usuario.id,
            nome: professor.usuario.nome,
            cpf: professor.usuario.cpf,
            email: professor.usuario.email,
            telefone: professor.usuario.telefone,
            dataNascimento: professor.usuario.dataNascimento,
            cargo: professor.usuario.cargo,
            observacoes: professor.usuario.observacoes,
            username: professor.usuario.username,
            ativo: professor.usuario.ativo,
            primeiroAcesso: professor.usuario.primeiroAcesso,
          }
        : null,
      createdAt: professor.createdAt,
      updatedAt: professor.updatedAt,
    };
  }

  private escaparHtml(valor: string) {
    return valor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
