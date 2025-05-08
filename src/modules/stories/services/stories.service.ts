import { DeleteResult, Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { PaginatedResponse } from '@/shared/types';
import { createPaginatedResponse } from '@/shared/utils';

import { CreateStoryDto, UpdateStoryDto } from '../dtos';
import { Story, StoryField } from '../entities';
import { StoryTopicsService } from './story-topics.service';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly storyTopicsService: StoryTopicsService,
  ) {}

  async findAllPaginated(
    userId: number,
    page: number,
    limit: number,
    sort?: string,
  ): Promise<PaginatedResponse<Story>> {
    const queryBuilder = this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.user', 'user')
      .leftJoinAndSelect('story.storyTopic', 'storyTopic')
      .where('user.id = :userId', { userId })
      .skip((page - 1) * limit)
      .take(limit);

    if (sort) {
      const [field, direction] = sort.split(':');
      queryBuilder.orderBy(`story.${field}`, direction.toUpperCase() as 'ASC' | 'DESC');
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return createPaginatedResponse(items, total, page, limit);
  }

  async findOneById(
    id: number,
    relationsToInclude: StoryField[] = [],
    fieldsToInclude: StoryField[] = [],
  ): Promise<Story> {
    let query = this.storyRepository.createQueryBuilder('story').where('story.id = :id', { id });

    fieldsToInclude.forEach((field) => {
      query = query.addSelect(`story.${field}`);
    });

    relationsToInclude.forEach((relation) => {
      query = query.leftJoinAndSelect(`story.${relation}`, relation);
    });

    const story = await query.getOne();

    if (!story) {
      throw new NotFoundException(`Story with ID "${id}" not found`);
    }

    return story;
  }

  async create(createStoryDto: CreateStoryDto): Promise<Story> {
    const { topicId, userId, ...storyData } = createStoryDto;

    const topic = await this.storyTopicsService.findOneById(topicId);

    const story = this.storyRepository.create({
      ...storyData,
      storyTopic: topic,
      user: { id: userId },
    });

    return this.storyRepository.save(story);
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
