import { DeleteResult, Repository } from 'typeorm';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { PaginatedResponse } from '@/shared/types';
import { createPaginatedResponse } from '@/shared/utils';
import { ErrorHandler } from '@/shared/utils';

import { CreateStoryDto, UpdateStoryDto } from '../dtos';
import { Story, StoryField } from '../entities';
import { StoryTopicsService } from './story-topics.service';

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly storyTopicsService: StoryTopicsService,
  ) {
    this.logger.log('Stories service initialized');
  }

  async findAllPaginated(
    userId: number,
    page: number,
    limit: number,
    sort?: string,
    status?: string,
  ): Promise<PaginatedResponse<Story>> {
    try {
      this.logger.debug(
        `Fetching paginated stories for user ${userId} - Page: ${page}, Limit: ${limit}, Sort: ${sort || 'default'}, Status: ${status || 'all'}`,
      );

      const queryBuilder = this.storyRepository
        .createQueryBuilder('story')
        .leftJoinAndSelect('story.user', 'user')
        .leftJoinAndSelect('story.storyTopic', 'storyTopic')
        .where('user.id = :userId', { userId })
        .skip((page - 1) * limit)
        .take(limit);

      if (status) {
        queryBuilder.andWhere('story.status = :status', { status });
      }

      if (sort) {
        const [field, direction] = sort.split(':');
        queryBuilder.orderBy(`story.${field}`, direction.toUpperCase() as 'ASC' | 'DESC');
      }

      const [items, total] = await queryBuilder.getManyAndCount();
      this.logger.debug(`Found ${items.length} stories out of ${total} total for user ${userId}`);

      return createPaginatedResponse(items, total, page, limit);
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoriesService.findAllPaginated');
    }
  }

  async findOneById(
    id: number,
    relationsToInclude: StoryField[] = [],
    fieldsToInclude: StoryField[] = [],
  ): Promise<Story> {
    try {
      this.logger.debug(`Finding story by ID: ${id}`);
      let query = this.storyRepository.createQueryBuilder('story').where('story.id = :id', { id });

      fieldsToInclude.forEach((field) => {
        query = query.addSelect(`story.${field}`);
      });

      relationsToInclude.forEach((relation) => {
        query = query.leftJoinAndSelect(`story.${relation}`, relation);
      });

      const story = await query.getOne();

      if (!story) {
        this.logger.warn(`Story with ID ${id} not found`);
        throw new NotFoundException(`Story with ID "${id}" not found`);
      }

      this.logger.debug(`Successfully found story: ${id}`);
      return story;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoriesService.findOneById');
    }
  }

  async create(createStoryDto: CreateStoryDto, sub: number): Promise<Story> {
    try {
      this.logger.debug(`Creating new story for user ${sub} with topic ${createStoryDto.topicId}`);

      const topic = await this.storyTopicsService.findOneById(createStoryDto.topicId);

      const numberOfSegments = Math.floor(Math.random() * (12 - 10 + 1)) + 10;

      const story = this.storyRepository.create({
        title: createStoryDto.title,
        storyTopic: topic,
        user: { id: sub },
        numberOfSegments,
      });

      const savedStory = await this.storyRepository.save(story);
      this.logger.log(`Story created successfully with ID: ${savedStory.id}`);

      return savedStory;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoriesService.create');
    }
  }

  async update(id: number, updateStoryDto: UpdateStoryDto): Promise<Story> {
    try {
      this.logger.debug(`Updating story: ${id}`);
      const story = await this.findOneById(id);

      Object.assign(story, updateStoryDto);
      const updatedStory = await this.storyRepository.save(story);
      this.logger.log(`Story ${id} updated successfully`);

      return updatedStory;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoriesService.update');
    }
  }

  async remove(id: number): Promise<DeleteResult> {
    try {
      this.logger.debug(`Attempting to remove story: ${id}`);
      await this.findOneById(id);

      const result = await this.storyRepository.delete(id);
      this.logger.log(`Story ${id} removed successfully`);

      return result;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoriesService.remove');
    }
  }
}
