import { DeleteResult, Repository } from 'typeorm';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ErrorHandler } from '@/shared/utils';

import { CreateStoryTopicDto, UpdateStoryTopicDto } from '../dtos';
import { StoryTopic } from '../entities';

@Injectable()
export class StoryTopicsService {
  private readonly logger = new Logger(StoryTopicsService.name);

  constructor(
    @InjectRepository(StoryTopic)
    private readonly topicRepository: Repository<StoryTopic>,
  ) {
    this.logger.log('Story topics service initialized');
  }

  async create(createDto: CreateStoryTopicDto): Promise<StoryTopic> {
    try {
      this.logger.debug(`Creating new story topic: ${createDto.name}`);
      const newTopic = this.topicRepository.create(createDto);

      const savedTopic = await this.topicRepository.save(newTopic);
      this.logger.log(`Story topic created successfully with ID: ${savedTopic.id}`);

      return savedTopic;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoryTopicsService.create');
    }
  }

  async findAll(): Promise<StoryTopic[]> {
    try {
      this.logger.debug('Fetching available story topics');
      const topics = await this.topicRepository.find();
      this.logger.debug(`Retrieved ${topics.length} available story topics`);

      return topics;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoryTopicsService.findAll');
    }
  }

  async findOneById(id: number): Promise<StoryTopic> {
    try {
      this.logger.debug(`Finding story topic by ID: ${id}`);
      const topic = await this.topicRepository.findOneBy({ id });

      if (!topic) {
        this.logger.warn(`Story topic with ID ${id} not found`);
        throw new NotFoundException(`StoryTopic with ID "${id}" not found`);
      }

      this.logger.debug(`Retrieved story topic: ${topic.name} (ID: ${id})`);
      return topic;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoryTopicsService.findOneById');
    }
  }

  async update(id: number, updateDto: UpdateStoryTopicDto): Promise<StoryTopic> {
    try {
      this.logger.debug(`Updating story topic: ${id}`);
      const topic = await this.findOneById(id);

      Object.assign(topic, updateDto);
      const updatedTopic = await this.topicRepository.save(topic);
      this.logger.log(`Story topic ${id} updated successfully`);

      return updatedTopic;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoryTopicsService.update');
    }
  }

  async remove(id: number): Promise<DeleteResult> {
    try {
      this.logger.debug(`Attempting to remove story topic: ${id}`);
      await this.findOneById(id);

      const result = await this.topicRepository.delete(id);
      this.logger.log(`Story topic ${id} removed successfully`);

      return result;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoryTopicsService.remove');
    }
  }
}
