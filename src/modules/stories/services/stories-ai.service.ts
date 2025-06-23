import OpenAI from 'openai';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { StorySegment, StoryTopic } from '@/modules/stories/entities';
import { StoryStatus } from '@/modules/stories/enums';
import { ENV } from '@/shared/enums';
import { ErrorHandler } from '@/shared/utils';

import { StoriesService } from './stories.service';
import { StorySegmentsService } from './story-segments.service';

@Injectable()
export class StoriesAIService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(StoriesAIService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly storiesService: StoriesService,
    private readonly storySegmentsService: StorySegmentsService,
  ) {
    this.logger.log('Initializing OpenAI client');
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>(ENV.OPENAI_API_KEY),
    });
    this.logger.log('OpenAI client initialized successfully');
  }

  async generateAndSaveInitialSegment(storyId: number, topic: StoryTopic) {
    try {
      this.logger.debug(`Generating initial segment for story ${storyId}`);

      const generatedSegment = await this.generateInitialSegment(topic);
      if (!generatedSegment) {
        throw new Error('Failed to generate initial segment');
      }

      this.logger.debug('Saving generated initial segment');
      const savedSegment = await this.storySegmentsService.create({
        storyId,
        text: generatedSegment.text,
        choices: generatedSegment.choices,
      });

      this.logger.debug(`Initial segment saved successfully for story ${storyId}`);

      return savedSegment;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoriesAIService.generateAndSaveInitialSegment');
    }
  }

  async generateAndSaveNextSegment(
    storyId: number,
    topic: StoryTopic,
    existingSegments: StorySegment[],
    numberOfSegments: number,
  ) {
    try {
      this.logger.debug(`Generating next segment for story ${storyId}`);

      if (existingSegments.length === 0) {
        throw new Error('Cannot generate next segment without existing segments');
      }

      if (!numberOfSegments || numberOfSegments <= 0) {
        throw new Error('Invalid numberOfSegments value');
      }

      const generatedSegment = await this.generateNextSegment(
        topic,
        existingSegments,
        numberOfSegments,
      );
      if (!generatedSegment) {
        throw new Error('Failed to generate next segment');
      }

      this.logger.debug('Saving generated next segment');
      const savedSegment = await this.storySegmentsService.create({
        storyId,
        text: generatedSegment.text,
        choices: generatedSegment.choices,
      });

      this.logger.debug(`Next segment saved successfully for story ${storyId}`);

      const story = await this.storiesService.findOneById(storyId);
      if (story.status === StoryStatus.NEW) {
        this.logger.debug(`Updating story ${storyId} status from NEW to IN_PROGRESS`);
        await this.storiesService.update(storyId, { status: StoryStatus.IN_PROGRESS });
      }

      return savedSegment;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoriesAIService.generateAndSaveNextSegment');
    }
  }

  async generateAndSaveFinalSegment(
    storyId: number,
    topic: StoryTopic,
    existingSegments: StorySegment[],
    numberOfSegments: number,
  ) {
    try {
      this.logger.debug(`Generating final segment for story ${storyId}`);

      if (existingSegments.length === 0) {
        throw new Error('Cannot generate final segment without existing segments');
      }

      if (!numberOfSegments || numberOfSegments <= 0) {
        throw new Error('Invalid numberOfSegments value');
      }

      const generatedSegment = await this.generateFinalSegment(
        topic,
        existingSegments,
        numberOfSegments,
      );
      if (!generatedSegment) {
        throw new Error('Failed to generate final segment');
      }

      this.logger.debug('Saving generated final segment');
      const savedSegment = await this.storySegmentsService.create({
        storyId,
        text: generatedSegment.text,
        choices: [],
      });

      this.logger.debug(`Final segment saved successfully for story ${storyId}`);

      this.logger.debug(`Updating story ${storyId} status to FINISHED`);
      await this.storiesService.update(storyId, { status: StoryStatus.FINISHED });

      return savedSegment;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoriesAIService.generateAndSaveFinalSegment');
    }
  }

  async generateInitialSegment(topic: StoryTopic): Promise<{ text: string; choices: string[] }> {
    try {
      this.logger.debug(`Generating story segment for topic: ${topic.name}`);

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            'You are a creative story generator. Generate engaging story segments with exactly 4 meaningful choices for the reader. Always return JSON with "text" (string) and "choices" (array of 4 strings). IMPORTANT: Do not include the choices in the story text - only provide them in the choices array.',
        },
        {
          role: 'user',
          content: `Create the beginning of a story about: "${topic.name}" Description: "${topic.description || 'No description provided'}"
    
                   Generate an engaging opening segment that ends with a natural cliffhanger or decision point, but DO NOT list the choices in the text.
                   Then provide exactly 4 choices for the reader in the choices array.
                   
                   Return ONLY a JSON object in this exact format:
                   {
                     "text": "Your story text here... (ending naturally without listing choices)",
                     "choices": ["Choice 1 text", "Choice 2 text", "Choice 3 text", "Choice 4 text"]
                   }
                   
                   The story text should NOT include phrases like "Should he:", "What should you do?", or numbered lists of choices.
                   The choices array must contain exactly 4 strings, not objects.`,
        },
      ];

      return this.makeOpenAIRequest(messages);
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoriesAIService.generateInitialSegment');
    }
  }

  private async generateNextSegment(
    topic: StoryTopic,
    existingSegments: StorySegment[],
    numberOfSegments: number,
  ): Promise<{ text: string; choices: string[] }> {
    try {
      const currentSegmentNumber = existingSegments.length + 1;
      const isPreFinalSegment = existingSegments.length === numberOfSegments - 2;

      this.logger.debug(
        `Generating segment ${currentSegmentNumber} of ${numberOfSegments} for topic: ${topic.name}${isPreFinalSegment ? ' (pre-final segment)' : ''}`,
      );

      const preFinalInstructions = isPreFinalSegment
        ? ' This is the second-to-last segment of the story - begin building toward the climax and start resolving conflicts to prepare for the conclusion.'
        : '';

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            'You are a creative story generator. Generate engaging story segments with exactly 4 meaningful choices for the reader. Always return JSON with "text" (string) and "choices" (array of 4 strings). IMPORTANT: Do not include the choices in the story text - only provide them in the choices array.',
        },
        {
          role: 'user',
          content: `Story Topic: "${topic.name}" Description: "${topic.description || 'No description provided'}"
          
          You are generating segment ${currentSegmentNumber} of ${numberOfSegments} total segments.${preFinalInstructions}
          
          Story progression so far:
                   ${existingSegments
                     .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                     .map(
                       (segment, index) =>
                         `Segment ${index + 1}: "${segment.text}"
                          Available choices: ${JSON.stringify(segment.choices)}
                          Selected choice: "${segment.selectedChoice}"`,
                     )
                     .join('\n\n')}
          
          Continue the story based on the selected choice from the previous segment.
                   Generate the next story segment that ends with a natural cliffhanger or decision point, but DO NOT list the choices in the text.
                   Then provide exactly 4 choices for the reader in the choices array.
                   
                   Return ONLY a JSON object in this exact format:
                   {
                     "text": "Your story text here... (ending naturally without listing choices)",
                     "choices": ["Choice 1 text", "Choice 2 text", "Choice 3 text", "Choice 4 text"]
                   }
                   
                   The story text should NOT include phrases like "Should he:", "What should you do?", or numbered lists of choices.
                   The choices array must contain exactly 4 strings, not objects.`,
        },
      ];

      return this.makeOpenAIRequest(messages);
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoriesAIService.generateNextSegment');
    }
  }

  private async generateFinalSegment(
    topic: StoryTopic,
    existingSegments: StorySegment[],
    numberOfSegments: number,
  ): Promise<{ text: string; choices: string[] }> {
    try {
      this.logger.debug(
        `Generating final segment (${numberOfSegments} of ${numberOfSegments}) for topic: ${topic.name}`,
      );

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            'You are a creative story generator creating the FINAL segment of a story. This is the CONCLUSION - there are NO MORE CHOICES after this. Return JSON with "text" (string) and "choices" (empty array []). DO NOT generate any choices whatsoever.',
        },
        {
          role: 'user',
          content: `Story Topic: "${topic.name}" Description: "${topic.description || 'No description provided'}"
          
          This is the FINAL SEGMENT (${numberOfSegments} of ${numberOfSegments}) - the story ENDS here. Provide a satisfying conclusion that wraps up the story. NO MORE CHOICES are needed after this.
          
          Story progression so far:
                   ${existingSegments
                     .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                     .map(
                       (segment, index) =>
                         `Segment ${index + 1}: "${segment.text}"
                          Available choices: ${JSON.stringify(segment.choices)}
                          Selected choice: "${segment.selectedChoice}"`,
                     )
                     .join('\n\n')}
          
          Create the FINAL, CONCLUDING segment based on the selected choice from the previous segment. This should provide complete resolution and ending to the story.
                   
                   Return ONLY a JSON object in this EXACT format:
                   {
                     "text": "Your final story conclusion here...",
                     "choices": []
                   }
                   
                   CRITICAL: The choices array MUST be empty [] - this is the story ending.`,
        },
      ];

      return this.makeOpenAIRequestForFinal(messages);
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoriesAIService.generateFinalSegment');
    }
  }

  private async makeOpenAIRequest(messages: OpenAI.Chat.ChatCompletionMessageParam[]) {
    this.logger.debug('Making request to OpenAI');
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
    });

    if (!response.choices[0].message.content) {
      throw new Error('OpenAI returned empty response');
    }

    const result = JSON.parse(response.choices[0].message.content);

    if (
      !result.text ||
      !result.choices ||
      !Array.isArray(result.choices) ||
      result.choices.length !== 4
    ) {
      throw new Error('OpenAI returned invalid segment format');
    }

    return {
      text: result.text,
      choices: result.choices,
    };
  }

  private async makeOpenAIRequestForFinal(messages: OpenAI.Chat.ChatCompletionMessageParam[]) {
    this.logger.debug('Making request to OpenAI for final segment');
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
    });

    if (!response.choices[0].message.content) {
      throw new Error('OpenAI returned empty response');
    }

    const result = JSON.parse(response.choices[0].message.content);

    if (!result.text) {
      throw new Error('OpenAI returned invalid final segment format - missing text');
    }

    return {
      text: result.text,
      choices: [],
    };
  }
}
