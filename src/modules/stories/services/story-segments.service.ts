import { DeleteResult, Repository } from 'typeorm';

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ErrorHandler } from '@/shared/utils';

import { CreateStorySegmentDto, UpdateStorySegmentDto } from '../dtos';
import { StorySegment } from '../entities';
import { StoriesService } from './stories.service';

@Injectable()
export class StorySegmentsService {
  private readonly logger = new Logger(StorySegmentsService.name);

  constructor(
    @InjectRepository(StorySegment)
    private readonly segmentRepository: Repository<StorySegment>,
    private readonly storiesService: StoriesService,
  ) {
    this.logger.log('Story segments service initialized');
  }

  async create(createDto: CreateStorySegmentDto): Promise<StorySegment> {
    try {
      this.logger.debug(`Creating new story segment for story: ${createDto.storyId}`);
      const story = await this.storiesService.findOneById(createDto.storyId);

      const newSegment = this.segmentRepository.create({
        ...createDto,
        story,
      });

      const savedSegment = await this.segmentRepository.save(newSegment);
      this.logger.log(`Story segment created successfully with ID: ${savedSegment.id}`);

      return savedSegment;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StorySegmentsService.create');
    }
  }

  async findOneById(segmentId: number): Promise<StorySegment> {
    try {
      this.logger.debug(`Finding story segment by ID: ${segmentId}`);
      const segment = await this.segmentRepository.findOneBy({ id: segmentId });

      if (!segment) {
        this.logger.warn(`Story segment with ID ${segmentId} not found`);
        throw new NotFoundException(`StorySegment with ID "${segmentId}" not found`);
      }

      this.logger.debug(`Successfully found story segment: ${segmentId}`);
      return segment;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StorySegmentsService.findOneById');
    }
  }

  async update(segmentId: number, updateDto: UpdateStorySegmentDto): Promise<StorySegment> {
    try {
      this.logger.debug(`Updating story segment: ${segmentId}`);
      const segment = await this.findOneById(segmentId);

      if (updateDto.selectedChoice && !segment.choices.includes(updateDto.selectedChoice)) {
        this.logger.warn(
          `Invalid choice "${updateDto.selectedChoice}" selected for segment ${segmentId}`,
        );
        throw new BadRequestException(`Invalid choice "${updateDto.selectedChoice}" selected.`);
      }

      const updatedSegment = await this.segmentRepository.save(segment);
      this.logger.log(`Story segment ${segmentId} updated successfully`);

      return updatedSegment;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StorySegmentsService.update');
    }
  }

  async remove(segmentId: number): Promise<DeleteResult> {
    try {
      this.logger.debug(`Attempting to remove story segment: ${segmentId}`);
      await this.findOneById(segmentId);

      const result = await this.segmentRepository.delete(segmentId);
      this.logger.log(`Story segment ${segmentId} removed successfully`);

      return result;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StorySegmentsService.remove');
    }
  }
}
