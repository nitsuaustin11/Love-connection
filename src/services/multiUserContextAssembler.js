/**
 * MULTI-USER CONTEXT ASSEMBLER SERVICE
 *
 * Handles context assembly for public (multi-participant) therapy sessions
 * Differentiates between:
 * - Private context: Solo user with AI therapist
 * - Public Participant context: Multiple active participants
 * - Public Assistant context: Observer/supporter role
 */

import { getUserProfile } from './userProfileService';

/**
 * Determine context type based on thread data
 * @param {Object} thread - Thread data
 * @returns {string} 'private' | 'public_participant' | 'public_assistant'
 */
export const determineContextType = (thread) => {
  if (!thread) return 'private';

  // Check session type
  if (thread.sessionType === 'private') {
    return 'private';
  }

  // Public session - check if there are any assistants vs all participants
  const participants = thread.participants || [];
  const hasAssistant = participants.some(p => p.role === 'assistant');

  if (hasAssistant) {
    return 'public_assistant';
  }

  return 'public_participant';
};

/**
 * Assemble context for multi-participant session
 * Combines multiple users' personality and emotional data
 * @param {Array} participants - Array of participant objects from thread
 * @param {Object} therapistSettings - AI therapist settings
 * @param {Array} messageHistory - Recent messages
 * @returns {string} Assembled context prompt
 */
export const assemblePublicParticipantContext = async (participants, therapistSettings, messageHistory = []) => {
  try {
    let context = `=== MULTI-PARTICIPANT THERAPY SESSION ===\n\n`;
    context += `This is a collaborative therapy session with ${participants.length} participant(s).\n`;
    context += `Address each participant by name and acknowledge their individual perspectives.\n`;
    context += `Help facilitate healthy communication and mutual understanding.\n\n`;

    // Load each participant's profile data
    const participantProfiles = await Promise.all(
      participants.map(async (p) => {
        const profile = await getUserProfile(p.userId);
        return {
          participant: p,
          profile: profile
        };
      })
    );

    // Build combined personality context
    context += `PARTICIPANTS:\n\n`;

    participantProfiles.forEach(({ participant, profile }, index) => {
      const name = profile?.profile?.firstName || `Participant ${index + 1}`;

      context += `--- ${name.toUpperCase()} ---\n`;

      // Check-in data
      if (participant.checkInData) {
        context += `Current Emotion: ${participant.checkInData.emotion}\n`;
        context += `Emotional Context: ${participant.checkInData.context}\n`;
      }

      // Personality data (if user allows sharing)
      const canSharePersonality = profile?.appPreferences?.privacy?.contactsCanViewPersonality !== false;

      if (canSharePersonality) {
        // MBTI
        if (profile?.personalityTests?.mbti?.completed) {
          context += `MBTI Type: ${profile.personalityTests.mbti.selectedType}\n`;
        }

        // Six Human Needs
        if (profile?.personalityTests?.sixHumanNeeds?.completed) {
          context += `Primary Need: ${profile.personalityTests.sixHumanNeeds.results?.primary || 'Unknown'}\n`;
        }

        // Love Languages
        if (profile?.personalityTests?.loveLanguages?.completed) {
          context += `Love Language: ${profile.personalityTests.loveLanguages.results?.primary || 'Unknown'}\n`;
        }
      }

      // Demographics (if user allows sharing)
      const canShareAbout = profile?.appPreferences?.privacy?.contactsCanViewAboutMe !== false;
      if (canShareAbout) {
        if (profile?.profile?.gender) {
          context += `Gender: ${profile.profile.gender}\n`;
        }
        if (profile?.profile?.ageRange) {
          context += `Age Range: ${profile.profile.ageRange}\n`;
        }
      }

      context += `\n`;
    });

    // Add conversation history with participant names
    if (messageHistory && messageHistory.length > 0) {
      context += `CONVERSATION HISTORY:\n`;
      messageHistory.forEach(msg => {
        // Try to get participant name from profile
        const senderProfile = participantProfiles.find(pp => pp.participant.userId === msg.sender);
        const senderName = senderProfile?.profile?.profile?.firstName || msg.sender;
        context += `${senderName}: ${msg.content}\n`;
      });
      context += `\n`;
    }

    // Add multi-participant guidance
    context += `RESPONSE GUIDELINES:\n`;
    context += `- Address each participant individually when relevant\n`;
    context += `- Acknowledge how each person's emotions and perspectives interact\n`;
    context += `- Help participants understand each other's viewpoints\n`;
    context += `- Consider how personality types affect the group dynamic\n`;
    context += `- Facilitate constructive dialogue between participants\n`;
    context += `- Highlight areas of alignment and difference compassionately\n\n`;

    // Add therapist preferences
    context += `THERAPIST STYLE:\n`;
    context += `Response Style: ${therapistSettings.responseStyle || 'analytical_yet_empathetic'}\n`;
    context += `Conversation Depth: ${therapistSettings.conversationDepth || 'moderate'}\n`;
    context += `Emotional Validation: ${therapistSettings.emotionalValidationLevel || 'balanced'}\n\n`;

    context += `You are now ready to respond. Use all the context above to provide a thoughtful, personalized response that addresses all participants.\n`;

    return context;
  } catch (error) {
    console.error('Error assembling public participant context:', error);
    throw error;
  }
};

