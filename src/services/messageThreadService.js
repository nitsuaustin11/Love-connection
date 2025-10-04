/**
 * MESSAGE THREAD SERVICE
 *
 * Manages message threads and conversation history
 * Handles:
 * - Creating and updating message threads
 * - Storing messages (user + AI responses)
 * - Auto-generating conversation summaries after 5 messages
 * - Maintaining last 10 messages while keeping full summary
 */

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../Firebaseconfig';

/**
 * Create a new message thread
 * @param {string} userId - Creator's user ID
 * @param {string} contactId - Contact ID (AI therapist or user)
 * @param {string} contactName - Contact name
 * @param {string} contactType - Type of contact ('ai_therapist' or 'user')
 * @param {Object} checkInData - Creator's check-in data (optional)
 */
export const createMessageThread = async (userId, contactId, contactName, contactType, checkInData = null) => {
  try {
    console.log('=== CREATE MESSAGE THREAD DEBUG ===');
    console.log('CheckInData received:', JSON.stringify(checkInData, null, 2));
    console.log('CheckInData.responses:', checkInData?.responses);
    console.log('Intensity value (howMuch):', checkInData?.responses?.howMuch);

    const threadId = `${userId}_${contactId}_${Date.now()}`;
    const threadData = {
      threadId,
      userId, // Legacy field - keeping for backwards compatibility
      contactId, // Legacy field - keeping for backwards compatibility
      contactName, // Legacy field - keeping for backwards compatibility
      contactType, // Legacy field - keeping for backwards compatibility

      // Check-in metadata for display in thread headers
      checkInMetadata: {
        name: checkInData?.name || null,
        emotion: checkInData?.emotion || null,
        intensity: checkInData?.responses?.howMuch || null,
        timestamp: checkInData?.timestamp || null,
      },

      // New participant-based structure
      participants: [
        {
          userId: userId,
          role: 'creator',
          status: 'active',
          checkInData: checkInData,
          joinedAt: new Date().toISOString(),
        }
      ],
      // Set sessionType based on contact type
      // 'private' = solo with AI therapist
      // 'public' = multi-user session with other users
      sessionType: (contactType === 'ai_therapist' || contactType === 'ai') ? 'private' : 'public',
      pendingInvites: [],

      messages: [],
      conversationSummary: null,
      messageCount: 0,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    console.log('CheckInMetadata being saved:', threadData.checkInMetadata);
    console.log('=== END CREATE MESSAGE THREAD DEBUG ===');

    const threadRef = doc(db, 'messageThreads', threadId);
    await setDoc(threadRef, threadData);

    console.log('Created new message thread:', threadId);
    return threadData;
  } catch (error) {
    console.error('Error creating message thread:', error);
    throw error;
  }
};

/**
 * Get all message threads for a user
 * Includes threads where user is creator OR participant
 */
export const getUserMessageThreads = async (userId) => {
  try {
    const threadsRef = collection(db, 'messageThreads');

    // Query for threads where user is the creator (legacy)
    const creatorQuery = query(threadsRef, where('userId', '==', userId));
    const creatorSnapshot = await getDocs(creatorQuery);

    const threads = [];
    const threadIds = new Set();

    // Add creator threads
    creatorSnapshot.forEach((doc) => {
      threads.push(doc.data());
      threadIds.add(doc.data().threadId);
    });

    // Get all threads and filter for ones where user is a participant
    // Note: Firestore doesn't support querying inside arrays of objects efficiently,
    // so we fetch all and filter client-side for now
    // TODO: Consider restructuring for better query performance with large datasets
    const allThreadsSnapshot = await getDocs(threadsRef);
    allThreadsSnapshot.forEach((doc) => {
      const threadData = doc.data();
      if (threadIds.has(threadData.threadId)) return; // Already added

      // Check if user is in participants array
      const isParticipant = threadData.participants?.some(p => p.userId === userId);
      if (isParticipant) {
        threads.push(threadData);
        threadIds.add(threadData.threadId);
      }
    });

    // Sort by most recent message
    threads.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    return threads;
  } catch (error) {
    console.error('Error getting user message threads:', error);
    throw error;
  }
};

/**
 * Get a specific message thread
 */
export const getMessageThread = async (threadId) => {
  try {
    const threadRef = doc(db, 'messageThreads', threadId);
    const threadSnap = await getDoc(threadRef);

    if (threadSnap.exists()) {
      return threadSnap.data();
    } else {
      console.log('No thread found with id:', threadId);
      return null;
    }
  } catch (error) {
    console.error('Error getting message thread:', error);
    throw error;
  }
};

/**
 * Add a message to a thread
 */
export const addMessageToThread = async (threadId, message) => {
  try {
    const threadRef = doc(db, 'messageThreads', threadId);
    const threadSnap = await getDoc(threadRef);

    if (!threadSnap.exists()) {
      throw new Error('Thread not found');
    }

    const threadData = threadSnap.data();
    const messages = threadData.messages || [];

    // Create new message object
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender: message.sender, // 'user' or 'ai'
      content: message.content,
      timestamp: new Date().toISOString(),
      ...message.metadata, // Any additional metadata
    };

    messages.push(newMessage);

    const updatedData = {
      messages,
      messageCount: messages.length,
      lastMessageAt: new Date().toISOString(),
    };

    await updateDoc(threadRef, updatedData);

    console.log('Added message to thread:', threadId);
    return newMessage;
  } catch (error) {
    console.error('Error adding message to thread:', error);
    throw error;
  }
};

