const MIN_STORY_SEGMENTS = 10;
const MAX_STORY_SEGMENTS = 12;

export function generateRandomSegmentCount(): number {
  return (
    Math.floor(Math.random() * (MAX_STORY_SEGMENTS - MIN_STORY_SEGMENTS + 1)) + MIN_STORY_SEGMENTS
  );
}
