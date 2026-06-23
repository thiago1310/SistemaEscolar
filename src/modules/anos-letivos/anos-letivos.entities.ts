import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Secretaria } from '../secretarias/secretarias.entities';

export enum StatusAnoLetivo {
  PLANEJAMENTO = 'PLANEJAMENTO',
  ABERTO = 'ABERTO',
  FECHADO = 'FECHADO',
  ARQUIVADO = 'ARQUIVADO',
}

@Entity('anos_letivos')
@Unique('uq_anos_letivos_secretaria_ano', ['secretariaId', 'ano'])
@Check('ck_anos_letivos_periodo', '`data_fim` >= `data_inicio`')
export class AnoLetivo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'secretaria_id', type: 'varchar', length: 36 })
  secretariaId: string;

  @ManyToOne(() => Secretaria, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'secretaria_id' })
  secretaria: Secretaria;

  @Column({ type: 'int' })
  ano: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  descricao: string | null;

  @Column({ name: 'data_inicio', type: 'date' })
  dataInicio: string;

  @Column({ name: 'data_fim', type: 'date' })
  dataFim: string;

  @Column({
    type: 'enum',
    enum: StatusAnoLetivo,
    default: StatusAnoLetivo.PLANEJAMENTO,
  })
  status: StatusAnoLetivo;

  @Column({ type: 'boolean', default: false })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
