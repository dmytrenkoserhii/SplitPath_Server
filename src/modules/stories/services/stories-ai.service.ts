import OpenAI from 'openai';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { StorySegment, StoryTopic } from '@/modules/stories/entities';
import { ENV } from '@/shared/enums';

import { StorySegmentsService } from './story-segments.service';

@Injectable()
export class StoriesAIService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(StoriesAIService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly storySegmentsService: StorySegmentsService,
  ) {
    this.logger.log('Initializing OpenAI client');
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>(ENV.OPENAI_API_KEY),
    });
    this.logger.log('OpenAI client initialized successfully');
  }

  async generateAndSaveInitialSegment(storyId: number, topic: StoryTopic): Promise<StorySegment> {
    this.logger.debug(`Generating initial story segment for story ${storyId}`);

    const generatedSegment = await this.generateInitialSegment(topic);
    if (!generatedSegment) {
      throw new Error('Failed to generate initial segment');
    }

    this.logger.debug('Saving generated initial segment');
    const savedSegment = await this.storySegmentsService.create({
      storyId,
      text: generatedSegment.text,
      choices: generatedSegment.choices,
      selectedChoice: undefined,
    });

    this.logger.debug(`Initial segment saved successfully for story ${storyId}`);
    return savedSegment;
  }

  async generateAndSaveNextSegment(
    storyId: number,
    topic: StoryTopic,
    existingSegments: StorySegment[],
  ): Promise<StorySegment> {
    this.logger.debug(`Generating next story segment for story ${storyId}`);

    if (existingSegments.length === 0) {
      throw new Error('Cannot generate next segment without existing segments');
    }

    const generatedSegment = await this.generateNextSegment(topic, existingSegments);
    if (!generatedSegment) {
      throw new Error('Failed to generate next segment');
    }

    this.logger.debug('Saving generated next segment');
    const savedSegment = await this.storySegmentsService.create({
      storyId,
      text: generatedSegment.text,
      choices: generatedSegment.choices,
      selectedChoice: undefined,
    });

    this.logger.debug(`Next segment saved successfully for story ${storyId}`);
    return savedSegment;
  }

  private async generateInitialSegment(
    topic: StoryTopic,
  ): Promise<{ text: string; choices: string[] }> {
    try {
      this.logger.debug(`Generating initial segment for topic: ${topic.name}`);

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
      this.logger.error(
        `Failed to generate initial segment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private async generateNextSegment(
    topic: StoryTopic,
    existingSegments: StorySegment[],
  ): Promise<{ text: string; choices: string[] }> {
    try {
      this.logger.debug(
        `Generating next segment for topic: ${topic.name}, with ${existingSegments.length} existing segments`,
      );

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            'You are a creative story generator. Generate engaging story segments with exactly 4 meaningful choices for the reader. Always return JSON with "text" (string) and "choices" (array of 4 strings). IMPORTANT: Do not include the choices in the story text - only provide them in the choices array.',
        },
        {
          role: 'user',
          content: `Story Topic: "${topic.name}" Description: "${topic.description || 'No description provided'}"
    
                   Story progression so far:
                   ${existingSegments
                     .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                     .map(
                       (segment) =>
                         `Segment: "${segment.text}"
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
      this.logger.error(
        `Failed to generate next segment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private async makeOpenAIRequest(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
  ): Promise<{ text: string; choices: string[] }> {
    this.logger.debug('Making API request to OpenAI');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
    });

    if (!response.choices[0].message.content) {
      throw new Error('OpenAI returned empty response');
    }

    const result = JSON.parse(response.choices[0].message.content);
    this.logger.debug('OpenAI raw response:', JSON.stringify(result, null, 2));

    if (
      !result.text ||
      !result.choices ||
      !Array.isArray(result.choices) ||
      result.choices.length !== 4
    ) {
      throw new Error('OpenAI returned invalid segment format');
    }

    const stringChoices = result.choices.map((choice: any) => {
      if (typeof choice === 'string') {
        return choice;
      } else if (typeof choice === 'object' && choice !== null) {
        this.logger.warn('Choice is an object:', JSON.stringify(choice));
        return choice.text || choice.content || String(choice);
      } else {
        return String(choice);
      }
    });

    this.logger.debug('Processed choices:', stringChoices);

    return {
      text: result.text,
      choices: stringChoices,
    };
  }
}
