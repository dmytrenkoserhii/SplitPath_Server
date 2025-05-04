import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Story } from '@/modules/stories/entities/story.entity';

import { Role } from '../enums';
import { Account } from './account.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, type: 'text', select: false })
  hashedPassword: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ nullable: true, type: 'text', select: false })
  refreshToken: string | null;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  isPremium: boolean;

  @Column({ nullable: true, type: 'text', select: false })
  oauthId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Story, (story) => story.user)
  stories: Story[];

  @OneToOne(() => Account, (account) => account.user, { cascade: true })
  @JoinColumn()
  account: Account;
}
