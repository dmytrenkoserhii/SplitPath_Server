import { DeleteResult, Repository } from 'typeorm';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateStorySegmentDto, UpdateStorySegmentDto } from '../dtos';
import { StorySegment } from '../entities';
import { StoriesService } from './stories.service';

// To verify story existence

@Injectable()
export class StorySegmentsService {
  constructor(
    @InjectRepository(StorySegment)
    private readonly segmentRepository: Repository<StorySegment>,
    private readonly storiesService: StoriesService,
  ) {}

  async create(createDto: CreateStorySegmentDto): Promise<StorySegment> {
    const story = await this.storiesService.findOneById(createDto.storyId);

    const newSegment = this.segmentRepository.create({
      ...createDto,
      story,
    });

    return this.segmentRepository.save(newSegment);
  }

  async findAllByStoryId(storyId: number): Promise<StorySegment[]> {
    await this.storiesService.findOneById(storyId);

    return this.segmentRepository.find({
      where: { storyId: storyId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOneById(segmentId: number): Promise<StorySegment> {
    const segment = await this.segmentRepository.findOneBy({ id: segmentId });

    if (!segment) {
      throw new NotFoundException(`StorySegment with ID "${segmentId}" not found`);
    }

    return segment;
  }

  async update(segmentId: number, updateDto: UpdateStorySegmentDto): Promise<StorySegment> {
    const segment = await this.findOneById(segmentId);

    if (updateDto.selectedChoice && !segment.choices.includes(updateDto.selectedChoice)) {
      throw new BadRequestException(`Invalid choice "${updateDto.selectedChoice}" selected.`);
    }

    return this.segmentRepository.save(segment);
  }

  async remove(segmentId: number): Promise<DeleteResult> {
    const segment = await this.findOneById(segmentId);

    if (!segment) {
      throw new NotFoundException(`StorySegment with ID "${segmentId}" not found`);
    }

    return this.segmentRepository.delete(segmentId);
  }
}
