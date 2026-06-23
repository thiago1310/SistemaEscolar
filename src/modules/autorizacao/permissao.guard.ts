import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequisicaoAutenticada } from '../autenticacao/autenticacao.guard';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { CHAVE_NIVEL_MINIMO, CHAVE_PERFIS } from './permissao.decorator';

@Injectable()
export class PermissaoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UsuarioAcesso)
    private readonly usuarioAcessosRepositorio: Repository<UsuarioAcesso>,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const perfisPermitidos =
      this.reflector.getAllAndOverride<string[]>(CHAVE_PERFIS, [
        contexto.getHandler(),
        contexto.getClass(),
      ]) ?? [];
    const nivelMinimo = this.reflector.getAllAndOverride<number>(
      CHAVE_NIVEL_MINIMO,
      [contexto.getHandler(), contexto.getClass()],
    );

    if (perfisPermitidos.length === 0 && nivelMinimo === undefined) {
      return true;
    }

    const requisicao = contexto.switchToHttp().getRequest<RequisicaoAutenticada>();
    const usuarioId = requisicao.usuario?.id;

    if (!usuarioId) {
      throw new ForbiddenException('Usuário sem identificação para autorização.');
    }

    const acessos = await this.usuarioAcessosRepositorio.find({
      where: { usuarioId, ativo: true },
      relations: { perfil: true },
    });
    const perfisAtivos = acessos
      .map((acesso) => acesso.perfil)
      .filter((perfil) => perfil?.ativo);

    if (perfisAtivos.length === 0) {
      throw new ForbiddenException('Usuário sem perfil ativo.');
    }

    const possuiPerfilPermitido =
      perfisPermitidos.length === 0 ||
      perfisAtivos.some((perfil) => perfisPermitidos.includes(perfil.codigo));
    const possuiNivelMinimo =
      nivelMinimo === undefined ||
      perfisAtivos.some((perfil) => perfil.nivel >= nivelMinimo);

    if (!possuiPerfilPermitido || !possuiNivelMinimo) {
      throw new ForbiddenException('Usuário sem perfil para acessar este recurso.');
    }

    return true;
  }
}
