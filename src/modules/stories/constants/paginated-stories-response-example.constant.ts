import { STORY_RESPONSE_EXAMPLE } from './story-response-example.constant';

export const PAGINATED_STORIES_RESPONSE_EXAMPLE = {
  items: [STORY_RESPONSE_EXAMPLE],
  meta: {
    total: 42,
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 5,
    hasNextPage: true,
  },
};
