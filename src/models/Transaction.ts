import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
  ManyToMany,
  JoinColumn,
} from 'typeorm';

import Category from './Category';

@Entity('transactions')
@Check(`['income', 'outcome'].includes(type)}`)
@Check(`number >= 0`)
class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  type: 'income' | 'outcome';

  @Column('decimal')
  value: number;

  @ManyToMany(() => Category)
  @JoinColumn({ name: 'category_id' })
  category_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Transaction;
