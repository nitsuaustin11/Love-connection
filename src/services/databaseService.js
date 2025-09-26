import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  setDoc,
  increment
} from 'firebase/firestore';
import { db } from '../../Firebaseconfig';
import {
  getUserProfile,
  updateUserProfile,
  initializeUserProfile
} from './userProfileService';

class DatabaseService {
  // ===== USER PROFILE MANAGEMENT =====

  getUser = async (userId) => {
    try {
      const profile = await getUserProfile(userId);
      if (profile) {
        return { success: true, data: profile };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  };

  updateUser = async (userId, updates) => {
    try {
      await updateUserProfile(userId, {
        ...updates,
        'accountStatus.lastActiveAt': new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  };

  // ===== PERSONALITY TESTS =====

  updatePersonalityTest = async (userId, testType, testData) => {
    try {
      const updatePath = `personalityTests.${testType}`;
      await updateUserProfile(userId, {
        [updatePath]: {
          ...testData,
          completed: true,
          completedAt: new Date().toISOString()
        },
        'gptMessageContext.lastUpdated': new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating personality test:', error);
      return { success: false, error: error.message };
    }
  };

  getPersonalityTestResults = async (userId, testType = null) => {
    try {
      const profile = await getUserProfile(userId);
      if (!profile) {
        return { success: false, error: 'User not found' };
      }

      if (testType) {
        return {
          success: true,
          data: profile.personalityTests?.[testType] || null
        };
      } else {
        return {
          success: true,
          data: profile.personalityTests || {}
        };
      }
    } catch (error) {
      console.error('Error getting personality test results:', error);
      return { success: false, error: error.message };
    }
  };

  // ===== EMOTION CHECK-INS =====

  createEmotionCheckin = async (userId, checkinData) => {
    try {
      const checkinId = `checkin_${new Date().toISOString().split('T')[0]}_${Date.now()}`;
      const checkinWithId = {
        ...checkinData,
        checkinId,
        userId,
        startedAt: new Date().toISOString()
      };

      await updateUserProfile(userId, {
        currentCheckin: checkinWithId,
        'gptMessageContext.lastUpdated': new Date().toISOString()
      });

      return { success: true, data: checkinWithId };
    } catch (error) {
      console.error('Error creating emotion check-in:', error);
      return { success: false, error: error.message };
    }
  };

  completeEmotionCheckin = async (userId, checkinData) => {
    try {
      const completedCheckin = {
        ...checkinData,
        completedAt: new Date().toISOString(),
        status: 'completed'
      };

      await updateUserProfile(userId, {
        currentCheckin: null,
        emotionHistory: arrayUnion(completedCheckin),
        'gptMessageContext.lastUpdated': new Date().toISOString(),
        'gptMessageContext.currentEmotionalContext': {
          primaryEmotion: checkinData.primaryEmotion?.emotion,
          intensity: checkinData.immediateFeedback?.intensityLevel?.answer,
          triggers: [checkinData.immediateFeedback?.whatTriggered?.answer],
          situationalContext: checkinData.immediateFeedback?.whatHappened?.answer
        }
      });

      return { success: true, data: completedCheckin };
    } catch (error) {
      console.error('Error completing emotion check-in:', error);
      return { success: false, error: error.message };
    }
  };

  getEmotionHistory = async (userId, limit = 10) => {
    try {
      const profile = await getUserProfile(userId);
      if (!profile) {
        return { success: false, error: 'User not found' };
      }

      const emotionHistory = profile.emotionHistory || [];
      const sortedHistory = emotionHistory
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
        .slice(0, limit);

      return { success: true, data: sortedHistory };
    } catch (error) {
      console.error('Error getting emotion history:', error);
      return { success: false, error: error.message };
    }
  };

  // ===== AI THERAPIST MESSAGING =====

  createMessageThread = async (userId, threadData) => {
    try {
      const threadId = `thread_${threadData.participantType}_${Date.now()}`;
      const newThread = {
        threadId,
        ...threadData,
        lastMessageAt: new Date().toISOString(),
        messageCount: 0,
        isActive: true,
        recentMessages: []
      };

      await updateUserProfile(userId, {
        messageThreads: arrayUnion(newThread)
      });

      return { success: true, data: newThread };
    } catch (error) {
      console.error('Error creating message thread:', error);
      return { success: false, error: error.message };
    }
  };

  getUserMessageThreads = async (userId) => {
    try {
      const profile = await getUserProfile(userId);
      if (!profile) {
        return { success: false, error: 'User not found' };
      }

      const threads = profile.messageThreads || [];
      const sortedThreads = threads
        .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

      return { success: true, data: sortedThreads };
    } catch (error) {
      console.error('Error getting message threads:', error);
      return { success: false, error: error.message };
    }
  };

  sendMessage = async (userId, threadId, messageData) => {
    try {
      const messageId = `msg_${Date.now()}`;
      const message = {
        id: messageId,
        sender: messageData.sender,
        content: messageData.content,
        timestamp: new Date().toISOString(),
        emotionContext: messageData.emotionContext || null,
        basedOnContext: messageData.basedOnContext || false
      };

      // Add message to separate messages collection for the thread
      const threadRef = doc(db, 'messageThreads', threadId);
      await updateDoc(threadRef, {
        messages: arrayUnion(message),
        lastMessageAt: new Date().toISOString(),
        messageCount: increment(1)
      });

      // Update user's message thread data
      const profile = await getUserProfile(userId);
      const updatedThreads = profile.messageThreads.map(thread => {
        if (thread.threadId === threadId) {
          return {
            ...thread,
            lastMessageAt: new Date().toISOString(),
            messageCount: (thread.messageCount || 0) + 1,
            recentMessages: [
              message,
              ...thread.recentMessages.slice(0, 4) // Keep only last 5 messages
            ]
          };
        }
        return thread;
      });

      await updateUserProfile(userId, {
        messageThreads: updatedThreads
      });

      return { success: true, data: message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  };

  getThreadMessages = async (threadId, limitCount = 50) => {
    try {
      const threadDoc = await getDoc(doc(db, 'messageThreads', threadId));

      if (!threadDoc.exists()) {
        return { success: true, data: [] };
      }

      const threadData = threadDoc.data();
      const messages = threadData.messages || [];

      // Sort by timestamp and limit
      const sortedMessages = messages
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-limitCount);

      return { success: true, data: sortedMessages };
    } catch (error) {
      console.error('Error getting thread messages:', error);
      return { success: false, error: error.message };
    }
  };

  subscribeToThreadMessages = (threadId, callback) => {
    const threadRef = doc(db, 'messageThreads', threadId);

    return onSnapshot(threadRef, (doc) => {
      if (doc.exists()) {
        const threadData = doc.data();
        const messages = threadData.messages || [];
        const sortedMessages = messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        callback(sortedMessages);
      } else {
        callback([]);
      }
    });
  };

  // ===== APP PREFERENCES =====

  updateAppPreferences = async (userId, preferences) => {
    try {
      await updateUserProfile(userId, {
        appPreferences: {
          ...preferences
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating app preferences:', error);
      return { success: false, error: error.message };
    }
  };
}

export default new DatabaseService();