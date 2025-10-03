/**
 * CONTEXT ASSEMBLER SERVICE
 *
 * This service assembles complete GPT prompts by combining:
 * 1. General context files from Firebase (instructions)
 * 2. User-specific data (personality, emotions, history)
 * 3. User therapist settings (preferences)
 *
 * The result is a complete prompt ready to send to an LLM
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../Firebaseconfig';

// Cache for context files (avoid fetching every time)
let contextCache = {
  generalSystem: null,
  personalityInstructions: null,
  emotionInstructions: null,
  messageHistoryInstructions: null,
  responseFormats: null,
  lastFetched: null,
  cacheExpiryMinutes: 15
};

/**
 * Fetch a context file from Firebase with caching
 */
const fetchContext = async (contextName) => {
  try {
    const docRef = doc(db, 'gptContexts', contextName);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.error(`Context file not found: ${contextName}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching context ${contextName}:`, error);
    return null;
  }
};

/**
 * Load all context files from Firebase (with caching)
 */
export const loadAllContexts = async (forceRefresh = false) => {
  // Check if cache is valid
  const now = new Date();
  const cacheAge = contextCache.lastFetched
    ? (now - contextCache.lastFetched) / 1000 / 60
    : Infinity;

  if (!forceRefresh && cacheAge < contextCache.cacheExpiryMinutes && contextCache.generalSystem) {
    console.log('Using cached contexts');
    return contextCache;
  }

  console.log('Fetching contexts from Firebase...');

  // Fetch all context files
  const [
    generalSystem,
    personalityInstructions,
    emotionInstructions,
    messageHistoryInstructions,
    responseFormats
  ] = await Promise.all([
    fetchContext('1-general-system'),
    fetchContext('2-personality-instructions'),
    fetchContext('3-emotion-instructions'),
    fetchContext('4-message-history-instructions'),
    fetchContext('5-response-formats')
  ]);

  // Update cache
  contextCache = {
    generalSystem,
    personalityInstructions,
    emotionInstructions,
    messageHistoryInstructions,
    responseFormats,
    lastFetched: now,
    cacheExpiryMinutes: 15
  };

  return contextCache;
};

/**
 * Clear the context cache (useful for testing or forcing refresh)
 */
export const clearContextCache = () => {
  contextCache = {
    generalSystem: null,
    personalityInstructions: null,
    emotionInstructions: null,
    messageHistoryInstructions: null,
    responseFormats: null,
    lastFetched: null,
    cacheExpiryMinutes: 15
  };
};

/**
 * Build general system instructions section
 */
const buildGeneralSystemSection = (contexts, therapistSettings) => {
  const { generalSystem } = contexts;
  if (!generalSystem) return '';

  let section = `${generalSystem.systemRole}\n\n`;
  section += `TONE: ${generalSystem.tone.primary}\n`;
  section += `${generalSystem.tone.secondary}\n\n`;

  section += `GENERAL RULES:\n`;
  section += `- Response Length: ${generalSystem.generalRules.responseLength}\n`;
  section += `- Structure: ${generalSystem.generalRules.responseStructure}\n`;
  section += `- Language: ${generalSystem.generalRules.language}\n`;
  section += `- Boundaries: ${generalSystem.generalRules.boundaries}\n\n`;

  // Add user's selected communication style
  const styleKey = therapistSettings.responseStyle || 'analytical_yet_empathetic';
  const style = generalSystem.communicationStyles[styleKey];
  if (style) {
    section += `COMMUNICATION STYLE: ${style.description}\n`;
    section += `${style.instruction}\n\n`;
  }

  // Add advice preferences
  const wantsAdvice = therapistSettings.wantsActionableAdvice ? 'true' : 'false';
  section += `ADVICE APPROACH: ${generalSystem.advicePreferences[`wantsActionableAdvice_${wantsAdvice}`]}\n\n`;

  const openToVulnerability = therapistSettings.openToVulnerability ? 'true' : 'false';
  section += `VULNERABILITY LEVEL: ${generalSystem.advicePreferences[`openToVulnerability_${openToVulnerability}`]}\n\n`;

  // Add conversation depth
  const depth = therapistSettings.conversationDepth || 'moderate';
  section += `CONVERSATION DEPTH: ${generalSystem.conversationDepth[depth]}\n\n`;

  // Add response length guidance
  const lengthPref = therapistSettings.responseLength || 'standard';
  section += `RESPONSE LENGTH: ${generalSystem.responseLengthGuidance[lengthPref]}\n\n`;

  // Add emotional validation level
  const validationLevel = therapistSettings.emotionalValidationLevel || 'balanced';
  section += `EMOTIONAL VALIDATION: ${generalSystem.emotionalValidationLevel[validationLevel]}\n\n`;

  return section;
};

