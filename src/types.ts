/**
 * The payload sent from the VSCode extension to the webhook.
 */
export interface DevStashPayload {
  /** A unique identifier for the stash item. */
  id: string;

  /** A title for the stash item. */
  title: string;

  /** The selected code or text content. */
  content: string;

  /** The language identifier from the active VSCode editor (e.g., 'typescript', 'python'). */
  language: string;

  /** Optional tags provided by the user. */
  tags: string[];

  /** Optional note for the stash item. */
  note: string;

  /** The ISO 8601 timestamp of when the item was created. */
  createdAt: string;
}

/**
 * Algolia highlight result structure for search result highlighting.
 */
export interface AlgoliaHighlightResult {
  [key: string]: {
    value: string;
    matchLevel: 'none' | 'partial' | 'full';
    matchedWords: string[];
  };
}

/**
 * Search result item returned from Algolia search.
 */
export interface SearchResult {
  /** Algolia object ID. */
  objectID: string;

  /** Title of the stash item. */
  title: string;

  /** The code or text content. */
  content: string;

  /** Optional note for the stash item. */
  note: string;

  /** The language identifier (e.g., 'typescript', 'python'). */
  language: string;

  /** Tags associated with the stash item. */
  tags: string[];

  /** The ISO 8601 timestamp of when the item was created. */
  createdAt: string;

  /** The type of the stash item (e.g., 'code'). */
  type: string;

  /** Algolia highlight results for search term highlighting. */
  _highlightResult?: AlgoliaHighlightResult;
}

/**
 * Search query parameters for Algolia search.
 */
export interface SearchQuery {
  /** The search query string. */
  query: string;

  /** Optional tag filters to apply. */
  filters?: string[];

  /** Number of hits per page (default: 20). */
  hitsPerPage?: number;

  /** Page number for pagination (default: 0). */
  page?: number;
}

/**
 * Search response from Algolia.
 */
export interface SearchResponse {
  /** Array of search result hits. */
  hits: SearchResult[];

  /** Total number of hits found. */
  nbHits: number;

  /** Current page number. */
  page: number;

  /** Total number of pages. */
  nbPages: number;

  /** Processing time in milliseconds. */
  processingTimeMS: number;
}

/**
 * Algolia configuration settings.
 */
export interface AlgoliaConfig {
  /** Algolia application ID. */
  appId: string;

  /** Algolia search API key. */
  apiKey: string;

  /** Name of the Algolia index to search. */
  indexName: string;
}
