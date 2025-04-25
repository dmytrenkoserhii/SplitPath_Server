import { DeleteResult, Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateStoryTopicDto, UpdateStoryTopicDto } from '../dtos';
import { StoryTopic } from '../entities';

@Injectable()
export class StoryTopicsService {
  constructor(
    @InjectRepository(StoryTopic)
    private readonly topicRepository: Repository<StoryTopic>,
  ) {}

  async create(createDto: CreateStoryTopicDto): Promise<StoryTopic> {
    const newTopic = this.topicRepository.create(createDto);
    return this.topicRepository.save(newTopic);
  }

  async findAll(): Promise<StoryTopic[]> {
    return this.topicRepository.find();
  }

  async findOneById(id: number): Promise<StoryTopic> {
    const topic = await this.topicRepository.findOneBy({ id });

    if (!topic) {
      throw new NotFoundException(`StoryTopic with ID "${id}" not found`);
    }

    return topic;
  }

  async update(id: number, updateDto: UpdateStoryTopicDto): Promise<StoryTopic> {
    const topic = await this.findOneById(id);

    Object.assign(topic, updateDto);

    return this.topicRepository.save(topic);
  }

  async remove(id: number): Promise<DeleteResult> {
    await this.findOneById(id);

    return this.topicRepository.delete(id);
  }
}
