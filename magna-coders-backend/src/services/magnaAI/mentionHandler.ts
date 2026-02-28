import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// AI Backend URL from environment
const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:8000';
const AI_API_KEY = process.env.AI_API_KEY || '';

// MagnaAI bot user ID (the account we created)
const MAGNA_AI_BOT_ID = 'fcfa63af-4550-4111-a66a-aa32a9e1d885';

/**
 * Check if a post mentions @magnaai
 */
export function hasMagnaAIMention(content: string): boolean {
  if (!content) return false;
  
  // Check for @magnaai mention (case insensitive)
  const mentionPattern = /@magnaai\b/i;
  return mentionPattern.test(content);
}

/**
 * Extract the context from a post for AI processing
 */
function extractPostContext(post: any): string {
  let context = `Post Title: ${post.title}\n`;
  
  if (post.content) {
    context += `Post Content: ${post.content}\n`;
  }
  
  if (post.users) {
    context += `Posted by: ${post.users.username}\n`;
  }
  
  if (post.post_tags && post.post_tags.length > 0) {
    const tags = post.post_tags.map((pt: any) => pt.tags.name).join(', ');
    context += `Tags: ${tags}\n`;
  }
  
  return context;
}

/**
 * Get AI response for a post mention
 */
async function getAIResponse(postContext: string, authorId: string): Promise<string> {
  try {
    console.log('[MagnaAI] Requesting AI response for post mention');
    
    // Generate a JWT token for the bot user to authenticate with AI backend
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    const botToken = jwt.sign(
      { userId: MAGNA_AI_BOT_ID },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Call AI backend to get response with a fun, casual personality
    const response = await axios.post(
      `${AI_BACKEND_URL}/api/chat/message`,
      {
        message: `Hey! Someone just mentioned me (@magnaai) in their post. Here's what they said:\n\n${postContext}\n\nGive me a cool, fun, and helpful response - think Grok vibes! Be casual, maybe throw in some humor or emojis, but still be genuinely helpful. Keep it real and engaging!`,
        conversation_id: uuidv4(), // New conversation for each mention
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${botToken}`,
          'Content-Type': 'application/json',
          'X-API-Key': AI_API_KEY
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    if (response.data && response.data.content) {
      return response.data.content;
    }
    
    console.error('[MagnaAI] Invalid response format from AI backend');
    return '👋 Hey! Thanks for the mention! I\'m here to help you crush it on Magna. What\'s on your mind?';
    
  } catch (error: any) {
    console.error('[MagnaAI] Error getting AI response:', error.message);
    
    // Fallback response if AI backend is unavailable
    return '👋 Thanks for the shoutout! I\'m a bit swamped right now, but hit me up in the Magna AI chat and I\'ll give you my full attention! 🚀';
  }
}

/**
 * Post a comment as MagnaAI bot
 */
async function postAIComment(postId: string, content: string): Promise<any> {
  try {
    const commentId = uuidv4();
    
    const comment = await prisma.comments.create({
      data: {
        id: commentId,
        post_id: postId,
        author_id: MAGNA_AI_BOT_ID,
        content: content,
        parent_id: null
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        }
      }
    });
    
    console.log('[MagnaAI] Posted comment successfully');
    return comment;
    
  } catch (error: any) {
    console.error('[MagnaAI] Error posting comment:', error.message);
    throw error;
  }
}

/**
 * Create a repost as MagnaAI bot
 */
async function createAIRepost(originalPost: any, aiResponse: string): Promise<any> {
  try {
    const repostId = uuidv4();
    
    // Create a new post as a response/repost
    const repost = await prisma.posts.create({
      data: {
        id: repostId,
        title: `Re: ${originalPost.title}`,
        content: `${aiResponse}\n\n---\n💬 Responding to @${originalPost.users.username}'s post: "${originalPost.title}"`,
        post_type: 'regular',
        author_id: MAGNA_AI_BOT_ID,
        category_id: originalPost.category_id
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        }
      }
    });
    
    console.log('[MagnaAI] Created repost successfully');
    return repost;
    
  } catch (error: any) {
    console.error('[MagnaAI] Error creating repost:', error.message);
    throw error;
  }
}

/**
 * Send notification to post author about AI response
 */
async function notifyAuthor(postId: string, authorId: string, commentId: string): Promise<void> {
  try {
    // Don't notify if the author is the bot itself
    if (authorId === MAGNA_AI_BOT_ID) {
      return;
    }
    
    await prisma.notifications.create({
      data: {
        id: uuidv4(),
        user_id: authorId,
        title: 'Magna AI responded to your post',
        message: 'Magna AI has responded to your post where you mentioned @magnaai',
        post_id: postId
      }
    });
    
    console.log('[MagnaAI] Notification sent to author');
    
  } catch (error: any) {
    console.error('[MagnaAI] Error sending notification:', error.message);
    // Don't throw - notification failure shouldn't break the flow
  }
}

/**
 * Handle @magnaai mention in a post
 * This is the main entry point called when a post is created
 */
export async function handleMagnaAIMention(postId: string): Promise<void> {
  try {
    console.log(`[MagnaAI] Processing mention in post ${postId}`);
    
    // Fetch the post with all details
    const post = await prisma.posts.findUnique({
      where: { id: postId },
      include: {
        users: {
          select: {
            id: true,
            username: true
          }
        },
        post_tags: {
          include: {
            tags: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!post) {
      console.error('[MagnaAI] Post not found');
      return;
    }
    
    // Check if post mentions @magnaai
    const hasMention = hasMagnaAIMention(post.title) || hasMagnaAIMention(post.content || '');
    
    if (!hasMention) {
      console.log('[MagnaAI] No @magnaai mention found in post');
      return;
    }
    
    console.log('[MagnaAI] @magnaai mention detected, generating response...');
    
    // Extract post context
    const postContext = extractPostContext(post);
    
    // Get AI response
    const aiResponse = await getAIResponse(postContext, post.author_id);
    
    // Create a repost as MagnaAI (instead of just commenting)
    const repost = await createAIRepost(post, aiResponse);
    
    // Also post a comment on the original post with a link
    await postAIComment(
      postId, 
      `👋 Hey! I created a response post for you. Check it out! 🚀`
    );
    
    // Notify the post author
    await notifyAuthor(postId, post.author_id, repost.id);
    
    console.log('[MagnaAI] Successfully handled mention and created repost');
    
  } catch (error: any) {
    console.error('[MagnaAI] Error handling mention:', error.message);
    // Don't throw - we don't want to break post creation if AI fails
  }
}

/**
 * Process mention asynchronously (non-blocking)
 * This should be called from the post creation endpoint
 */
export function processMentionAsync(postId: string): void {
  // Process in background without blocking the response
  setImmediate(() => {
    handleMagnaAIMention(postId).catch(error => {
      console.error('[MagnaAI] Background processing error:', error);
    });
  });
}
