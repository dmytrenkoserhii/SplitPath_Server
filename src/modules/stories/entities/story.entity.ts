import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
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
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => StoryTopic, (topic) => topic.story, {
    cascade: true,
    eager: true,
  })
  @JoinColumn({ name: 'topicId' })
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

  @Column()
  userId: number;
}
