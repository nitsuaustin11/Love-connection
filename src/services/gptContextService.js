import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../Firebaseconfig';

let cachedGptContext = null;

/**
 * Fetches the generalized GPT context from Firebase
 * @returns {Object} The generalized GPT context configuration
 */
export const getGptContextData = async () => {
  try {
    if (cachedGptContext) {
      return cachedGptContext;
    }

    const docRef = doc(db, 'appData', 'gptContext');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      cachedGptContext = docSnap.data();
      return cachedGptContext;
    } else {
      console.error('GPT context data not found in Firebase');
      return null;
    }
  } catch (error) {
    console.error('Error fetching GPT context:', error);
    return null;
  }
};

/**
 * Generates a complete GPT prompt for the therapist based on user context and message type
 * @param {Object} user - User profile object
 * @param {Object} therapistSettings - Therapist's GPT settings
 * @param {string} messageType - Type of message ('check_in', 'general', 'crisis', 'progress_update')
 * @param {string} userMessage - The user's actual message
 * @returns {string} Complete GPT prompt string
 */
export const generateTherapistPrompt = async (user, therapistSettings, messageType = 'general', userMessage = '') => {
  try {
    const gptContext = await getGptContextData();
    if (!gptContext) {
      throw new Error('Could not load GPT context configuration');
    }

    // Build the complete prompt
    let prompt = '';

    // 1. System Instructions
    prompt += buildSystemInstructions(gptContext, therapistSettings);

    // 2. Personality Context
    prompt += buildPersonalityContext(user, gptContext);

    // 3. Emotional Context
    prompt += buildEmotionalContext(user, gptContext);

    // 4. Communication Preferences
    prompt += buildCommunicationPreferences(therapistSettings, gptContext);

    // 5. Response Formatting Instructions
    prompt += buildResponseFormatting(messageType, therapistSettings, gptContext);

    return prompt;
  } catch (error) {
    console.error('Error generating therapist prompt:', error);
    return null;
  }
};

/**
 * Builds system instructions section of the prompt
 */
const buildSystemInstructions = (gptContext, therapistSettings) => {
  const instructions = gptContext.systemInstructions;
  let prompt = `${instructions.primary.role}\n\n`;
  prompt += `Tone: ${instructions.primary.tone}\n`;
  prompt += `Approach: ${instructions.primary.approach}\n\n`;

  // Response guidelines
  prompt += `Response Guidelines:\n`;
  prompt += `- Length: ${instructions.responseGuidelines.length}\n`;
  prompt += `- Structure: ${instructions.responseGuidelines.structure}\n`;
  prompt += `- Language: ${instructions.responseGuidelines.language}\n`;
  prompt += `- Boundaries: ${instructions.responseGuidelines.boundaries}\n\n`;

  return prompt;
};

/**
 * Builds personality context section based on user's personality test results
 */
const buildPersonalityContext = (user, gptContext) => {
  let prompt = 'PERSONALITY CONTEXT:\n';

  const personalityContext = user?.gptMessageContext?.personalityContext;
  const templates = gptContext.personalityContextTemplates;

  // MBTI Context
  if (personalityContext?.mbti) {
    prompt += `${templates.mbti.instruction}\n`;
    prompt += `${personalityContext.mbti}\n\n`;
  }

  // Six Human Needs Context
  if (personalityContext?.sixHumanNeeds) {
    prompt += `${templates.sixHumanNeeds.instruction}\n`;
    prompt += `${personalityContext.sixHumanNeeds}\n\n`;
  }

  // Love Languages Context
  if (personalityContext?.loveLanguages) {
    prompt += `${templates.loveLanguages.instruction}\n`;
    prompt += `${personalityContext.loveLanguages}\n\n`;
  }

  return prompt;
};

/**
 * Builds emotional context section
 */
