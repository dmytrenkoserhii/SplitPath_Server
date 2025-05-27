import OpenAI from 'openai';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { StorySegment, StoryTopic } from '@/modules/stories/entities';
import { ENV } from '@/shared/enums';
import { ErrorHandler } from '@/shared/utils';

@Injectable()
export class StoriesAIService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(StoriesAIService.name);

  constructor(private readonly configService: ConfigService) {
    this.logger.log('Initializing OpenAI client');
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>(ENV.OPENAI_API_KEY),
    });
    this.logger.log('OpenAI client initialized successfully');
  }

  async generateSegment(
    topic: StoryTopic,
    segments: StorySegment[] = [],
  ): Promise<{ text: string; choices: string[] }> {
    try {
      this.logger.debug(
        `Generating story segment for topic: ${topic.name}, existing segments: ${segments.length}`,
      );

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            'You are a creative story generator. Generate engaging story segments with exactly 4 meaningful choices for the reader.',
        },
        {
          role: 'user',
          content:
            segments.length === 0
              ? `Create the beginning of a story about: "${topic.name}" Description: "${topic.description || 'No description provided'}"
    
                 Generate an engaging opening segment and exactly 4 choices for the reader. Format the response as JSON with "text" and "choices" fields.`
              : `Story Topic: "${topic.name}" Description: "${topic.description || 'No description provided'}"
    
                 Story progression so far:
                 ${segments
                   .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                   .map(
                     (segment) =>
                       `Segment: "${segment.text}"
                        Available choices: ${JSON.stringify(segment.choices)}
                        Selected choice: "${segment.selectedChoice}"`,
                   )
                   .join('\n\n')}
    
                 Generate the next story segment and exactly 4 choices for the reader. Format the response as JSON with "text" and "choices" fields.`,
        },
      ];

      this.logger.debug('Making API request to OpenAI');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      this.logger.debug('Successfully generated story segment and choices');

      return result;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'StoriesAIService.generateSegment');
    }
  }
}