/**
 * Assemble context for assistant (observer) role
 * Provides summarized context focused on support
 * @param {Object} creator - Creator participant data
 * @param {Object} assistant - Assistant participant data
 * @param {Object} therapistSettings - AI therapist settings
 * @param {Array} messageHistory - Recent messages
 * @returns {string} Assembled context prompt
 */
export const assemblePublicAssistantContext = async (creator, assistant, therapistSettings, messageHistory = []) => {
  try {
    let context = `=== THERAPY SESSION WITH ASSISTANT ===\n\n`;
    context += `This session has an observer/assistant providing support.\n`;
    context += `The assistant is here to offer perspective but is not the primary focus.\n\n`;

    // Load profiles
    const creatorProfile = await getUserProfile(creator.userId);
    const assistantProfile = await getUserProfile(assistant.userId);

    const creatorName = creatorProfile?.profile?.firstName || 'Primary Participant';
    const assistantName = assistantProfile?.profile?.firstName || 'Assistant';

    // Creator context (full detail)
    context += `--- PRIMARY PARTICIPANT: ${creatorName.toUpperCase()} ---\n`;
    if (creator.checkInData) {
      context += `Current Emotion: ${creator.checkInData.emotion}\n`;
      context += `Emotional Context: ${creator.checkInData.context}\n`;
    }

    // Add creator personality (if available and shared)
    const canSharePersonality = creatorProfile?.appPreferences?.privacy?.contactsCanViewPersonality !== false;
    if (canSharePersonality && creatorProfile?.personalityTests?.mbti?.completed) {
      context += `MBTI: ${creatorProfile.personalityTests.mbti.selectedType}\n`;
    }

    context += `\n`;

    // Assistant context (basic)
    context += `--- ASSISTANT/OBSERVER: ${assistantName.toUpperCase()} ---\n`;
    context += `Role: Supportive observer, providing external perspective\n`;
    if (assistant.checkInData) {
      context += `Current State: ${assistant.checkInData.emotion}\n`;
    }
    context += `\n`;

    // Conversation history
    if (messageHistory && messageHistory.length > 0) {
      context += `CONVERSATION HISTORY:\n`;
      messageHistory.forEach(msg => {
        const name = msg.sender === creator.userId ? creatorName : assistantName;
        context += `${name}: ${msg.content}\n`;
      });
      context += `\n`;
    }

    // Assistant-specific guidance
    context += `RESPONSE GUIDELINES:\n`;
    context += `- Focus primarily on supporting ${creatorName}'s emotional processing\n`;
    context += `- Acknowledge ${assistantName}'s supportive presence when relevant\n`;
    context += `- Help ${assistantName} understand how to best support ${creatorName}\n`;
    context += `- Facilitate healthy communication between them\n`;
    context += `- ${assistantName} is observing to learn and support, not as a co-equal participant\n\n`;

    context += `You are now ready to respond to both participants with focus on ${creatorName}'s journey.\n`;

    return context;
  } catch (error) {
    console.error('Error assembling public assistant context:', error);
    throw error;
  }
};

/**
 * Get active participants from thread (exclude pending/invited)
 * @param {Object} thread - Thread data
 * @returns {Array} Array of active participants
 */
export const getActiveParticipants = (thread) => {
  if (!thread || !thread.participants) return [];

  return thread.participants.filter(p => p.status === 'active');
};

/**
 * Debug function to test context assembly
 */
export const debugMultiUserContext = async (thread, therapistSettings) => {
  const contextType = determineContextType(thread);
  const activeParticipants = getActiveParticipants(thread);

  console.log('=== MULTI-USER CONTEXT DEBUG ===');
  console.log('Context Type:', contextType);
  console.log('Active Participants:', activeParticipants.length);
  console.log('Session Type:', thread.sessionType);

  if (contextType === 'public_participant') {
    const context = await assemblePublicParticipantContext(activeParticipants, therapistSettings);
    console.log('Assembled Context:\n', context);
  } else if (contextType === 'public_assistant') {
    const creator = activeParticipants.find(p => p.role === 'creator');
    const assistant = activeParticipants.find(p => p.role === 'assistant');
    if (creator && assistant) {
      const context = await assemblePublicAssistantContext(creator, assistant, therapistSettings);
      console.log('Assembled Context:\n', context);
    }
  }

  console.log('=== END DEBUG ===');
};
