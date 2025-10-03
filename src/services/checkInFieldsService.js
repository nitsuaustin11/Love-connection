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
 * @param {string} mode - "basic" or "advanced" (deprecated - always returns both)
 * @returns {Object} Fields with both basic and advanced sections
 */
export const getFieldsForMode = async (mode = 'basic') => {
  try {
    const checkInFields = await getCheckInFields();
    if (!checkInFields || !checkInFields.checkInFields) {
      return {};
    }

    const basicFields = checkInFields.checkInFields.basic || {};
    const advancedFields = checkInFields.checkInFields.advanced || {};

    // Always return both basic and advanced fields
    // The UI toggle controls which ones are displayed
    return {
      basic: basicFields,
      advanced: advancedFields
    };
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
    // Build the context in natural language format
    let context = `The emotion and experience I'm having right now is ${emotion}.`;

    // BASIC QUESTIONS

    // When (order 1)
    if (responses.when) {
      context += ` I've been feeling this for about ${responses.when}.`;
    }

    // How much / Intensity (order 2)
    if (responses.howMuch) {
      context += ` On a scale from 1-10, the intensity of this emotion is ${responses.howMuch} out of 10.`;
    }

    // Symptoms / Effects (order 3)
    if (Array.isArray(responses.symptoms) && responses.symptoms.length > 0) {
      context += ` This has been affecting me in the following ways: ${responses.symptoms.join(', ')}.`;
    }

    // Perspective / What happened (order 4)
    if (responses.perspective) {
      context += ` Here is what happened from my perspective: ${responses.perspective}.`;
    }

    // Physical Response (order 5)
    if (Array.isArray(responses.physicalResponse) && responses.physicalResponse.length > 0) {
      const filtered = responses.physicalResponse.filter(r => r !== 'None');
      if (filtered.length > 0) {
        context += ` Physically, I'm experiencing: ${filtered.join(', ')}.`;
      }
    }

    // Trigger Event (order 6)
    if (responses.triggerEvent) {
      context += ` The specific trigger was: ${responses.triggerEvent}.`;
    }

    // Coping Attempts (order 7)
    if (Array.isArray(responses.copingAttempts) && responses.copingAttempts.length > 0) {
      const filtered = responses.copingAttempts.filter(r => r !== 'Nothing yet');
      if (filtered.length > 0) {
        context += ` I've already tried to help myself by: ${filtered.join(', ')}.`;
      }
    }

    // ADVANCED QUESTIONS (deeper reflection)
    const advancedParts = [];

    // Underlying Needs (order 1)
    if (responses.underlyingNeeds) {
      advancedParts.push(`The need that isn't being met is: ${responses.underlyingNeeds}`);
    }

    // Past Patterns (order 2)
    if (responses.pastPatterns) {
      advancedParts.push(`Similar past experiences: ${responses.pastPatterns}`);
    }

    // Fear or Worry (order 3)
    if (responses.fearOrWorry) {
      advancedParts.push(`What I'm most afraid of: ${responses.fearOrWorry}`);
    }

    // Desired Outcome (order 4)
    if (responses.desiredOutcome) {
      advancedParts.push(`What I hope for: ${responses.desiredOutcome}`);
    }

    // Self Compassion (order 5)
    if (responses.selfCompassion) {
      advancedParts.push(`My level of self-compassion right now is ${responses.selfCompassion} out of 10`);
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