/**
 * Build personality context section
 */
const buildPersonalitySection = (contexts, user, therapistSettings) => {
  const { personalityInstructions } = contexts;
  if (!personalityInstructions) return '';

  let section = `PERSONALITY CONTEXT:\n`;
  section += `${personalityInstructions.personalityContextOverview}\n\n`;

  // Check if user wants personality analysis
  const personalitySettings = therapistSettings.personalitySettings || {};
  if (personalitySettings.usePersonalityAnalysis === false) {
    section += `Note: User has disabled personality analysis. Focus on general emotional support.\n\n`;
    return section;
  }

  // Add analysis level instruction
  const analysisLevel = personalitySettings.personalityDepth || 'moderate';
  section += `PERSONALITY ANALYSIS DEPTH: ${personalityInstructions.personalityAnalysisLevels[analysisLevel]}\n\n`;

  // Add each personality type
  const types = personalityInstructions.personalityTypes;

  // MBTI
  section += `--- MBTI (${types.mbti.name}) ---\n`;
  section += `${types.mbti.howToUse}\n`;
  section += `${types.mbti.adaptationNotes}\n`;
  const mbtiContext = user?.gptMessageContext?.personalityContext?.mbti;
  if (mbtiContext) {
    section += `\nUser's MBTI Context:\n${mbtiContext}\n\n`;
  } else {
    section += `\nUser has not completed MBTI test.\n\n`;
  }

  // Six Human Needs
  section += `--- SIX HUMAN NEEDS (${types.sixHumanNeeds.name}) ---\n`;
  section += `${types.sixHumanNeeds.howToUse}\n`;
  section += `${types.sixHumanNeeds.adaptationNotes}\n`;
  const needsContext = user?.gptMessageContext?.personalityContext?.sixHumanNeeds;
  if (needsContext) {
    section += `\nUser's Six Human Needs Context:\n${needsContext}\n\n`;
  } else {
    section += `\nUser has not completed Six Human Needs test.\n\n`;
  }

  // Love Languages
  section += `--- LOVE LANGUAGES (${types.loveLanguages.name}) ---\n`;
  section += `${types.loveLanguages.howToUse}\n`;
  section += `${types.loveLanguages.adaptationNotes}\n`;
  const loveContext = user?.gptMessageContext?.personalityContext?.loveLanguages;
  if (loveContext) {
    section += `\nUser's Love Languages Context:\n${loveContext}\n\n`;
  } else {
    section += `\nUser has not completed Love Languages test.\n\n`;
  }

  // Add integration guidelines
  section += `PERSONALITY INTEGRATION:\n`;
  section += `${personalityInstructions.personalityIntegrationGuidelines}\n\n`;
  section += `${personalityInstructions.whenToEmphasizePersonality}\n\n`;

  return section;
};

/**
 * Build current emotional state section
 */
const buildEmotionalSection = (contexts, user, therapistSettings) => {
  const { emotionInstructions } = contexts;
  if (!emotionInstructions) return '';

  let section = `CURRENT EMOTIONAL STATE:\n`;
  section += `${emotionInstructions.emotionPriority}\n`;
  section += `${emotionInstructions.emotionContextExplanation}\n\n`;

  // Get current emotional context
  const emotionalContext = user?.gptMessageContext?.currentEmotionalContext;
  const primaryEmotion = emotionalContext?.primaryEmotion;

  if (primaryEmotion) {
    section += `PRIMARY EMOTION: ${primaryEmotion}\n`;

    // Add emotion-specific guidance
    const emotionGuidance = emotionInstructions.emotionResponseApproaches[primaryEmotion];
    if (emotionGuidance) {
      section += `RESPONSE APPROACH: ${emotionGuidance}\n\n`;
    }
  }

  // Add check-in context if available
  const checkInContext = emotionalContext?.checkInContext;
  if (checkInContext) {
    section += `CHECK-IN CONTEXT:\n${checkInContext}\n\n`;
  }

  // Add intensity consideration
  section += `${emotionInstructions.intensityConsideration}\n`;
  section += `${emotionInstructions.timeframeRelevance}\n\n`;

  // Add solution type preference
  const solutionType = therapistSettings.solutionType || 'balanced';
  const solutionGuidance = emotionInstructions.solutionTypeGuidance[solutionType];
  if (solutionGuidance) {
    section += `SOLUTION APPROACH: ${solutionGuidance}\n\n`;
  }

  // Add pattern analysis
  section += `${emotionInstructions.emotionalPatternAnalysis}\n\n`;

  return section;
};

/**
 * Build message history section
 */
