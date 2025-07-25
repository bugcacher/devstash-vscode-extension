# DevStash VS Code Extension

Quickly save code snippets, commands, and notes to your personal knowledge vault. DevStash integrates with your n8n workflow and Algolia search to create a powerful, searchable repository of your development knowledge.

## Features

- **Quick Save**: Save selected code snippets with context
- **Instant Search**: Search through your saved snippets using Algolia
- **n8n Integration**: Send snippets to your n8n workflow
- **Secure**: Optional authentication with tokens

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| `Devstash: Save` | `Ctrl+Alt+S` (Windows/Linux)<br>`Cmd+Opt+S` (Mac) | Save selected text to your vault |
| `Devstash: Search` | `Ctrl+Alt+D` (Windows/Linux)<br>`Cmd+Opt+D` (Mac) | Search through your saved snippets |

## Installation

### From VSIX File

1. Download the latest `.vsix` file from the [Releases](https://github.com/bugcacher/devstash-vscode-extension/releases) page
2. Open VS Code
3. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac) to open the Command Palette
4. Type "Extensions: Install from VSIX..." and select it
5. Browse to and select the downloaded `.vsix` file
6. Restart VS Code when prompted


## Configuration

Before using DevStash, you need to configure the following settings in VS Code:

### Required Settings

#### n8n Workflow Configuration
- **`devstash.webhookUrl`**: The webhook URL to your n8n workflow where code snippets will be sent
  - Example: `https://your-n8n-instance.com/webhook/devstash`

- **`devstash.authToken (Optional)`**: Authorization token for authenticating with your n8n workflow
  - Leave empty if your n8n workflow doesn't require authentication

For n8n setup instructions, see the [n8n workflow README](./n8n-workflow/README.md).

#### Algolia Search Configuration
- **`devstash.algoliaAppId`**: Your Algolia Application ID
- **`devstash.algoliaApiKey`**: Your Algolia Search-Only API Key (not Admin API Key)
- **`devstash.algoliaIndexName`**: The name of your Algolia search index



### How to Configure

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "DevStash"
3. Fill in the required configuration values
4. Restart VS Code or reload the window

### Example Configuration

```json
{
  "devstash.webhookUrl": "https://your-n8n-instance.com/webhook/devstash",
  "devstash.authToken": "your-bearer-token-here",
  "devstash.algoliaAppId": "YOUR_APP_ID",
  "devstash.algoliaApiKey": "your-search-only-api-key",
  "devstash.algoliaIndexName": "dev_snippets"
}
```

## Usage

1. **Save a Snippet**: Select code in the editor and press `Ctrl+Alt+S` (or `Cmd+Opt+S` on Mac)
2. **Search Snippets**: Press `Ctrl+Alt+D` (or `Cmd+Opt+D` on Mac) to search through your saved snippets

## Requirements

- VS Code 1.80.0 or higher
