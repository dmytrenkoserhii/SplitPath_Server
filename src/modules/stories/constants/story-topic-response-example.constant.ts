import { Story, StoryTopic } from '../entities';

export const STORY_TOPIC_RESPONSE_EXAMPLE: StoryTopic = {
  id: 3,
  name: 'Fantasy Adventure',
  description: 'Epic tales of heroes and magic',
  stories: [{ id: 1 } as Story],
  createdAt: new Date('2023-07-01T10:00:00Z'),
  updatedAt: new Date('2023-07-01T10:00:00Z'),
};
