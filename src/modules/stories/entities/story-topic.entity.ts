import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
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

  @OneToOne(() => Story, (story) => story.storyTopic)
  story: Story;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
