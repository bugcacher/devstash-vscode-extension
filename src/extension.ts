import * as vscode from 'vscode';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { DevStashPayload, SearchResult, AlgoliaConfig } from './types';
import { SearchWebviewProvider } from './searchWebview';
import { AlgoliaService } from './algoliaService';

/**
 * This method is called when the extension is activated.
 * It registers the 'devstash.saveSelection' and 'devstash.search' commands.
 */
export function activate(context: vscode.ExtensionContext) {
  // Register save selection command
  const saveDisposable = vscode.commands.registerCommand('devstash.saveSelection', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('DevStash: No active editor found.');
      return;
    }

    const selection = editor.document.getText(editor.selection);
    if (!selection.trim()) {
      vscode.window.showWarningMessage('DevStash: No text selected.');
      return;
    }

    const config = vscode.workspace.getConfiguration('devstash');
    const webhookUrl = config.get<string>('webhookUrl');

    if (!webhookUrl) {
      vscode.window.showErrorMessage(
        'DevStash: Webhook URL is not configured. Please set it in your settings.'
      );
      return;
    }

    try {
      // Show a single input box for optional tags.
      const tagInput = await vscode.window.showInputBox({
        prompt: 'Add comma-separated tags (optional)',
        placeHolder: 'e.g., react, api, sql',
        title: 'Save to DevStash',
      });

      // If the user presses 'Escape' or clicks away, tagInput will be undefined.
      if (tagInput === undefined) {
        // Silently cancel the operation as requested.
        return;
      }

      const userTags = tagInput ? tagInput.split(',').map(t => t.trim()).filter(Boolean) : [];

      const payload: DevStashPayload = {
        id: uuidv4(),
        title: '', // TODO: Add title input
        content: selection,
        language: editor.document.languageId,
        tags: userTags,
        note: '', // TODO: Add note input
        createdAt: new Date().toISOString(),
      };

      const authToken = config.get<string>('authToken');
      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: authToken }),
        },
      });

      vscode.window.showInformationMessage('Successfully saved to DevStash!');
    } catch (error) {
      console.error('Error saving to DevStash:', error);
      if (axios.isAxiosError(error)) {
        vscode.window.showErrorMessage(`DevStash Error: ${error.response?.data?.message || error.message}`);
      } else {
        vscode.window.showErrorMessage(`DevStash Error: An unknown error occurred.`);
      }
    }
  });

  context.subscriptions.push(saveDisposable);

  // Register search command
  const searchDisposable = vscode.commands.registerCommand('devstash.search', async () => {
    try {
      // Get Algolia configuration from VS Code settings
      const config = vscode.workspace.getConfiguration('devstash');
      const algoliaConfig: AlgoliaConfig = {
        appId: config.get<string>('algoliaAppId') || '',
        apiKey: config.get<string>('algoliaApiKey') || '',
        indexName: config.get<string>('algoliaIndexName') || ''
      };

      // Validate configuration
      if (!algoliaConfig.appId || !algoliaConfig.apiKey || !algoliaConfig.indexName) {
        vscode.window.showErrorMessage(
          'DevStash: Algolia configuration is incomplete. Please configure App ID, API Key, and Index Name in your settings.'
        );
        return;
      }

      // Create webview provider and panel
      const webviewProvider = new SearchWebviewProvider(context);
      const panel = webviewProvider.createWebview();

      // Initialize Algolia service
      const algoliaService = new AlgoliaService();
      algoliaService.initialize(algoliaConfig);

      // Handle messages from webview
      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.type) {
            case 'search':
              try {
                const response = await algoliaService.search({
                  query: message.query,
                  filters: message.filters
                });
                
                panel.webview.postMessage({
                  type: 'searchResults',
                  data: response
                });
              } catch (error) {
                console.error('Search error:', error);
                panel.webview.postMessage({
                  type: 'searchError',
                  error: error instanceof Error ? error.message : 'An unknown search error occurred'
                });
              }
              break;

            case 'copyResult':
              try {
                const result: SearchResult = message.result;
                
                // Copy content to clipboard
                await vscode.env.clipboard.writeText(result.content);
                
                // Send success message back to webview
                panel.webview.postMessage({
                  type: 'copySuccess'
                });
                
                // Show success notification
                vscode.window.showInformationMessage(
                  `Copied "${result.title}" to clipboard!`
                );
              } catch (error) {
                console.error('Copy error:', error);
                
                // Send error message back to webview
                panel.webview.postMessage({
                  type: 'copyError',
                  error: error instanceof Error ? error.message : 'Failed to copy to clipboard'
                });
                
                // Show error notification
                vscode.window.showErrorMessage(
                  'Failed to copy content to clipboard: ' + 
                  (error instanceof Error ? error.message : 'Unknown error')
                );
              }
              break;
          }
        },
        undefined,
        context.subscriptions
      );

    } catch (error) {
      console.error('Error opening search:', error);
      vscode.window.showErrorMessage(
        'DevStash: Failed to open search interface: ' + 
        (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  });

  context.subscriptions.push(searchDisposable);
}

/**
 * This method is called when the extension is deactivated.
 */
export function deactivate() {}
