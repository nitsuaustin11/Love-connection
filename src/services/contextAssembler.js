/**
 * CONTEXT ASSEMBLER SERVICE
 *
 * This service assembles complete GPT prompts by combining:
 * 1. General context files from Firebase (instructions)
 * 2. User-specific data (personality, emotions, history)
 * 3. User therapist settings (preferences)
 *
 * Routes to appropriate assembler based on session type:
 * - Private sessions: Single user context
 * - Public sessions: Multi-user context (participant or assistant mode)
 *
 * The result is a complete prompt ready to send to an LLM
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../Firebaseconfig';
import {
  determineContextType,
  assemblePublicParticipantContext,
  assemblePublicAssistantContext,
  getActiveParticipants
} from './multiUserContextAssembler';

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

  // Check if user wants personality analysis
  const useAnalysis = therapistSettings.usePersonalityAnalysis !== false;
  if (!useAnalysis) {
    return `PERSONALITY CONTEXT:\nNote: Personality analysis is disabled for this therapist. Focus on general emotional support.\n\n`;
  }

  let section = `PERSONALITY CONTEXT:\n`;
  section += `${personalityInstructions.personalityContextOverview}\n\n`;

  // Add analysis level instruction
  const analysisLevel = therapistSettings.personalityAnalysisLevel || 'moderate';
  if (analysisLevel !== 'none') {
    section += `PERSONALITY ANALYSIS DEPTH: ${personalityInstructions.personalityAnalysisLevels[analysisLevel]}\n\n`;
  }

  // Add each personality type based on settings
  const types = personalityInstructions.personalityTypes;

  // MBTI (if enabled)
  const includeMBTI = therapistSettings.includeMBTI !== false;
  if (includeMBTI) {
    section += `--- MBTI (${types.mbti.name}) ---\n`;
    section += `${types.mbti.howToUse}\n`;
    section += `${types.mbti.adaptationNotes}\n`;
    const mbtiContext = user?.gptMessageContext?.personalityContext?.mbti;
    if (mbtiContext) {
      section += `\nUser's MBTI Context:\n${mbtiContext}\n\n`;
    } else {
      section += `\nUser has not completed MBTI test.\n\n`;
    }
  }

  // Six Human Needs (if enabled)
  const includeSixNeeds = therapistSettings.includeSixNeeds !== false;
  if (includeSixNeeds) {
    section += `--- SIX HUMAN NEEDS (${types.sixHumanNeeds.name}) ---\n`;
    section += `${types.sixHumanNeeds.howToUse}\n`;
    section += `${types.sixHumanNeeds.adaptationNotes}\n`;
    const needsContext = user?.gptMessageContext?.personalityContext?.sixHumanNeeds;
    if (needsContext) {
      section += `\nUser's Six Human Needs Context:\n${needsContext}\n\n`;
    } else {
      section += `\nUser has not completed Six Human Needs test.\n\n`;
    }
  }

  // Love Languages (if enabled)
  const includeLoveLanguages = therapistSettings.includeLoveLanguages !== false;
  if (includeLoveLanguages) {
    section += `--- LOVE LANGUAGES (${types.loveLanguages.name}) ---\n`;
    section += `${types.loveLanguages.howToUse}\n`;
    section += `${types.loveLanguages.adaptationNotes}\n`;
    const loveContext = user?.gptMessageContext?.personalityContext?.loveLanguages;
    if (loveContext) {
      section += `\nUser's Love Languages Context:\n${loveContext}\n\n`;
    } else {
      section += `\nUser has not completed Love Languages test.\n\n`;
    }
  }

  // Add integration guidelines
  section += `PERSONALITY INTEGRATION:\n`;
  section += `${personalityInstructions.personalityIntegrationGuidelines}\n\n`;

  // Only add crisis handling if enabled
  const emphasizeInCrisis = therapistSettings.emphasizeInCrisis === true;
  if (!emphasizeInCrisis) {
    section += `${personalityInstructions.whenToEmphasizePersonality}\n\n`;
  }

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

  // Add intensity consideration based on settings
  const intensityMode = therapistSettings.intensityResponseMode || 'adaptive';
  if (intensityMode === 'adaptive') {
    section += `${emotionInstructions.intensityConsideration}\n`;
  } else if (intensityMode === 'always_supportive') {
    section += `Always prioritize emotional support regardless of intensity level.\n`;
  } else if (intensityMode === 'always_analytical') {
    section += `Provide analytical exploration regardless of intensity level.\n`;
  }
  section += `${emotionInstructions.timeframeRelevance}\n\n`;

  // Add solution type preference
  const solutionType = therapistSettings.solutionType || 'balanced';
  const solutionGuidance = emotionInstructions.solutionTypeGuidance[solutionType];
  if (solutionGuidance) {
    section += `SOLUTION APPROACH: ${solutionGuidance}\n\n`;
  }

  // Add pattern analysis if enabled
  const patternAnalysis = therapistSettings.patternAnalysisEnabled !== false;
  if (patternAnalysis) {
    section += `${emotionInstructions.emotionalPatternAnalysis}\n\n`;
  }

  // Add crisis detection note if enabled
  const crisisDetection = therapistSettings.crisisDetection !== false;
  if (crisisDetection) {
    section += `Note: Monitor for crisis situations and respond with appropriate urgency and professional referrals.\n\n`;
  }

  return section;
};

/**
 * Build message history section
 */
