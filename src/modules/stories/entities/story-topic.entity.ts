import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Story } from './story.entity';

@Entity('story_topics')
export class StoryTopic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @OneToMany(() => Story, (story) => story.storyTopic)
  stories: Story[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
