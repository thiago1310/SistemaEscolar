import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcryptjs';
import { DataSource, IsNull } from 'typeorm';
import { AppModule } from '../app.module';
import {
  OrigemAutenticacao,
  Usuario,
} from '../modules/autenticacao/autenticacao.entities';
import { Perfil } from '../modules/perfis-permissoes/perfis-permissoes.entities';
import { UsuarioAcesso } from '../modules/usuario-acessos/usuario-acessos.entities';

const perfisSistema = [
  {
    nome: 'Administrador Geral',
    codigo: 'ADMIN_GERAL',
    descricao: 'Acesso total ao sistema.',
    nivel: 100,
  },
  {
    nome: 'Secretaria Municipal',
    codigo: 'SECRETARIA_MUNICIPAL',
    descricao: 'Gestao administrativa da secretaria municipal.',
    nivel: 80,
  },
  {
    nome: 'Gestor Escolar',
    codigo: 'GESTOR_ESCOLAR',
    descricao: 'Gestao administrativa da escola.',
    nivel: 60,
  },
  {
    nome: 'Secretario Escolar',
    codigo: 'SECRETARIO_ESCOLAR',
    descricao: 'Rotinas de secretaria escolar.',
    nivel: 50,
  },
  {
    nome: 'Coordenador Pedagogico',
    codigo: 'COORDENADOR_PEDAGOGICO',
    descricao: 'Acompanhamento pedagogico.',
    nivel: 45,
  },
  {
    nome: 'Professor',
    codigo: 'PROFESSOR',
    descricao: 'Rotinas docentes.',
    nivel: 30,
  },
  {
    nome: 'Auditor',
    codigo: 'AUDITOR',
    descricao: 'Consulta de auditoria e rastreabilidade.',
    nivel: 20,
  },
  {
    nome: 'Suporte Tecnico',
    codigo: 'SUPORTE_TECNICO',
    descricao: 'Suporte operacional e diagnostico tecnico.',
    nivel: 10,
  },
];

async function executarSeed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const dataSource = app.get(DataSource);
    const perfisRepositorio = dataSource.getRepository(Perfil);
    const usuariosRepositorio = dataSource.getRepository(Usuario);
    const usuarioAcessosRepositorio = dataSource.getRepository(UsuarioAcesso);

    const perfis = new Map<string, Perfil>();

    for (const dadosPerfil of perfisSistema) {
      let perfil = await perfisRepositorio.findOneBy({
        codigo: dadosPerfil.codigo,
      });

      if (!perfil) {
        perfil = perfisRepositorio.create({
          ...dadosPerfil,
          sistema: true,
          ativo: true,
        });
      } else {
        Object.assign(perfil, {
          ...dadosPerfil,
          sistema: true,
          ativo: true,
        });
      }

      perfis.set(dadosPerfil.codigo, await perfisRepositorio.save(perfil));
    }

    const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@sistema.local';
    const adminName = process.env.ADMIN_NAME ?? 'Administrador';
    const adminPassword = process.env.ADMIN_PASSWORD ?? '123456';

    let admin = await usuariosRepositorio.findOne({
      where: [{ username: adminUsername }, { email: adminEmail }],
    });
    const senhaHash = await bcrypt.hash(adminPassword, 12);
    const agora = new Date();

    if (!admin) {
      admin = usuariosRepositorio.create({
        nome: adminName,
        cpf: null,
        email: adminEmail,
        telefone: null,
        username: adminUsername,
        senhaHash,
        origemAuth: OrigemAutenticacao.LOCAL,
        ativo: true,
        primeiroAcesso: false,
        ultimoLoginAt: null,
        createdAt: agora,
        updatedAt: agora,
        deletedAt: null,
      });
    } else {
      Object.assign(admin, {
        nome: adminName,
        email: adminEmail,
        username: adminUsername,
        senhaHash,
        origemAuth: OrigemAutenticacao.LOCAL,
        ativo: true,
        primeiroAcesso: false,
        updatedAt: agora,
        deletedAt: null,
      });
    }

    admin = await usuariosRepositorio.save(admin);

    const perfilAdmin = perfis.get('ADMIN_GERAL');

    if (!perfilAdmin) {
      throw new Error('Perfil ADMIN_GERAL nao foi criado.');
    }

    const acessoAdmin = await usuarioAcessosRepositorio.findOne({
      where: {
        usuarioId: admin.id,
        perfilId: perfilAdmin.id,
        secretariaId: IsNull(),
        escolaId: IsNull(),
      },
    });

    if (!acessoAdmin) {
      await usuarioAcessosRepositorio.save(
        usuarioAcessosRepositorio.create({
          usuarioId: admin.id,
          perfilId: perfilAdmin.id,
          secretariaId: null,
          escolaId: null,
          ativo: true,
        }),
      );
    } else if (!acessoAdmin.ativo) {
      acessoAdmin.ativo = true;
      await usuarioAcessosRepositorio.save(acessoAdmin);
    }

    console.log('Seed concluido.');
    console.log(`Admin: ${adminUsername}`);
    console.log(`Perfis cadastrados: ${perfisSistema.length}`);
  } finally {
    await app.close();
  }
}

executarSeed().catch((erro) => {
  console.error('Erro ao executar seed:', erro);
  process.exit(1);
});
