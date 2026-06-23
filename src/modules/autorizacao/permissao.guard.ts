import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequisicaoAutenticada } from '../autenticacao/autenticacao.guard';
import { PerfilPermissao, Permissao as PermissaoEntity } from '../perfis-permissoes/perfis-permissoes.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { CHAVE_PERMISSOES } from './permissao.decorator';

@Injectable()
export class PermissaoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UsuarioAcesso)
    private readonly usuarioAcessosRepositorio: Repository<UsuarioAcesso>,
    @InjectRepository(PerfilPermissao)
    private readonly perfilPermissoesRepositorio: Repository<PerfilPermissao>,
    @InjectRepository(PermissaoEntity)
    private readonly permissoesRepositorio: Repository<PermissaoEntity>,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const permissoesNecessarias =
      this.reflector.getAllAndOverride<string[]>(CHAVE_PERMISSOES, [
        contexto.getHandler(),
        contexto.getClass(),
      ]) ?? [];

    if (permissoesNecessarias.length === 0) {
      return true;
    }

    const requisicao = contexto.switchToHttp().getRequest<RequisicaoAutenticada>();
    const usuarioId = requisicao.usuario?.id;

    if (!usuarioId) {
      throw new ForbiddenException('Usuário sem identificação para autorização.');
    }

    const acessos = await this.usuarioAcessosRepositorio.find({
      where: { usuarioId, ativo: true },
    });
    const perfilIds = acessos.map((acesso) => acesso.perfilId);

    if (perfilIds.length === 0) {
      throw new ForbiddenException('Usuário sem perfil ativo.');
    }

    const permissoes = await this.permissoesRepositorio
      .createQueryBuilder('permissao')
      .innerJoin(
        PerfilPermissao,
        'perfilPermissao',
        'perfilPermissao.permissao_id = permissao.id',
      )
      .where('perfilPermissao.perfil_id IN (:...perfilIds)', { perfilIds })
      .andWhere('permissao.codigo IN (:...codigos)', {
        codigos: permissoesNecessarias,
      })
      .getMany();

    if (permissoes.length === 0) {
      throw new ForbiddenException('Usuário sem permissão para acessar este recurso.');
    }

    return true;
  }
}
