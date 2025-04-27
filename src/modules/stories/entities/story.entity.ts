import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '@/modules/users/entities';

import { StoryStatus } from '../enums/story-status.enum';
import { StorySegment } from './story-segment.entity';
import { StoryTopic } from './story-topic.entity';

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: StoryStatus,
    default: StoryStatus.NEW,
  })
  status: StoryStatus;

  @ManyToOne(() => User, (user) => user.stories)
  @JoinColumn()
  user: User;

  @ManyToOne(() => StoryTopic, (topic) => topic.stories)
  @JoinColumn()
  storyTopic: StoryTopic;

  @OneToMany(() => StorySegment, (segment) => segment.story, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  segments: StorySegment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
