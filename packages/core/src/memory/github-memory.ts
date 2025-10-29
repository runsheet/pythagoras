import * as github from '@actions/github';
import { BaseChatMessageHistory } from '@langchain/core/chat_history';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

/**
 * Chat message stored in GitHub issue comments
 */
export interface GitHubChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * GitHubMemoryManager uses GitHub issues and comments as persistent memory
 * for the agent's conversation history
 */
export class GitHubMemoryManager extends BaseChatMessageHistory {
  private octokit: ReturnType<typeof github.getOctokit>;
  private owner: string;
  private repo: string;
  private issueNumber: number;
  private messages: BaseMessage[] = [];

  lc_namespace = ['langchain', 'stores', 'message', 'github'];

  constructor(token: string, owner: string, repo: string, issueNumber: number) {
    super();
    this.octokit = github.getOctokit(token);
    this.owner = owner;
    this.repo = repo;
    this.issueNumber = issueNumber;
  }

  /**
   * Load message history from GitHub issue and comments
   */
  async loadMessages(): Promise<void> {
    console.log(`Loading message history from issue #${this.issueNumber}`);

    // Get issue details
    const issue = await this.octokit.rest.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: this.issueNumber,
    });

    // Add issue body as the initial user message
    this.messages.push(
      new HumanMessage({
        content: `Issue: ${issue.data.title}\n\n${issue.data.body || ''}`,
      })
    );

    // Get all comments
    const comments = await this.octokit.rest.issues.listComments({
      owner: this.owner,
      repo: this.repo,
      issue_number: this.issueNumber,
    });

    // Parse comments as messages
    for (const comment of comments.data) {
      const body = comment.body || '';

      // Detect if this is a bot comment (AI response)
      const isBot =
        comment.user?.type === 'Bot' || body.startsWith('[Pythagoras]') || body.startsWith('🤖');

      if (isBot) {
        this.messages.push(new AIMessage({ content: body }));
      } else {
        this.messages.push(new HumanMessage({ content: body }));
      }
    }

    console.log(`Loaded ${this.messages.length} message(s) from issue`);
  }

  /**
   * Get all messages in the conversation
   */
  async getMessages(): Promise<BaseMessage[]> {
    if (this.messages.length === 0) {
      await this.loadMessages();
    }
    return this.messages;
  }

  /**
   * Add a message to the memory and post as a comment
   */
  async addMessage(message: BaseMessage): Promise<void> {
    this.messages.push(message);

    // Post as a comment to GitHub
    const content = message.content as string;
    const prefix = message._getType() === 'ai' ? '🤖 **Pythagoras AI**\n\n' : '';

    await this.octokit.rest.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: this.issueNumber,
      body: `${prefix}${content}`,
    });
  }

  /**
   * Add multiple messages
   */
  async addMessages(messages: BaseMessage[]): Promise<void> {
    for (const message of messages) {
      await this.addMessage(message);
    }
  }

  /**
   * Clear all messages (not implemented for GitHub - would require deleting comments)
   */
  async clear(): Promise<void> {
    console.warn('Clear is not supported for GitHub memory');
    this.messages = [];
  }

  /**
   * Add a user message to the issue
   */
  async addUserMessage(content: string): Promise<void> {
    await this.addMessage(new HumanMessage({ content }));
  }

  /**
   * Add an AI message to the issue
   */
  async addAIMessage(content: string): Promise<void> {
    await this.addMessage(new AIMessage({ content }));
  }

  /**
   * Get the latest message
   */
  getLatestMessage(): BaseMessage | undefined {
    return this.messages[this.messages.length - 1];
  }

  /**
   * Get conversation summary for context
   */
  getSummary(): string {
    if (this.messages.length === 0) {
      return 'No conversation history';
    }

    const summary: string[] = [];
    for (const msg of this.messages) {
      const role =
        msg._getType() === 'human' ? 'User' : msg._getType() === 'ai' ? 'Assistant' : 'System';
      const preview = (msg.content as string).substring(0, 100);
      summary.push(`${role}: ${preview}...`);
    }

    return summary.join('\n');
  }
}
