import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../Firebaseconfig';

let cachedCheckInFields = null;

/**
 * Fetches check-in fields configuration from Firebase
 * @returns {Object} The check-in fields configuration
 */
export const getCheckInFields = async () => {
  try {
    if (cachedCheckInFields) {
      return cachedCheckInFields;
    }

    const docRef = doc(db, 'appData', 'checkInFields');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      cachedCheckInFields = docSnap.data();
      return cachedCheckInFields;
    } else {
      console.error('Check-in fields data not found in Firebase');
      return null;
    }
  } catch (error) {
    console.error('Error fetching check-in fields:', error);
    return null;
  }
};

/**
 * Gets fields for a specific mode (basic or advanced)
 * @param {string} mode - "basic" or "advanced"
 * @returns {Object} Fields for the specified mode
 */
export const getFieldsForMode = async (mode = 'basic') => {
  try {
    const checkInFields = await getCheckInFields();
    if (!checkInFields || !checkInFields.checkInFields) {
      return {};
    }

    const basicFields = checkInFields.checkInFields.basic || {};

    if (mode === 'basic') {
      return { basic: basicFields };
    } else if (mode === 'advanced') {
      const advancedFields = checkInFields.checkInFields.advanced || {};
      return {
        basic: basicFields,
        advanced: advancedFields
      };
    }

    return {};
  } catch (error) {
    console.error('Error getting fields for mode:', error);
    return {};
  }
};

/**
 * Generates GPT context from check-in responses in the preferred format
 * @param {Object} responses - User responses to check-in fields
 * @param {string} emotion - Selected emotion
 * @returns {string} Generated GPT context
 */
export const generateCheckInContext = async (responses, emotion) => {
  try {
    // Extract key responses
    const whatHappened = responses.whatHappened || '';
    const intensity = responses.intensity || '';
    const when = responses.when || '';
    const effects = responses.effects || [];

    // Build the context in the specified format
    let context = `The emotion and experience I'm having right now is ${emotion}.`;

    if (whatHappened) {
      context += ` Here is what happened from my perspective: ${whatHappened}.`;
    }

    if (intensity) {
      context += ` On a scale from 1-10, the intensity of this emotion is ${intensity} out of 10.`;
    }

    if (when) {
      context += ` I've been feeling this for about ${when}.`;
    }

    if (Array.isArray(effects) && effects.length > 0) {
      context += ` This has been affecting me in the following ways: ${effects.join(', ')}.`;
    }

    // Add advanced fields if present
    const advancedParts = [];

    if (responses.externalFactors) {
      advancedParts.push(`External factors contributing to this include: ${responses.externalFactors}`);
    }

    if (responses.personalStory) {
      advancedParts.push(`The story I'm telling myself about this experience is: ${responses.personalStory}`);
    }

    if (responses.patterns) {
      advancedParts.push(`Regarding patterns, ${responses.patterns} I have experienced this emotion in similar situations`);
    }

    if (responses.triggers && Array.isArray(responses.triggers) && responses.triggers.length > 0) {
      advancedParts.push(`The specific triggers that led to this feeling were: ${responses.triggers.join(', ')}`);
    }

    if (advancedParts.length > 0) {
      context += ` ${advancedParts.join('. ')}.`;
    }

    return context;
  } catch (error) {
    console.error('Error generating check-in context:', error);
    return '';
  }
};