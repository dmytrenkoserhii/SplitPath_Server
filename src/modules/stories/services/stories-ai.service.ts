import OpenAI from 'openai';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { StorySegment, StoryTopic } from '@/modules/stories/entities';
import { ENV } from '@/shared/enums';

@Injectable()
export class StoriesAIService {
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>(ENV.OPENAI_API_KEY),
    });
  }

  async generateSegment(
    topic: StoryTopic,
    segments: StorySegment[] = [],
  ): Promise<{ text: string; choices: string[] }> {
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

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }
}
