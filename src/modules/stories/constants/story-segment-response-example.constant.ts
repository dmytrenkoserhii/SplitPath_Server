import { Story, StorySegment } from '../entities';

export const STORY_SEGMENT_RESPONSE_EXAMPLE: StorySegment = {
  id: 101,
  text: 'You find yourself standing at a crossroads...',
  choices: ['Go left', 'Go right', 'Turn back'],
  selectedChoice: null,
  story: { id: 1 } as Story,
  createdAt: new Date('2023-08-10T14:30:00Z'),
  updatedAt: new Date('2023-08-10T14:30:00Z'),
};
