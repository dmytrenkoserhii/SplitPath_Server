import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Story } from './story.entity';

@Entity('story_segments')
export class StorySegment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  text: string;

  @Column('simple-array')
  choices: string[];

  @Column({ nullable: true })
  selectedChoice: string | null;

  @ManyToOne(() => Story, (story) => story.segments)
  @JoinColumn()
  story: Story;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
