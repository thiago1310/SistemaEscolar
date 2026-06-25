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
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import {
  AtualizarUsuarioDto,
  CriarUsuarioDto,
  RedefinirSenhaUsuarioDto,
} from './usuarios.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepositorio: Repository<Usuario>,
    @InjectRepository(UsuarioAcesso)
    private readonly usuarioAcessosRepositorio: Repository<UsuarioAcesso>,
    private readonly escopoUsuarioService: EscopoUsuarioService,
    private readonly emailService: EmailService,
  ) {}

  async criar(dados: CriarUsuarioDto) {
    this.garantirIdentificador(dados.email, dados.username);
    this.garantirEmailParaBoasVindas(dados.email, dados.enviarEmailBoasVindas);
    await this.garantirIdentificadoresUnicos(dados.email, dados.username, dados.cpf);

    const agora = new Date();
    const senhaTemporaria = this.gerarSenhaTemporaria();
    const usuario = this.usuariosRepositorio.create({
      nome: dados.nome,
      cpf: dados.cpf ?? null,
      email: dados.email ?? null,
      telefone: dados.telefone ?? null,
      dataNascimento: dados.dataNascimento ?? null,
      cargo: dados.cargo ?? null,
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
    });

    const usuarioSalvo = await this.usuariosRepositorio.save(usuario);

    if (dados.enviarEmailBoasVindas) {
      await this.enviarEmailBoasVindas(usuarioSalvo, senhaTemporaria);
    }

    return {
      ...this.serializarUsuario(usuarioSalvo),
      ...(dados.enviarEmailBoasVindas ? {} : { senhaTemporaria }),
    };
  }

  async listar(usuarioExecutorId: string) {
    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioExecutorId);

    if (escopo.global) {
      const usuarios = await this.usuariosRepositorio.find({
        where: { deletedAt: IsNull() },
        order: { nome: 'ASC' },
      });

      return usuarios.map((usuario) => this.serializarUsuario(usuario));
    }

    const filtros = [];

    if (escopo.secretariaIds.length > 0) {
      filtros.push({ secretariaId: In(escopo.secretariaIds), ativo: true });
    }

    if (escopo.escolaIds.length > 0) {
      filtros.push({ escolaId: In(escopo.escolaIds), ativo: true });
    }

    if (escopo.anoLetivoIds.length > 0) {
      filtros.push({ anoLetivoId: In(escopo.anoLetivoIds), ativo: true });
    }

    if (filtros.length === 0) {
      return [];
    }

    const acessos = await this.usuarioAcessosRepositorio.find({
      where: filtros,
      relations: { usuario: true },
      order: { createdAt: 'DESC' },
    });
    const usuarios = new Map<string, Usuario>();

    for (const acesso of acessos) {
      if (acesso.usuario && !acesso.usuario.deletedAt) {
        usuarios.set(acesso.usuario.id, acesso.usuario);
      }
    }

    return [...usuarios.values()]
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((usuario) => this.serializarUsuario(usuario));
  }

  async buscarPorId(id: string, usuarioExecutorId: string) {
    const usuario = await this.buscarUsuarioAtivo(id);
    await this.garantirUsuarioGerenciavel(id, usuarioExecutorId);

    return this.serializarUsuario(usuario);
  }

  async atualizar(
    id: string,
    dados: AtualizarUsuarioDto,
    usuarioExecutorId: string,
  ) {
    const usuario = await this.buscarUsuarioAtivo(id);
    await this.garantirUsuarioGerenciavel(id, usuarioExecutorId);
    await this.garantirIdentificadoresUnicos(
      dados.email,
      dados.username,
      dados.cpf,
      id,
    );

    Object.assign(usuario, {
      ...dados,
      email: dados.email === undefined ? usuario.email : dados.email ?? null,
      username:
        dados.username === undefined ? usuario.username : dados.username ?? null,
      cpf: dados.cpf === undefined ? usuario.cpf : dados.cpf ?? null,
      telefone:
        dados.telefone === undefined ? usuario.telefone : dados.telefone ?? null,
      dataNascimento:
        dados.dataNascimento === undefined
          ? usuario.dataNascimento
          : dados.dataNascimento ?? null,
      cargo: dados.cargo === undefined ? usuario.cargo : dados.cargo ?? null,
      observacoes:
        dados.observacoes === undefined
          ? usuario.observacoes
          : dados.observacoes ?? null,
      updatedAt: new Date(),
    });

    return this.serializarUsuario(await this.usuariosRepositorio.save(usuario));
  }

  async inativar(id: string, usuarioExecutorId: string) {
    const usuario = await this.buscarUsuarioAtivo(id);
    await this.garantirUsuarioGerenciavel(id, usuarioExecutorId);

    usuario.ativo = false;
    usuario.updatedAt = new Date();

    return this.serializarUsuario(await this.usuariosRepositorio.save(usuario));
  }

  async redefinirSenha(
    id: string,
    dados: RedefinirSenhaUsuarioDto,
    usuarioExecutorId: string,
  ) {
    const usuario = await this.buscarUsuarioAtivo(id);
    await this.garantirUsuarioGerenciavel(id, usuarioExecutorId);

    usuario.senhaHash = await bcrypt.hash(dados.senha, 12);
    usuario.primeiroAcesso = true;
    usuario.updatedAt = new Date();

    await this.usuariosRepositorio.save(usuario);

    return { mensagem: 'Senha redefinida com sucesso.' };
  }

  private async buscarUsuarioAtivo(id: string) {
    const usuario = await this.usuariosRepositorio.findOneBy({
      id,
      deletedAt: IsNull(),
    });

    if (!usuario) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    return usuario;
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

    const existente = await this.usuariosRepositorio.findOne({
      where: filtros,
    });

    if (existente && existente.id !== ignorarId) {
      throw new BadRequestException('Ja existe usuario com email, username ou CPF informado.');
    }
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
      filtros.push({
        usuarioId,
        secretariaId: In(escopo.secretariaIds),
        ativo: true,
      });
    }

    if (escopo.escolaIds.length > 0) {
      filtros.push({ usuarioId, escolaId: In(escopo.escolaIds), ativo: true });
    }

    if (escopo.anoLetivoIds.length > 0) {
      filtros.push({
        usuarioId,
        anoLetivoId: In(escopo.anoLetivoIds),
        ativo: true,
      });
    }

    if (filtros.length === 0) {
      throw new ForbiddenException('Usuario sem permissao para gerenciar este usuario.');
    }

    const acesso = await this.usuarioAcessosRepositorio.findOne({
      where: filtros,
    });

    if (!acesso) {
      throw new ForbiddenException('Usuario sem permissao para gerenciar este usuario.');
    }
  }

  private serializarUsuario(usuario: Usuario) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      cpf: usuario.cpf,
      email: usuario.email,
      telefone: usuario.telefone,
      dataNascimento: usuario.dataNascimento,
      cargo: usuario.cargo,
      observacoes: usuario.observacoes,
      username: usuario.username,
      origemAuth: usuario.origemAuth,
      ativo: usuario.ativo,
      primeiroAcesso: usuario.primeiroAcesso,
      ultimoLoginAt: usuario.ultimoLoginAt,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
    };
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
    const nomeHtml = this.escaparHtml(usuario.nome);
    const emailHtml = this.escaparHtml(usuario.email);
    const usuarioAcessoHtml = this.escaparHtml(usuarioAcesso);
    const senhaHtml = this.escaparHtml(senhaTemporaria);
    const texto = [
      `Ola, ${usuario.nome}.`,
      '',
      'Sua conta foi criada no Sistema Escolar.',
      `Email cadastrado: ${usuario.email}`,
      `Usuario de acesso: ${usuarioAcesso}`,
      `Senha temporaria: ${senhaTemporaria}`,
      '',
      'No primeiro acesso, altere sua senha temporaria.',
    ].join('\n');
    const html = `
      <p>Ola, ${nomeHtml}.</p>
      <p>Sua conta foi criada no Sistema Escolar.</p>
      <ul>
        <li><strong>Email cadastrado:</strong> ${emailHtml}</li>
        <li><strong>Usuario de acesso:</strong> ${usuarioAcessoHtml}</li>
        <li><strong>Senha temporaria:</strong> ${senhaHtml}</li>
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

  private escaparHtml(valor: string) {
    return valor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
