import * as vscode from 'vscode';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { DevStashPayload } from './types';

/**
 * This method is called when the extension is activated.
 * It registers the 'devstash.saveSelection' command.
 */
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('devstash.saveSelection', async () => {
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
        content: selection,
        language: editor.document.languageId,
        userTags,
        createdAt: new Date().toISOString(),
      };

      const authToken = config.get<string>('authToken');
      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
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

  context.subscriptions.push(disposable);
}

/**
 * This method is called when the extension is deactivated.
 */
export function deactivate() {}