/**
 * Generate conversation summary (placeholder for now)
 * Will be replaced with actual LLM call later
 */
export const generateConversationSummary = async (messages) => {
  // TODO: Replace with actual LLM API call
  const messageCount = messages.length;
  const userMessages = messages.filter(m => m.sender === 'user').length;
  const aiMessages = messages.filter(m => m.sender === 'ai').length;

  const summary = `Conversation contains ${messageCount} messages (${userMessages} from user, ${aiMessages} from AI). Last discussed: ${messages[messages.length - 1]?.content.substring(0, 100)}...`;

  return summary;
};

/**
 * Check if summary is needed and update thread
 * Called after every 5 messages
 */
export const checkAndUpdateSummary = async (threadId) => {
  try {
    const threadRef = doc(db, 'messageThreads', threadId);
    const threadSnap = await getDoc(threadRef);

    if (!threadSnap.exists()) {
      throw new Error('Thread not found');
    }

    const threadData = threadSnap.data();
    const messages = threadData.messages || [];
    const messageCount = messages.length;

    // Generate summary every 5 messages
    if (messageCount > 0 && messageCount % 5 === 0) {
      console.log(`Generating summary for thread ${threadId} at ${messageCount} messages`);

      // Generate new summary from all messages
      const summary = await generateConversationSummary(messages);

      // Keep only last 10 messages
      const last10Messages = messages.slice(-10);

      const updatedData = {
        conversationSummary: summary,
        messages: last10Messages,
        fullMessageCount: messageCount, // Track total even if we trim
      };

      await updateDoc(threadRef, updatedData);

      console.log('Updated conversation summary and trimmed to last 10 messages');
      return { summary, trimmed: true };
    }

    return { summary: threadData.conversationSummary, trimmed: false };
  } catch (error) {
    console.error('Error checking/updating summary:', error);
    throw error;
  }
};

/**
 * Get recent messages for GPT context (last 10)
 */
export const getRecentMessagesForContext = (thread) => {
  if (!thread || !thread.messages) return [];

  // Return last 10 messages formatted for GPT
  const recentMessages = thread.messages.slice(-10).map(msg => ({
    sender: msg.sender === 'user' ? 'User' : 'AI Therapist',
    content: msg.content,
    timestamp: msg.timestamp,
  }));

  return recentMessages;
};

/**
 * Create initial check-in message (summary of user's emotional state)
 * This will call the summaryAssembler to generate an LLM-created summary
 *
 * @param {string} emotion - Selected emotion from check-in
 * @param {string} checkInContext - Generated context from check-in responses
 * @param {Object} personalityContext - User's personality data (MBTI, Six Needs, Love Languages)
 * @param {Object} user - Full user object for additional context
 * @returns {Promise<string>} Summary message (under 150 words)
 */
export const createCheckInSummaryMessage = async (emotion, checkInContext, personalityContext, user) => {
  // Import summaryAssembler dynamically to avoid circular dependencies
  const { summaryAssembler } = require('./contextAssembler');

  // For now, return placeholder while LLM integration is being built
  // TODO: Implement actual LLM call in summaryAssembler
  const summary = await summaryAssembler(emotion, checkInContext, personalityContext, user);

  return summary;
};