const buildEmotionalContext = (user, gptContext) => {
  let prompt = 'EMOTIONAL CONTEXT:\n';

  // Add general context explanation
  prompt += 'The user has provided responses about their current experience by filling out a survey of questions. The user has provided comprehensive information about their immediate experience. This is the information which we are as therapist aiming to provide productive value as an AI Therapist. Use the provided context about their personality, and as a professional therapist to give a response directed at their current experience/emotion. The emotion and the response fields are of the most important as far as immediate feedback for the user.\n\n';

  const emotionalContext = user?.gptMessageContext?.currentEmotionalContext;

  if (emotionalContext?.primaryEmotion) {
    prompt += `Current Emotion: ${emotionalContext.primaryEmotion}\n`;
  }

  if (emotionalContext?.checkInContext) {
    prompt += `${emotionalContext.checkInContext}\n`;
  }

  if (emotionalContext?.desiredEmotion) {
    prompt += `Desired Emotion: ${emotionalContext.desiredEmotion}\n`;
  }

  prompt += '\n';
  return prompt;
};

/**
 * Builds communication preferences section
 */
const buildCommunicationPreferences = (therapistSettings, gptContext) => {
  let prompt = 'COMMUNICATION PREFERENCES:\n';

  const commPrefs = gptContext.communicationPreferences;
  const responseStyle = commPrefs.responseStyles[therapistSettings.responseStyle];

  if (responseStyle) {
    prompt += `Response Style: ${responseStyle.description}\n`;
    prompt += `Instruction: ${responseStyle.instruction}\n`;
  }

  prompt += `Actionable Advice: ${therapistSettings.wantsActionableAdvice ? 'Include specific actionable steps' : 'Focus more on understanding and validation'}\n`;
  prompt += `Vulnerability Level: ${therapistSettings.openToVulnerability ? 'Encourage deeper emotional exploration' : 'Respect boundaries and work at surface level'}\n\n`;

  return prompt;
};

/**
 * Builds response formatting instructions based on message type
 */
const buildResponseFormatting = (messageType, therapistSettings, gptContext) => {
  let prompt = 'RESPONSE FORMATTING:\n';

  const formatting = gptContext.response_formatting;

  switch (messageType) {
    case 'check_in':
      const checkInFormat = formatting.check_in_formatting;
      prompt += 'Format for Check-in Response:\n';
      prompt += `1. Summary (${checkInFormat.structure.summary.word_count}): ${checkInFormat.structure.summary.instruction}\n`;

      if (therapistSettings.checkInFormatting?.includePersonalityAnalysis) {
        prompt += `2. Personality Analysis (${therapistSettings.personalityAnalysisLevel}): ${checkInFormat.structure.personality_analysis.instruction}\n`;
      }

      if (therapistSettings.checkInFormatting?.includeFeedback) {
        prompt += `3. Feedback & Guidance: ${checkInFormat.structure.feedback_and_guidance.components.reflection_questions}\n`;
        prompt += `   - ${checkInFormat.structure.feedback_and_guidance.components.actionable_advice}\n`;
      }
      break;

    case 'crisis':
      const crisisFormat = formatting.crisis_support_formatting;
      prompt += `Crisis Support Priority Order: ${crisisFormat.priority_order.join(' → ')}\n`;
      prompt += `${crisisFormat.personality_considerations}\n`;
      break;

    default:
      const generalFormat = formatting.general_message_formatting;
      prompt += `General Message Structure: ${Object.values(generalFormat.structure).join(' → ')}\n`;
  }

  prompt += '\n';
  return prompt;
};

/**
 * Builds wellness goal alignment section
 */
const buildWellnessGoalContext = (user, gptContext) => {
  let prompt = 'WELLNESS GOAL ALIGNMENT:\n';

  const wellnessGoal = user?.gptMessageContext?.currentEmotionalContext?.wellnessGoal;
  const goalTypes = gptContext.wellnessGoalAlignment.goalTypes;

  if (wellnessGoal && goalTypes[wellnessGoal]) {
    prompt += `Primary Goal: ${wellnessGoal}\n`;
    prompt += `Focus: ${goalTypes[wellnessGoal]}\n`;
    prompt += `${gptContext.wellnessGoalAlignment.instruction.replace('{wellness_goal}', wellnessGoal)}\n`;
  }

  prompt += '\n';
  return prompt;
};

/**
 * Builds safeguards section
 */
