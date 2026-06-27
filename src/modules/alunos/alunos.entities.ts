import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Escola } from '../escolas/escolas.entities';
import { Turma } from '../turmas/turmas.entities';

export enum SituacaoAluno {
  ATIVO = 'active',
  PENDENTE = 'pending',
  INATIVO = 'inactive',
}

export enum SexoAluno {
  MASCULINO = 'masculino',
  FEMININO = 'feminino',
}

@Entity('alunos')
export class Aluno {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'escola_id', type: 'varchar', length: 36, nullable: true })
  escolaId: string | null;

  @ManyToOne(() => Escola, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'escola_id' })
  escola: Escola | null;

  @Column({ name: 'turma_id', type: 'varchar', length: 36, nullable: true })
  turmaId: string | null;

  @ManyToOne(() => Turma, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'turma_id' })
  turma: Turma | null;

  @Column({ name: 'nome_completo', type: 'varchar', length: 255 })
  nomeCompleto: string;

  @Column({ name: 'cpf_ou_certidao', type: 'varchar', length: 50, nullable: true })
  cpfOuCertidao: string | null;

  @Column({ name: 'data_nascimento', type: 'date', nullable: true })
  dataNascimento: string | null;

  @Column({ name: 'sexo', type: 'varchar', length: 20, nullable: true })
  sexo: SexoAluno | null;

  @Column({ name: 'responsavel_nome', type: 'varchar', length: 255, nullable: true })
  responsavelNome: string | null;

  @Column({ name: 'responsavel_telefone', type: 'varchar', length: 30, nullable: true })
  responsavelTelefone: string | null;

  @Column({
    name: 'situacao',
    type: 'varchar',
    length: 20,
    default: SituacaoAluno.ATIVO,
  })
  situacao: SituacaoAluno;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
