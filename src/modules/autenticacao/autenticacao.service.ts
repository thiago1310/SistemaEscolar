import { randomUUID } from 'node:crypto';
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { IsNull, Repository } from 'typeorm';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { EntrarDto, RenovarTokenDto, SairDto } from './autenticacao.dto';
import { SessaoUsuario, Usuario } from './autenticacao.entities';
import { UsuarioAutenticado } from './autenticacao.guard';

interface ConteudoToken {
  sub: string;
  nome: string;
  email: string | null;
  username: string | null;
}

interface ConteudoRefreshToken extends ConteudoToken {
  sessaoId: string;
  tipo: 'refresh';
}

@Injectable()
export class AutenticacaoService {
  private readonly expiracaoTokenAcesso: string;
  private readonly expiracaoRefreshToken: string;
  private readonly segredoTokenAcesso: string;
  private readonly segredoRefreshToken: string;

  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepositorio: Repository<Usuario>,
    @InjectRepository(SessaoUsuario)
    private readonly sessoesRepositorio: Repository<SessaoUsuario>,
    @InjectRepository(UsuarioAcesso)
    private readonly usuarioAcessosRepositorio: Repository<UsuarioAcesso>,
    private readonly jwtService: JwtService,
    private readonly configuracao: ConfigService,
  ) {
    this.expiracaoTokenAcesso = this.configuracao.get<string>(
      'JWT_EXPIRES_IN',
      '1d',
    );
    this.expiracaoRefreshToken = this.configuracao.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    this.segredoTokenAcesso = this.configuracao.getOrThrow<string>(
      'JWT_SECRET',
    );
    this.segredoRefreshToken = this.configuracao.get<string>(
      'JWT_REFRESH_SECRET',
      this.segredoTokenAcesso,
    );
  }

  async entrar(dados: EntrarDto, ip: string | null, userAgent: string | null) {
    const usuario = await this.buscarUsuarioParaLogin(dados.identificador);

    if (!usuario?.senhaHash) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const senhaValida = await bcrypt.compare(dados.senha, usuario.senhaHash);

    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    usuario.ultimoLoginAt = new Date();
    await this.usuariosRepositorio.save(usuario);

    return this.criarRespostaAutenticacao(usuario, ip, userAgent);
  }

  async renovarToken(
    dados: RenovarTokenDto,
    ip: string | null,
    userAgent: string | null,
  ) {
    const conteudo = await this.validarRefreshToken(dados.refreshToken);
    const sessao = await this.sessoesRepositorio.findOne({
      where: {
        id: conteudo.sessaoId,
        usuarioId: conteudo.sub,
        revogada: false,
      },
      relations: {
        usuario: true,
      },
    });

    if (!sessao || sessao.expiracao <= new Date() || !sessao.usuario.ativo) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    const refreshTokenValido = await bcrypt.compare(
      dados.refreshToken,
      sessao.refreshTokenHash,
    );

    if (!refreshTokenValido) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    sessao.revogada = true;
    await this.sessoesRepositorio.save(sessao);

    return this.criarRespostaAutenticacao(sessao.usuario, ip, userAgent);
  }

  async sair(dados: SairDto) {
    const conteudo = await this.validarRefreshToken(dados.refreshToken);
    const sessao = await this.sessoesRepositorio.findOneBy({
      id: conteudo.sessaoId,
      usuarioId: conteudo.sub,
      revogada: false,
    });

    if (sessao) {
      const refreshTokenValido = await bcrypt.compare(
        dados.refreshToken,
        sessao.refreshTokenHash,
      );

      if (refreshTokenValido) {
        sessao.revogada = true;
        await this.sessoesRepositorio.save(sessao);
      }
    }

    return { mensagem: 'Sessão encerrada com sucesso.' };
  }

  async validarTokenAcesso(token: string): Promise<UsuarioAutenticado> {
    try {
      const conteudo = await this.jwtService.verifyAsync<ConteudoToken>(token, {
        secret: this.segredoTokenAcesso,
      });

      return {
        id: conteudo.sub,
        nome: conteudo.nome,
        email: conteudo.email,
        username: conteudo.username,
      };
    } catch {
      throw new UnauthorizedException('Token de acesso inválido.');
    }
  }

  async obterPerfil(usuarioId: string) {
    const usuario = await this.usuariosRepositorio.findOneBy({ id: usuarioId });

    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const acessos = await this.usuarioAcessosRepositorio.find({
      where: { usuarioId, ativo: true },
      relations: {
        perfil: true,
        secretaria: true,
        escola: true,
        anoLetivo: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
    const perfis = acessos
      .filter((acesso) => acesso.perfil?.ativo)
      .map((acesso) => ({
        id: acesso.perfil.id,
        nome: acesso.perfil.nome,
        codigo: acesso.perfil.codigo,
        nivel: acesso.perfil.nivel,
        sistema: acesso.perfil.sistema,
      }));
    const maiorNivel = perfis.reduce(
      (nivel, perfil) => Math.max(nivel, perfil.nivel),
      0,
    );

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      username: usuario.username,
      primeiroAcesso: usuario.primeiroAcesso,
      maiorNivel,
      perfis: this.removerPerfisDuplicados(perfis),
      menus: this.montarMenusPorNivel(maiorNivel),
      escopos: acessos.map((acesso) => ({
        id: acesso.id,
        perfil: acesso.perfil
          ? {
              id: acesso.perfil.id,
              nome: acesso.perfil.nome,
              codigo: acesso.perfil.codigo,
              nivel: acesso.perfil.nivel,
            }
          : null,
        secretaria: acesso.secretaria
          ? {
              id: acesso.secretaria.id,
              nome: acesso.secretaria.nome,
            }
          : null,
        escola: acesso.escola
          ? {
              id: acesso.escola.id,
              nome: acesso.escola.nome,
            }
          : null,
        anoLetivo: acesso.anoLetivo
          ? {
              id: acesso.anoLetivo.id,
              ano: acesso.anoLetivo.ano,
              descricao: acesso.anoLetivo.descricao,
            }
          : null,
      })),
    };
  }

  private async buscarUsuarioParaLogin(identificador: string) {
    return this.usuariosRepositorio.findOne({
      where: [
        { email: identificador, ativo: true, deletedAt: IsNull() },
        { username: identificador, ativo: true, deletedAt: IsNull() },
        { cpf: identificador, ativo: true, deletedAt: IsNull() },
      ],
    });
  }

  private async criarRespostaAutenticacao(
    usuario: Usuario,
    ip: string | null,
    userAgent: string | null,
  ) {
    const sessaoId = randomUUID();
    const conteudoBase = this.criarConteudoToken(usuario);
    const accessToken = await this.jwtService.signAsync(conteudoBase, {
      secret: this.segredoTokenAcesso,
      expiresIn: this.expiracaoTokenAcesso as never,
    });
    const refreshToken = await this.jwtService.signAsync(
      {
        ...conteudoBase,
        sessaoId,
        tipo: 'refresh' as const,
      },
      {
        secret: this.segredoRefreshToken,
        expiresIn: this.expiracaoRefreshToken as never,
      },
    );

    await this.sessoesRepositorio.save({
      id: sessaoId,
      usuarioId: usuario.id,
      refreshTokenHash: await bcrypt.hash(refreshToken, 12),
      ip,
      userAgent,
      expiracao: new Date(
        Date.now() + this.converterDuracaoParaMilissegundos(this.expiracaoRefreshToken),
      ),
      revogada: false,
      createdAt: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.expiracaoTokenAcesso,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        username: usuario.username,
        primeiroAcesso: usuario.primeiroAcesso,
      },
    };
  }

  private criarConteudoToken(usuario: Usuario): ConteudoToken {
    return {
      sub: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      username: usuario.username,
    };
  }

  private removerPerfisDuplicados(
    perfis: Array<{
      id: string;
      nome: string;
      codigo: string;
      nivel: number;
      sistema: boolean;
    }>,
  ) {
    return Array.from(
      new Map(perfis.map((perfil) => [perfil.id, perfil])).values(),
    );
  }

  private montarMenusPorNivel(nivel: number) {
    if (nivel >= 100) {
      return [
        'secretarias',
        'escolas',
        'anos_letivos',
        'perfis',
        'usuario_acessos',
        'disciplinas',
        'auditoria',
      ];
    }

    if (nivel >= 80) {
      return ['secretarias', 'escolas', 'anos_letivos', 'disciplinas'];
    }

    if (nivel >= 60) {
      return ['escolas', 'anos_letivos', 'disciplinas'];
    }

    if (nivel >= 45) {
      return ['anos_letivos', 'disciplinas'];
    }

    if (nivel >= 30) {
      return ['disciplinas'];
    }

    if (nivel >= 20) {
      return ['auditoria'];
    }

    return [];
  }

  private async validarRefreshToken(token: string): Promise<ConteudoRefreshToken> {
    try {
      const conteudo =
        await this.jwtService.verifyAsync<ConteudoRefreshToken>(token, {
          secret: this.segredoRefreshToken,
        });

      if (conteudo.tipo !== 'refresh' || !conteudo.sessaoId) {
        throw new UnauthorizedException('Refresh token inválido.');
      }

      return conteudo;
    } catch {
      throw new UnauthorizedException('Refresh token inválido.');
    }
  }

  private converterDuracaoParaMilissegundos(duracao: string): number {
    const resultado = /^(\d+)([smhd])$/.exec(duracao);

    if (!resultado) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const valor = Number(resultado[1]);
    const unidade = resultado[2];
    const multiplicadores = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return valor * multiplicadores[unidade as keyof typeof multiplicadores];
  }
}