const buildMessageHistorySection = (contexts, messages, conversationSummary, therapistSettings) => {
  const { messageHistoryInstructions } = contexts;
  if (!messageHistoryInstructions) return '';

  let section = `CONVERSATION HISTORY:\n`;
  section += `${messageHistoryInstructions.messageHistoryPurpose}\n\n`;

  // Add how to use history based on settings
  const referencePrevious = therapistSettings.referencePreviousMessages !== false;
  if (referencePrevious) {
    section += `HOW TO USE HISTORY:\n`;
    Object.entries(messageHistoryInstructions.howToUseHistory).forEach(([key, value]) => {
      section += `- ${value}\n`;
    });
    section += `\n`;
  }

  // Add conversation summary if available and enabled
  const summaryUsage = therapistSettings.summaryUsage || 'moderate';
  if (conversationSummary && summaryUsage !== 'minimal') {
    section += `CONVERSATION SUMMARY:\n${conversationSummary}\n\n`;
    if (summaryUsage === 'extensive') {
      section += `${messageHistoryInstructions.summaryGuidance}\n\n`;
    }
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

  // Add progress tracking note if enabled
  const trackProgress = therapistSettings.trackProgress !== false;
  if (trackProgress && messages?.length > 0) {
    section += `Remember to notice and acknowledge any progress or growth the user has shown.\n\n`;
  }

  // Add strategy follow-up note if enabled
  const followUpStrategies = therapistSettings.followUpOnStrategies !== false;
  if (followUpStrategies && messages?.length > 0) {
    section += `If you previously suggested coping strategies, check in on how they worked.\n\n`;
  }

  // Add memory recall note if enabled
  const rememberDetails = therapistSettings.rememberKeyDetails !== false;
  if (rememberDetails) {
    section += `${messageHistoryInstructions.memoryAndRecall}\n\n`;
  }

  return section;
};

/**
 * Build response format section
 */
const buildResponseFormatSection = (contexts, messageType, therapistSettings) => {
  const { responseFormats } = contexts;
  if (!responseFormats) return '';

  let section = `RESPONSE FORMAT:\n`;

  // Use default format from settings if available
  const defaultFormat = therapistSettings.defaultResponseFormat || messageType;
  const formatKey = defaultFormat + 'ResponseFormat';
  const format = responseFormats[formatKey] || responseFormats.generalMessageFormat;

  if (format) {
    section += `Use ${format.name}:\n`;
    section += `${format.when}\n\n`;

    // Check if structured sections are enabled
    const useStructured = therapistSettings.useStructuredSections !== false;

    if (useStructured && format.structure) {
      section += `STRUCTURE:\n`;

      // Add structure details based on enabled settings
      Object.entries(format.structure).forEach(([key, value]) => {
        // Check specific section settings for checkIn format
        if (key === '1_summary' && therapistSettings.includeSummary === false) {
          return; // Skip summary section
        }
        if (key === '2_personalityAnalysis' && therapistSettings.includePersonalityAnalysis === false) {
          return; // Skip personality section
        }

        if (typeof value === 'string') {
          section += `${key}: ${value}\n`;
        } else if (typeof value === 'object') {
          section += `${key}:\n`;
          if (value.instruction) section += `  ${value.instruction}\n`;
          if (value.components) {
            Object.entries(value.components).forEach(([compKey, compValue]) => {
              // Check if reflection questions are enabled
              if (compKey === 'reflectionQuestions' && therapistSettings.includeReflectionQuestions === false) {
                return;
              }
              // Check if actionable advice is enabled
              if (compKey === 'actionableAdvice' && therapistSettings.includeActionableAdvice === false) {
                return;
              }
              section += `  - ${compValue}\n`;
            });
          }
        }
      });
      section += `\n`;
    } else {
      section += `Use a natural, conversational format without strict structure.\n\n`;
    }
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
 * @param {Object} thread - Thread data (optional, for multi-user sessions)
 * @returns {string} Complete assembled prompt
 */
export const assembleCompletePrompt = async (
  user,
  recentMessages = [],
  conversationSummary = null,
  messageType = 'general',
  thread = null
) => {
  try {
    // Determine context type based on thread
    const contextType = thread ? determineContextType(thread) : 'private';

    console.log('=== CONTEXT ASSEMBLY ===');
    console.log('Context Type:', contextType);
    console.log('Session Type:', thread?.sessionType || 'private');

    // Get therapist settings
    const therapist = user?.contacts?.find(c => c.id === 'general_therapist' || c.type === 'ai_therapist');
    const therapistSettings = therapist?.gptSettings || {};

    // Route to appropriate assembler based on context type
    if (contextType === 'public_participant') {
      // Multi-participant session
      const activeParticipants = getActiveParticipants(thread);
      console.log('Active Participants:', activeParticipants.length);

      const prompt = await assemblePublicParticipantContext(
        activeParticipants,
        therapistSettings,
        recentMessages
      );

      console.log('=== PUBLIC PARTICIPANT CONTEXT ASSEMBLED ===');
      return prompt;

    } else if (contextType === 'public_assistant') {
      // Assistant/Observer session
      const activeParticipants = getActiveParticipants(thread);
      const creator = activeParticipants.find(p => p.role === 'creator');
      const assistant = activeParticipants.find(p => p.role === 'assistant');

      if (!creator || !assistant) {
        console.warn('Missing creator or assistant, falling back to private context');
        // Fall through to private context
      } else {
        console.log('Creator & Assistant found');

        const prompt = await assemblePublicAssistantContext(
          creator,
          assistant,
          therapistSettings,
          recentMessages
        );

        console.log('=== PUBLIC ASSISTANT CONTEXT ASSEMBLED ===');
        return prompt;
      }
    }

    // Private session (default) - use existing logic
    console.log('=== ASSEMBLING PRIVATE CONTEXT ===');

    // Load all contexts from Firebase
    const contexts = await loadAllContexts();

    // Build each section
    const generalSystemSection = buildGeneralSystemSection(contexts, therapistSettings);
    const personalitySection = buildPersonalitySection(contexts, user, therapistSettings);
    const emotionalSection = buildEmotionalSection(contexts, user, therapistSettings);
    const messageHistorySection = buildMessageHistorySection(contexts, recentMessages, conversationSummary, therapistSettings);
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

    console.log('=== PRIVATE CONTEXT ASSEMBLED ===');
    return finalPrompt;

  } catch (error) {
    console.error('Error assembling prompt:', error);
    throw error;
  }
};

/**
 * SUMMARY ASSEMBLER
 *
 * Creates a concise summary of the user's check-in experience
 * Uses LLM to generate a < 150 word summary that includes:
 * - User's emotional state
 * - Check-in context
 * - Relevant personality insights
 * - Neat formatting for display in message threads
 *
 * @param {string} emotion - Selected emotion from check-in
 * @param {string} checkInContext - Generated context from check-in responses
 * @param {Object} personalityContext - User's personality data
 * @param {Object} user - Full user object
 * @returns {Promise<string>} Summary message (under 150 words)
 */
export const summaryAssembler = async (emotion, checkInContext, personalityContext, user) => {
  try {
    console.log('=== SUMMARY ASSEMBLER CALLED ===');
    console.log('Emotion:', emotion);
    console.log('Check-in Context:', checkInContext?.substring(0, 100) + '...');
    console.log('Has Personality Context:', !!personalityContext);

    // For now, return placeholder message
    // TODO: Implement full LLM integration with:
    // 1. Load general GPT contexts for summary instructions
    // 2. Build summary-specific prompt including:
    //    - Emotion and check-in context
    //    - Personality context (MBTI, Six Needs, Love Languages)
    //    - Instructions to create < 150 word summary
    //    - Instructions to format neatly for display
    // 3. Call LLM API
    // 4. Return formatted summary

    const placeholder = "This message was made by the create summary assembler";

    console.log('=== SUMMARY ASSEMBLER COMPLETE (PLACEHOLDER) ===');
    return placeholder;

  } catch (error) {
    console.error('Error in summaryAssembler:', error);
    // Return fallback summary if assembler fails
    return `I'm experiencing ${emotion}. ${checkInContext}`;
  }
};

/**
 * Debug function to see what the assembled prompt looks like
 */
export const debugAssembledPrompt = async (user, thread = null) => {
  const prompt = await assembleCompletePrompt(
    user,
    [],
    null,
    'general',
    thread
  );

  console.log('=== ASSEMBLED PROMPT DEBUG ===');
  console.log(prompt);
  console.log('=== END PROMPT ===');
  console.log(`\nTotal length: ${prompt.length} characters`);

  return prompt;
};