const buildMessageHistorySection = (contexts, messages, conversationSummary) => {
  const { messageHistoryInstructions } = contexts;
  if (!messageHistoryInstructions) return '';

  let section = `CONVERSATION HISTORY:\n`;
  section += `${messageHistoryInstructions.messageHistoryPurpose}\n\n`;

  // Add how to use history
  section += `HOW TO USE HISTORY:\n`;
  Object.entries(messageHistoryInstructions.howToUseHistory).forEach(([key, value]) => {
    section += `- ${value}\n`;
  });
  section += `\n`;

  // Add conversation summary if available
  if (conversationSummary) {
    section += `CONVERSATION SUMMARY:\n${conversationSummary}\n\n`;
  }

  // Add recent messages
  if (messages && messages.length > 0) {
    section += `RECENT MESSAGES:\n`;
    messages.forEach(msg => {
      section += `${msg.sender}: ${msg.content}\n`;
    });
    section += `\n`;
  } else {
    section += `This is the beginning of the conversation.\n\n`;
  }

  // Add contextual continuity rules
  const continuityContext = messages?.length === 0 ? 'firstMessage' : 'ongoingConversation';
  section += `${messageHistoryInstructions.contextualContinuityRules[continuityContext]}\n\n`;

  return section;
};

/**
 * Build response format section
 */
const buildResponseFormatSection = (contexts, messageType, therapistSettings) => {
  const { responseFormats } = contexts;
  if (!responseFormats) return '';

  let section = `RESPONSE FORMAT:\n`;

  // Get the appropriate format for message type
  const formatKey = messageType + 'ResponseFormat';
  const format = responseFormats[formatKey];

  if (!format) {
    // Default to general format
    const generalFormat = responseFormats.generalMessageFormat;
    section += `Use ${generalFormat.name}:\n`;
    section += `${generalFormat.when}\n\n`;
    Object.entries(generalFormat.structure).forEach(([key, value]) => {
      section += `${key}: ${value}\n`;
    });
    section += `\n`;
  } else {
    section += `Use ${format.name}:\n`;
    section += `${format.when}\n\n`;

    // Add structure details
    if (format.structure) {
      Object.entries(format.structure).forEach(([key, value]) => {
        if (typeof value === 'string') {
          section += `${key}: ${value}\n`;
        } else if (typeof value === 'object') {
          section += `${key}:\n`;
          if (value.instruction) section += `  ${value.instruction}\n`;
          if (value.components) {
            Object.entries(value.components).forEach(([compKey, compValue]) => {
              section += `  - ${compValue}\n`;
            });
          }
        }
      });
    }
    section += `\n`;
  }

  // Add length guidance
  const lengthPref = therapistSettings.responseLength || 'standard';
  section += `LENGTH GUIDANCE: ${responseFormats.lengthGuidance[lengthPref]}\n\n`;

  return section;
};

/**
 * MAIN FUNCTION: Assemble complete prompt
 *
 * @param {Object} user - User object with profile and context data
 * @param {Array} recentMessages - Recent message history
 * @param {string} conversationSummary - LLM-generated summary (optional)
 * @param {string} messageType - Type of message: 'checkIn', 'general', 'firstContact', etc.
 * @returns {string} Complete assembled prompt
 */
export const assembleCompletePrompt = async (
  user,
  recentMessages = [],
  conversationSummary = null,
  messageType = 'general'
) => {
  try {
    // Load all contexts from Firebase
    const contexts = await loadAllContexts();

    // Get therapist settings
    const therapist = user?.contacts?.find(c => c.id === 'general_therapist');
    const therapistSettings = therapist?.gptSettings || {};

    // Build each section
    const generalSystemSection = buildGeneralSystemSection(contexts, therapistSettings);
    const personalitySection = buildPersonalitySection(contexts, user, therapistSettings);
    const emotionalSection = buildEmotionalSection(contexts, user, therapistSettings);
    const messageHistorySection = buildMessageHistorySection(contexts, recentMessages, conversationSummary);
    const responseFormatSection = buildResponseFormatSection(contexts, messageType, therapistSettings);

    // Assemble final prompt
    const finalPrompt = `
${generalSystemSection}
${personalitySection}
${emotionalSection}
${messageHistorySection}
${responseFormatSection}

You are now ready to respond. Use all the context above to provide a thoughtful, personalized response.
`.trim();

    return finalPrompt;

  } catch (error) {
    console.error('Error assembling prompt:', error);
    throw error;
  }
};

/**
 * Debug function to see what the assembled prompt looks like
 */
export const debugAssembledPrompt = async (user) => {
  const prompt = await assembleCompletePrompt(
    user,
    [],
    null,
    'general'
  );

  console.log('=== ASSEMBLED PROMPT DEBUG ===');
  console.log(prompt);
  console.log('=== END PROMPT ===');
  console.log(`\nTotal length: ${prompt.length} characters`);

  return prompt;
};
