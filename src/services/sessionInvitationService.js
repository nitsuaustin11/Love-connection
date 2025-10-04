/**
 * SESSION INVITATION SERVICE
 *
 * Manages invitations for multi-participant therapy sessions
 * Handles:
 * - Sending session invites (assistant or participant roles)
 * - Accepting/declining invites
 * - Managing participant status (pending_checkin, active)
 * - Updating thread participants array
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../Firebaseconfig';

/**
 * Send session invite to a user
 * @param {string} threadId - Thread ID to invite to
 * @param {string} inviterUserId - User sending the invite
 * @param {string} targetUserId - User being invited
 * @param {string} role - 'participant' or 'assistant'
 * @returns {Object} Invitation object
 */
export const sendSessionInvite = async (threadId, inviterUserId, targetUserId, role) => {
  try {
    // Get thread data
    const threadRef = doc(db, 'messageThreads', threadId);
    const threadSnap = await getDoc(threadRef);

    if (!threadSnap.exists()) {
      throw new Error('Thread not found');
    }

    const threadData = threadSnap.data();

    // Check if user is already a participant
    const isAlreadyParticipant = threadData.participants?.some(p => p.userId === targetUserId);
    if (isAlreadyParticipant) {
      throw new Error('User is already a participant in this session');
    }

    // Check if invite already exists
    const existingInvite = threadData.pendingInvites?.find(
      inv => inv.targetUserId === targetUserId && inv.status === 'pending'
    );
    if (existingInvite) {
      throw new Error('Invite already pending for this user');
    }

    // Create invitation
    const invitation = {
      inviteId: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      threadId: threadId,
      inviterUserId: inviterUserId,
      targetUserId: targetUserId,
      role: role, // 'participant' or 'assistant'
      status: 'pending',
      sentAt: new Date().toISOString(),
    };

    // Add to thread's pending invites
    const updatedInvites = [...(threadData.pendingInvites || []), invitation];
    await updateDoc(threadRef, {
      pendingInvites: updatedInvites,
    });

    console.log('Session invite sent:', invitation);
    return invitation;
  } catch (error) {
    console.error('Error sending session invite:', error);
    throw error;
  }
};

/**
 * Accept a session invite
 * @param {string} inviteId - Invitation ID
 * @param {Object} checkInData - Check-in data (required if role is 'participant', optional for 'assistant')
 * @returns {Object} Updated thread data
 */
export const acceptInvite = async (inviteId, checkInData = null) => {
  try {
    // Find the thread containing this invite
    // Note: In production, you'd want to store invite-to-thread mapping for efficiency
    const { collection, getDocs } = require('firebase/firestore');
    const threadsRef = collection(db, 'messageThreads');
    const threadsSnapshot = await getDocs(threadsRef);

    let targetThread = null;
    let targetInvite = null;

    threadsSnapshot.forEach((doc) => {
      const threadData = doc.data();
      const invite = threadData.pendingInvites?.find(inv => inv.inviteId === inviteId);
      if (invite) {
        targetThread = threadData;
        targetInvite = invite;
      }
    });

    if (!targetThread || !targetInvite) {
      throw new Error('Invite not found');
    }

    if (targetInvite.status !== 'pending') {
      throw new Error('Invite is no longer pending');
    }

    // Validate check-in data for participants
    if (targetInvite.role === 'participant' && !checkInData) {
      throw new Error('Participant must provide check-in data before joining');
    }

    // Create participant object
    const newParticipant = {
      userId: targetInvite.targetUserId,
      role: targetInvite.role,
      status: targetInvite.role === 'assistant' ? 'active' : (checkInData ? 'active' : 'pending_checkin'),
      checkInData: checkInData,
      joinedAt: new Date().toISOString(),
    };

    // Update thread
    const threadRef = doc(db, 'messageThreads', targetThread.threadId);

    // Add participant
    const updatedParticipants = [...(targetThread.participants || []), newParticipant];

    // Update invite status
    const updatedInvites = (targetThread.pendingInvites || []).map(inv =>
      inv.inviteId === inviteId
        ? { ...inv, status: 'accepted', acceptedAt: new Date().toISOString() }
        : inv
    );

    // Change session type to public (multi-user)
    await updateDoc(threadRef, {
      participants: updatedParticipants,
      pendingInvites: updatedInvites,
      sessionType: 'public',
    });

    console.log('Invite accepted:', inviteId);

    // Return updated thread
    const updatedThreadSnap = await getDoc(threadRef);
    return updatedThreadSnap.data();
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw error;
  }
};

