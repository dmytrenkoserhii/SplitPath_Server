import { User } from '@/modules/users/entities';

import { Story, StorySegment, StoryTopic } from '../entities';
import { StoryStatus } from '../enums';
import { STORY_SEGMENT_RESPONSE_EXAMPLE } from './story-segment-response-example.constant';

export const STORY_RESPONSE_EXAMPLE: Story = {
  id: 1,
  title: 'The Adventure Begins',
  status: StoryStatus.FINISHED,
  user: { id: 42 } as User,
  storyTopic: { id: 3 } as StoryTopic,
  segments: [STORY_SEGMENT_RESPONSE_EXAMPLE],
  createdAt: new Date('2023-08-10T14:00:00Z'),
  updatedAt: new Date('2023-08-12T16:45:00Z'),
  numberOfSegments: 11,
};
