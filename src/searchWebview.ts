import * as vscode from 'vscode';
import { SearchResult, SearchQuery, SearchResponse } from './types';

/**
 * Provides and manages the search webview panel for DevStash search functionality.
 */
export class SearchWebviewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private disposables: vscode.Disposable[] = [];

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Creates and shows the search webview panel.
     */
    public createWebview(): vscode.WebviewPanel {
        // Create webview panel
        this.panel = vscode.window.createWebviewPanel(
            'devstashSearch',
            'DevStash Search',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.context.extensionUri]
            }
        );

        // Set the HTML content
        this.panel.webview.html = this.getWebviewContent();

        // Handle panel disposal
        this.panel.onDidDispose(() => {
            this.dispose();
        }, null, this.disposables);

        return this.panel;
    }

    /**
     * Generates the HTML content for the search webview.
     */
    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DevStash Search</title>
    <style>
        ${this.getWebviewStyles()}
    </style>
</head>
<body>
    <div class="search-container">
        <div class="search-header">
            <h1>DevStash Search</h1>
            <div class="search-input-container">
                <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="Search your code snippets and notes..." 
                    autocomplete="off"
                />
                <div class="search-loading" id="searchLoading" style="display: none;">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        </div>

        <div class="tag-filter-section" id="tagFilterSection" style="display: none;">
            <div class="tag-filter-header">
                <span>Active Filters:</span>
                <button id="clearFilters" class="clear-filters-btn" style="display: none;">Clear All</button>
            </div>
            <div class="active-filters" id="activeFilters"></div>
        </div>

        <div class="search-results-container">
            <div class="results-header" id="resultsHeader" style="display: none;">
                <span id="resultsCount"></span>
            </div>
            
            <div class="search-results" id="searchResults">
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <p>Start typing to search your DevStash items</p>
                </div>
            </div>
        </div>

        <div class="error-message" id="errorMessage" style="display: none;">
            <div class="error-icon">⚠️</div>
            <div class="error-content">
                <h3>Search Error</h3>
                <p id="errorText"></p>
            </div>
        </div>
    </div>

    <script>
        ${this.getWebviewScript()}
    </script>