const buildSafeguards = (gptContext) => {
  let prompt = 'IMPORTANT SAFEGUARDS:\n';

  const safeguards = gptContext.safeguards;
  prompt += `Crisis Indicators: ${safeguards.crisis_indicators.join(', ')}\n`;
  prompt += `Crisis Response: ${safeguards.crisis_response}\n`;
  prompt += 'Boundary Reminders:\n';
  safeguards.boundary_reminders.forEach(reminder => {
    prompt += `- ${reminder}\n`;
  });

  prompt += '\n';
  return prompt;
};

/**
 * Builds user message context section
 */
const buildUserMessageContext = (messageType, userMessage, user) => {
  let prompt = 'USER MESSAGE:\n';

  switch (messageType) {
    case 'check_in':
      prompt += 'This is an emotional check-in. The user is sharing their current emotional state and experiences.\n';
      break;
    case 'crisis':
      prompt += 'This appears to be a crisis situation. Prioritize safety and emotional support.\n';
      break;
    default:
      prompt += 'This is a general conversation message.\n';
  }

  if (userMessage) {
    prompt += `Message: "${userMessage}"\n`;
  }

  prompt += '\nPlease respond according to all the above guidelines, personality context, and formatting instructions.\n';

  return prompt;
};

/**
 * Quick function to get a simplified therapist context for debugging
 */
export const getTherapistDebugInfo = async (user, therapistId = 'general_therapist') => {
  const therapist = user?.contacts?.find(contact => contact.id === therapistId);

  if (!therapist || !therapist.gptSettings) {
    return 'Therapist not found or missing GPT settings';
  }

  return {
    therapistName: therapist.name,
    settings: therapist.gptSettings,
    personalityContextAvailable: {
      mbti: !!user?.gptMessageContext?.personalityContext?.mbti,
      sixHumanNeeds: !!user?.gptMessageContext?.personalityContext?.sixHumanNeeds,
      loveLanguages: !!user?.gptMessageContext?.personalityContext?.loveLanguages
    },
    emotionalContext: user?.gptMessageContext?.currentEmotionalContext,
    lastUpdated: user?.gptMessageContext?.lastUpdated
  };
};

/**
 * Comprehensive therapist data verification for debugging
 */
export const verifyTherapistData = (user) => {
  console.log('🔍 THERAPIST VERIFICATION: Starting comprehensive check...');

  // Check if user has contacts
  const contacts = user?.contacts;
  console.log('User contacts array:', contacts?.length ? `${contacts.length} contacts found` : 'No contacts array');

  if (contacts && contacts.length > 0) {
    console.log('All user contacts:');
    contacts.forEach((contact, index) => {
      console.log(`  ${index + 1}. ID: ${contact.id}, Name: ${contact.name}, Type: ${contact.type}`);
      if (contact.gptSettings) {
        console.log(`     GPT Settings: ✅ Present (${Object.keys(contact.gptSettings).length} properties)`);
      } else {
        console.log('     GPT Settings: ❌ Missing');
      }
    });
  }

  // Specifically check for General Therapist
  const generalTherapist = contacts?.find(contact => contact.id === 'general_therapist');

  if (generalTherapist) {
    console.log('✅ GENERAL THERAPIST FOUND:');
    console.log('   Name:', generalTherapist.name);
    console.log('   Type:', generalTherapist.type);
    console.log('   Active:', generalTherapist.isActive);
    console.log('   Added At:', generalTherapist.addedAt);

    if (generalTherapist.gptSettings) {
      console.log('   GPT Settings:');
      Object.entries(generalTherapist.gptSettings).forEach(([key, value]) => {
        console.log(`     ${key}:`, typeof value === 'object' ? JSON.stringify(value) : value);
      });
    } else {
      console.log('   ❌ Missing GPT Settings');
    }
  } else {
    console.log('❌ GENERAL THERAPIST NOT FOUND');
    console.log('Available contact IDs:', contacts?.map(c => c.id) || []);
  }

  // Check Firebase sync status
  const profileLastUpdated = user?.accountStatus?.lastActiveAt;
  console.log('Profile last updated:', profileLastUpdated);

  return {
    hasContacts: !!contacts?.length,
    contactCount: contacts?.length || 0,
    hasGeneralTherapist: !!generalTherapist,
    hasGptSettings: !!generalTherapist?.gptSettings,
    allContactIds: contacts?.map(c => c.id) || [],
    generalTherapistData: generalTherapist || null
  };
};