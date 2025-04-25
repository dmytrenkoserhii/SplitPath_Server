import { DeleteResult, Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateStoryDto, UpdateStoryDto } from '../dtos';
import { Story } from '../entities';
import { StoryTopicsService } from './story-topics.service';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly storyTopicsService: StoryTopicsService,
  ) {}

  async create(createStoryDto: CreateStoryDto): Promise<Story> {
    const { topic: topicData, ...storyData } = createStoryDto;

    const topic = await this.storyTopicsService.create(topicData);

    const story = this.storyRepository.create({
      ...storyData,
      storyTopic: topic,
    });

    return this.storyRepository.save(story);
  }

  async findAll(): Promise<Story[]> {
    return this.storyRepository.find();
  }

  async findOneById(id: number): Promise<Story> {
    const story = await this.storyRepository.findOneBy({ id });

    if (!story) {
      throw new NotFoundException(`Story with ID "${id}" not found`);
    }
    return story;
  }

  async update(id: number, updateStoryDto: UpdateStoryDto): Promise<Story> {
    const story = await this.findOneById(id);

    if (!story) {
      throw new NotFoundException(`Story with ID "${id}" not found`);
    }

    Object.assign(story, updateStoryDto);

    return this.storyRepository.save(story);
  }

  async remove(id: number): Promise<DeleteResult> {
    await this.findOneById(id);

    return this.storyRepository.delete(id);
  }
}