</body>
</html>`;
    }

    /**
     * Returns the CSS styles for the webview.
     */
    private getWebviewStyles(): string {
        return `
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                line-height: 1.5;
                text-align: left;
            }

            .search-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                text-align: left;
            }

            .search-header {
                margin-bottom: 20px;
            }

            .search-header h1 {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 16px;
                color: var(--vscode-titleBar-activeForeground);
            }

            .search-input-container {
                position: relative;
                display: flex;
                align-items: center;
            }

            #searchInput {
                width: 100%;
                padding: 12px 16px;
                font-size: 16px;
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                outline: none;
                transition: border-color 0.2s ease;
            }

            #searchInput:focus {
                border-color: var(--vscode-focusBorder);
                box-shadow: 0 0 0 1px var(--vscode-focusBorder);
            }

            #searchInput::placeholder {
                color: var(--vscode-input-placeholderForeground);
            }

            .search-loading {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
            }

            .loading-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid var(--vscode-progressBar-background);
                border-top: 2px solid var(--vscode-progressBar-foreground);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .tag-filter-section {
                margin-bottom: 20px;
                padding: 16px;
                background-color: var(--vscode-editor-inactiveSelectionBackground);
                border-radius: 4px;
                border: 1px solid var(--vscode-panel-border);
            }

            .tag-filter-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                font-weight: 600;
                color: var(--vscode-descriptionForeground);
            }

            .clear-filters-btn {
                background: none;
                border: 1px solid var(--vscode-button-border);
                color: var(--vscode-button-foreground);
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
                transition: background-color 0.2s ease;
            }

            .clear-filters-btn:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            .active-filters {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .filter-tag {
                display: inline-flex;
                align-items: center;
                padding: 4px 8px;
                background-color: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
            }

            .filter-tag .remove-filter {
                margin-left: 6px;
                cursor: pointer;
                font-weight: bold;
                opacity: 0.7;
                transition: opacity 0.2s ease;
            }

            .filter-tag .remove-filter:hover {
                opacity: 1;
            }

            .search-results-container {
                margin-bottom: 20px;
            }

            .results-header {
                margin-bottom: 16px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }

            #resultsCount {
                color: var(--vscode-descriptionForeground);
                font-size: 14px;
            }

            .search-results {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .empty-state {
                text-align: center;
                padding: 60px 20px;
                color: var(--vscode-descriptionForeground);
            }

            .empty-icon {
                font-size: 48px;
                margin-bottom: 16px;
                opacity: 0.5;
            }

            .search-result-item {
                padding: 16px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 6px;
                background-color: var(--vscode-editor-background);
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
            }

            .search-result-item:hover {
                border-color: var(--vscode-focusBorder);
                background-color: var(--vscode-list-hoverBackground);
            }

            .result-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 8px;
                color: var(--vscode-titleBar-activeForeground);
            }

            .result-note {
                font-size: 14px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 12px;
                line-height: 1.4;
            }

            .result-content-container {
                margin-bottom: 12px;
            }

            .result-content {
                background-color: var(--vscode-textCodeBlock-background);
                border: 1px solid var(--vscode-textBlockQuote-border);
                border-radius: 4px;
                padding: 8px 12px;
                font-family: var(--vscode-editor-font-family);
                font-size: 13px;
                line-height: 1.3;
                overflow-x: auto;
                overflow-y: hidden;
                white-space: pre-wrap;
                word-break: break-word;
                position: relative;
                max-height: 120px;
                text-align: left;
            }

            .result-content.truncated {
                max-height: 80px;
                overflow: hidden;
            }

            .result-content code {
                background: none;
                padding: 0;
                font-family: inherit;
                font-size: inherit;
                text-align: left;
                display: block;
                width: 100%;
            }

            .content-ellipsis {
                color: var(--vscode-descriptionForeground);
                font-style: italic;
            }

            .expand-content-btn {
                background: none;
                border: 1px solid var(--vscode-button-border);
                color: var(--vscode-button-foreground);
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
                margin-top: 8px;
                transition: background-color 0.2s ease;
            }

            .expand-content-btn:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            .result-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 12px;
            }

            .result-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }

            .tag-chip {
                padding: 2px 8px;
                background-color: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                border-radius: 10px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: opacity 0.2s ease;
            }

            .tag-chip:hover {
                opacity: 0.8;
            }

            .result-language {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                font-weight: 500;
            }

            .error-message {
                padding: 20px;
                border: 1px solid var(--vscode-inputValidation-errorBorder);
                border-radius: 6px;
                background-color: var(--vscode-inputValidation-errorBackground);
                color: var(--vscode-errorForeground);
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }

            .error-icon {
                font-size: 20px;
                flex-shrink: 0;
            }

            .error-content h3 {
                margin-bottom: 8px;
                font-size: 16px;
            }

            .error-content p {
                font-size: 14px;
                line-height: 1.4;
            }

            .copy-feedback {
                margin-top: 8px;
                padding: 6px 12px;
                background-color: var(--vscode-notifications-background);
                border: 1px solid var(--vscode-notifications-border);
                border-radius: 4px;
                font-size: 12px;
            }

            .copy-success {
                color: var(--vscode-notificationsInfoIcon-foreground);
                font-weight: 500;
            }

            /* Scrollbar styling */
            ::-webkit-scrollbar {
                width: 8px;
            }

            ::-webkit-scrollbar-track {
                background: var(--vscode-scrollbarSlider-background);
            }

            ::-webkit-scrollbar-thumb {
                background: var(--vscode-scrollbarSlider-hoverBackground);
                border-radius: 4px;
            }

            ::-webkit-scrollbar-thumb:hover {
                background: var(--vscode-scrollbarSlider-activeBackground);
            }
        `;
    }

    /**
     * Returns the JavaScript code for the webview.
     */
    private getWebviewScript(): string {
        return `
            // Initialize webview functionality
            (function() {
                const vscode = acquireVsCodeApi();
                
                // DOM elements
                const searchInput = document.getElementById('searchInput');
                const searchLoading = document.getElementById('searchLoading');
                const tagFilterSection = document.getElementById('tagFilterSection');
                const activeFilters = document.getElementById('activeFilters');
                const clearFiltersBtn = document.getElementById('clearFilters');
                const resultsHeader = document.getElementById('resultsHeader');
                const resultsCount = document.getElementById('resultsCount');
                const searchResults = document.getElementById('searchResults');
                const errorMessage = document.getElementById('errorMessage');
                const errorText = document.getElementById('errorText');

                // State
                let currentFilters = [];
                let searchTimeout;
                let isLoading = false;

                // Initialize
                searchInput.focus();

                // Search input handler with debouncing
                searchInput.addEventListener('input', function(e) {
                    const query = e.target.value.trim();
                    
                    // Clear previous timeout
                    if (searchTimeout) {
                        clearTimeout(searchTimeout);
                    }

                    // Hide error message
                    hideError();

                    // Debounce search
                    searchTimeout = setTimeout(() => {
                        if (query.length > 0) {
                            performSearch(query);
                        } else {
                            showEmptyState();
                        }
                    }, 300);
                });

                // Clear filters button
                clearFiltersBtn.addEventListener('click', function() {
                    currentFilters = [];
                    updateFilterDisplay();
                    
                    // Re-search with current query
                    const query = searchInput.value.trim();
                    if (query.length > 0) {
                        performSearch(query);
                    }
                });

                // Perform search
                function performSearch(query) {
                    if (isLoading) return;
                    
                    isLoading = true;
                    showLoading(true);
                    
                    vscode.postMessage({
                        type: 'search',
                        query: query,
                        filters: currentFilters
                    });
                }

                // Show loading state
                function showLoading(show) {
                    searchLoading.style.display = show ? 'block' : 'none';
                    isLoading = show;
                }

                // Show empty state
                function showEmptyState() {
                    resultsHeader.style.display = 'none';
                    searchResults.innerHTML = \`
                        <div class="empty-state">
                            <div class="empty-icon">🔍</div>
                            <p>Start typing to search your DevStash items</p>
                        </div>
                    \`;
                }

                // Show error
                function showError(message) {
                    errorText.textContent = message;
                    errorMessage.style.display = 'block';
                    showLoading(false);
                }

                // Hide error
                function hideError() {
                    errorMessage.style.display = 'none';
                }

                // Update filter display
                function updateFilterDisplay() {
                    if (currentFilters.length > 0) {
                        tagFilterSection.style.display = 'block';
                        clearFiltersBtn.style.display = 'inline-block';
                        
                        activeFilters.innerHTML = currentFilters.map(filter => \`
                            <div class="filter-tag">
                                \${filter}
                                <span class="remove-filter" data-filter="\${filter}">×</span>
                            </div>
                        \`).join('');

                        // Add remove filter handlers
                        activeFilters.querySelectorAll('.remove-filter').forEach(btn => {
                            btn.addEventListener('click', function(e) {
                                e.stopPropagation();
                                const filterToRemove = this.getAttribute('data-filter');
                                currentFilters = currentFilters.filter(f => f !== filterToRemove);
                                updateFilterDisplay();
                                
                                // Re-search
                                const query = searchInput.value.trim();
                                if (query.length > 0) {
                                    performSearch(query);
                                }
                            });
                        });
                    } else {
                        tagFilterSection.style.display = 'none';
                        clearFiltersBtn.style.display = 'none';
                        activeFilters.innerHTML = '';
                    }
                }

                // Handle messages from extension
                window.addEventListener('message', function(event) {
                    const message = event.data;
                    
                    switch (message.type) {
                        case 'searchResults':
                            handleSearchResults(message.data);
                            break;
                        case 'searchError':
                            showError(message.error);
                            break;
                        case 'copySuccess':
                            // Copy feedback is already shown immediately, no additional action needed
                            break;
                        case 'copyError':
                            showError('Failed to copy content to clipboard: ' + message.error);
                            break;
                    }
                });

                // Handle search results
                function handleSearchResults(response) {
                    showLoading(false);
                    
                    if (response.hits && response.hits.length > 0) {
                        displayResults(response);
                    } else {
                        displayNoResults();
                    }
                }

                // Display search results
                function displayResults(response) {
                    resultsHeader.style.display = 'block';
                    resultsCount.textContent = \`\${response.nbHits} result\${response.nbHits !== 1 ? 's' : ''} found\`;
                    
                    searchResults.innerHTML = response.hits.map(hit => {
                        const truncatedContent = truncateContent(hit.content, 150);
                        const isContentTruncated = hit.content.length > 150;
                        
                        return \`
                            <div class="search-result-item" data-object-id="\${hit.objectID}">
                                <div class="result-title">\${escapeHtml(hit.title)}</div>
                                \${hit.note ? \`<div class="result-note">\${escapeHtml(hit.note)}</div>\` : ''}
                                <div class="result-content-container">
                                    <div class="result-content \${isContentTruncated ? 'truncated' : ''}" data-full-content="\${escapeHtml(hit.content)}">
                                        <code class="language-\${hit.language}">\${escapeHtml(truncatedContent)}</code>
                                        \${isContentTruncated ? '<span class="content-ellipsis">...</span>' : ''}
                                    </div>
                                    \${isContentTruncated ? '<button class="expand-content-btn" type="button">Show More</button>' : ''}
                                </div>
                                <div class="result-meta">
                                    <div class="result-tags">
                                        \${hit.tags.map(tag => \`
                                            <span class="tag-chip" data-tag="\${escapeHtml(tag)}">\${escapeHtml(tag)}</span>
                                        \`).join('')}
                                    </div>
                                    <div class="result-language">\${escapeHtml(hit.language)}</div>
                                </div>
                                <div class="copy-feedback" style="display: none;">
                                    <span class="copy-success">✓ Copied to clipboard!</span>
                                </div>
                            </div>
                        \`;
                    }).join('');

                    // Add click handlers for results
                    searchResults.querySelectorAll('.search-result-item').forEach(item => {
                        item.addEventListener('click', function(e) {
                            // Don't trigger copy if clicking on expand button or tag chip
                            if (e.target.classList.contains('expand-content-btn') || 
                                e.target.classList.contains('tag-chip') ||
                                e.target.closest('.expand-content-btn') ||
                                e.target.closest('.tag-chip')) {
                                return;
                            }
                            
                            const objectId = this.getAttribute('data-object-id');
                            const result = response.hits.find(hit => hit.objectID === objectId);
                            if (result) {
                                // Show immediate feedback
                                showCopyFeedback(this);
                                
                                vscode.postMessage({
                                    type: 'copyResult',
                                    result: result
                                });
                            }
                        });
                    });

                    // Add click handlers for expand content buttons
                    searchResults.querySelectorAll('.expand-content-btn').forEach(btn => {
                        btn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const contentDiv = this.parentElement.querySelector('.result-content');
                            const fullContent = contentDiv.getAttribute('data-full-content');
                            
                            if (contentDiv.classList.contains('truncated')) {
                                // Expand
                                contentDiv.innerHTML = \`<code class="language-\${contentDiv.closest('.search-result-item').querySelector('.result-language').textContent}">\${fullContent}</code>\`;
                                contentDiv.classList.remove('truncated');
                                this.textContent = 'Show Less';
                            } else {
                                // Collapse
                                const truncatedContent = truncateContent(fullContent, 150);
                                contentDiv.innerHTML = \`<code class="language-\${contentDiv.closest('.search-result-item').querySelector('.result-language').textContent}">\${escapeHtml(truncatedContent)}</code><span class="content-ellipsis">...</span>\`;
                                contentDiv.classList.add('truncated');
                                this.textContent = 'Show More';
                            }
                        });
                    });

                    // Add click handlers for tag chips
                    searchResults.querySelectorAll('.tag-chip').forEach(chip => {
                        chip.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const tag = this.getAttribute('data-tag');
                            if (!currentFilters.includes(tag)) {
                                currentFilters.push(tag);
                                updateFilterDisplay();
                                
                                // Re-search with new filter
                                const query = searchInput.value.trim();
                                if (query.length > 0) {
                                    performSearch(query);
                                }
                            }
                        });
                    });
                }

                // Display no results
                function displayNoResults() {
                    resultsHeader.style.display = 'none';
                    searchResults.innerHTML = \`
                        <div class="empty-state">
                            <div class="empty-icon">📭</div>
                            <p>No results found for your search</p>
                        </div>
                    \`;
                }

                // Utility function to escape HTML
                function escapeHtml(text) {
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                }

                // Utility function to truncate content
                function truncateContent(content, maxLength) {
                    if (content.length <= maxLength) {
                        return content;
                    }
                    
                    // Try to truncate at a word boundary
                    const truncated = content.substring(0, maxLength);
                    const lastSpace = truncated.lastIndexOf(' ');
                    const lastNewline = truncated.lastIndexOf('\\n');
                    
                    const cutPoint = Math.max(lastSpace, lastNewline);
                    if (cutPoint > maxLength * 0.8) {
                        return content.substring(0, cutPoint);
                    }
                    
                    return truncated;
                }

                // Show copy feedback
                function showCopyFeedback(resultItem) {
                    const feedback = resultItem.querySelector('.copy-feedback');
                    if (feedback) {
                        feedback.style.display = 'block';
                        setTimeout(() => {
                            feedback.style.display = 'none';
                        }, 2000);
                    }
                }
            })();
        `;
    }

    /**
     * Disposes of the webview and cleans up resources.
     */
    public dispose(): void {
        this.panel?.dispose();
        this.panel = undefined;
        
        // Dispose of all disposables
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * Gets the current webview panel.
     */
    public getPanel(): vscode.WebviewPanel | undefined {
        return this.panel;
    }
}