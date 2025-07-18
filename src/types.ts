/**
 * The payload sent from the VSCode extension to the webhook.
 */
export interface DevStashPayload {
  /** A unique identifier for the stash item. */
  id: string;

  /** The selected code or text content. */
  content: string;

  /** The language identifier from the active VSCode editor (e.g., 'typescript', 'python'). */
  language: string;

  /** Optional tags provided by the user. */
  userTags: string[];

  /** Optional note provided by the user. */
  note?: string;

  /** The ISO 8601 timestamp of when the item was created. */
  createdAt: string;
}
