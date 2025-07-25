import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch';
import { AlgoliaConfig, SearchQuery, SearchResponse, SearchResult } from './types';

/**
 * Service class for handling Algolia search operations.
 */
export class AlgoliaService {
    private client: SearchClient | null = null;
    private index: SearchIndex | null = null;
    private config: AlgoliaConfig | null = null;

    /**
     * Initialize the Algolia service with configuration.
     * @param config Algolia configuration containing appId, apiKey, and indexName
     * @throws Error if configuration is invalid
     */
    public initialize(config: AlgoliaConfig): void {
        this.validateConfig(config);
        
        try {
            this.client = algoliasearch(config.appId, config.apiKey);
            this.index = this.client.initIndex(config.indexName);
            this.config = config;
        } catch (error) {
            throw new Error(`Failed to initialize Algolia client: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Validate Algolia configuration.
     * @param config Configuration to validate
     * @throws Error if configuration is invalid
     */
    private validateConfig(config: AlgoliaConfig): void {
        if (!config.appId || typeof config.appId !== 'string' || config.appId.trim() === '') {
            throw new Error('Algolia App ID is required and must be a non-empty string');
        }

        if (!config.apiKey || typeof config.apiKey !== 'string' || config.apiKey.trim() === '') {
            throw new Error('Algolia API Key is required and must be a non-empty string');
        }

        if (!config.indexName || typeof config.indexName !== 'string' || config.indexName.trim() === '') {
            throw new Error('Algolia Index Name is required and must be a non-empty string');
        }
    }

    /**
     * Check if the service is properly initialized.
     * @returns true if initialized, false otherwise
     */
    public isInitialized(): boolean {
        return this.client !== null && this.index !== null && this.config !== null;
    }

    /**
     * Perform a search query against the Algolia index.
     * @param searchQuery Search parameters including query string and filters
     * @returns Promise resolving to search response
     * @throws Error if service is not initialized or search fails
     */
    public async search(searchQuery: SearchQuery): Promise<SearchResponse> {
        if (!this.isInitialized()) {
            throw new Error('AlgoliaService is not initialized. Call initialize() first.');
        }

        if (!this.index) {
            throw new Error('Algolia index is not available');
        }

        try {
            // Build search parameters
            const searchParams: any = {
                query: searchQuery.query || '',
                hitsPerPage: searchQuery.hitsPerPage || 20,
                page: searchQuery.page || 0,
                highlightPreTag: '<mark>',
                highlightPostTag: '</mark>',
                attributesToHighlight: ['title', 'content', 'note', 'tags']
            };

            // Add tag filters if provided
            if (searchQuery.filters && searchQuery.filters.length > 0) {
                const tagFilters = searchQuery.filters.map(tag => `tags:"${tag}"`).join(' AND ');
                searchParams.filters = tagFilters;
            }

            // Perform the search
            const response = await this.index.search<SearchResult>(searchParams.query, searchParams);

            // Transform the response to match our SearchResponse interface
            return {
                hits: response.hits,
                nbHits: response.nbHits,
                page: response.page,
                nbPages: response.nbPages,
                processingTimeMS: response.processingTimeMS
            };

        } catch (error) {
            const errorMessage = error && typeof error === 'object' && 'message' in error 
                ? String(error.message)
                : 'An unknown error occurred during search';
            
            throw new Error(`Search failed: ${errorMessage}`);
        }
    }

    /**
     * Get the current configuration.
     * @returns Current Algolia configuration or null if not initialized
     */
    public getConfig(): AlgoliaConfig | null {
        return this.config;
    }

    /**
     * Dispose of the service and clean up resources.
     */
    public dispose(): void {
        this.client = null;
        this.index = null;
        this.config = null;
    }
}