/**
 * Decline a session invite
 * @param {string} inviteId - Invitation ID
 */
export const declineInvite = async (inviteId) => {
  try {
    // Find the thread containing this invite
    const { collection, getDocs } = require('firebase/firestore');
    const threadsRef = collection(db, 'messageThreads');
    const threadsSnapshot = await getDocs(threadsRef);

    let targetThread = null;

    threadsSnapshot.forEach((doc) => {
      const threadData = doc.data();
      const invite = threadData.pendingInvites?.find(inv => inv.inviteId === inviteId);
      if (invite) {
        targetThread = threadData;
      }
    });

    if (!targetThread) {
      throw new Error('Invite not found');
    }

    // Update invite status
    const threadRef = doc(db, 'messageThreads', targetThread.threadId);
    const updatedInvites = (targetThread.pendingInvites || []).map(inv =>
      inv.inviteId === inviteId
        ? { ...inv, status: 'declined', declinedAt: new Date().toISOString() }
        : inv
    );

    await updateDoc(threadRef, {
      pendingInvites: updatedInvites,
    });

    console.log('Invite declined:', inviteId);
  } catch (error) {
    console.error('Error declining invite:', error);
    throw error;
  }
};

/**
 * Get all pending invites for a user
 * @param {string} userId - User ID
 * @returns {Array} Array of pending invites
 */
export const getPendingInvites = async (userId) => {
  try {
    const { collection, getDocs } = require('firebase/firestore');
    const threadsRef = collection(db, 'messageThreads');
    const threadsSnapshot = await getDocs(threadsRef);

    const pendingInvites = [];

    threadsSnapshot.forEach((doc) => {
      const threadData = doc.data();
      const userInvites = (threadData.pendingInvites || []).filter(
        inv => inv.targetUserId === userId && inv.status === 'pending'
      );

      // Add thread info to each invite
      userInvites.forEach(invite => {
        pendingInvites.push({
          ...invite,
          threadName: threadData.contactName,
          threadId: threadData.threadId,
        });
      });
    });

    // Sort by most recent
    pendingInvites.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    return pendingInvites;
  } catch (error) {
    console.error('Error getting pending invites:', error);
    throw error;
  }
};

/**
 * Get all active participants for a thread
 * @param {string} threadId - Thread ID
 * @returns {Array} Array of participants
 */
export const getThreadParticipants = async (threadId) => {
  try {
    const threadRef = doc(db, 'messageThreads', threadId);
    const threadSnap = await getDoc(threadRef);

    if (!threadSnap.exists()) {
      throw new Error('Thread not found');
    }

    const threadData = threadSnap.data();
    return threadData.participants || [];
  } catch (error) {
    console.error('Error getting thread participants:', error);
    throw error;
  }
};

/**
 * Update participant status (e.g., pending_checkin -> active)
 * @param {string} threadId - Thread ID
 * @param {string} userId - User ID
 * @param {string} newStatus - New status
 * @param {Object} checkInData - Check-in data (optional)
 */
export const updateParticipantStatus = async (threadId, userId, newStatus, checkInData = null) => {
  try {
    const threadRef = doc(db, 'messageThreads', threadId);
    const threadSnap = await getDoc(threadRef);

    if (!threadSnap.exists()) {
      throw new Error('Thread not found');
    }

    const threadData = threadSnap.data();
    const updatedParticipants = (threadData.participants || []).map(p =>
      p.userId === userId
        ? {
            ...p,
            status: newStatus,
            checkInData: checkInData || p.checkInData,
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    await updateDoc(threadRef, {
      participants: updatedParticipants,
    });

    console.log('Participant status updated:', userId, newStatus);
  } catch (error) {
    console.error('Error updating participant status:', error);
    throw error;
  }
};
