import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../Firebaseconfig';

let cachedPersonalityData = null;

/**
 * Fetches personality test data from Firebase
 * @returns {Object} Personality test data including MBTI, Six Human Needs, and Love Languages
 */
export const getPersonalityTestData = async () => {
  try {
    // Return cached data if available
    if (cachedPersonalityData) {
      return cachedPersonalityData;
    }

    // Fetch from Firebase
    const docRef = doc(db, 'appData', 'personalityTests');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      cachedPersonalityData = docSnap.data();
      return cachedPersonalityData;
    } else {
      console.warn('No personality test data found in Firebase');
      return null;
    }
  } catch (error) {
    console.error('Error fetching personality test data:', error);
    throw error;
  }
};

/**
 * Formats user's MBTI result for display
 * @param {Object} userMbtiData - User's MBTI test results
 * @param {Object} mbtiTestData - MBTI test metadata from Firebase
 * @returns {string} Formatted result string
 */
export const formatMbtiResult = (userMbtiData, mbtiTestData) => {
  if (!userMbtiData?.completed || !userMbtiData?.selectedType) {
    return mbtiTestData?.Ui_information?.no_results_text || 'None currently';
  }

  // Find the result details
  const resultType = mbtiTestData?.Test_information?.types_of_results?.find(
    type => type.result_name === userMbtiData.selectedType
  );

  if (resultType) {
    return `Your Type: ${resultType.result_name} - ${resultType.result_title}`;
  }

  return `Your Type: ${userMbtiData.selectedType}`;
};

/**
 * Formats user's Six Human Needs results for display
 * @param {Object} userNeedsData - User's Six Human Needs test results
 * @param {Object} needsTestData - Six Human Needs test metadata from Firebase
 * @returns {string} Formatted result string
 */
export const formatSixHumanNeedsResult = (userNeedsData, needsTestData) => {
  if (!userNeedsData?.completed || !userNeedsData?.results) {
    return needsTestData?.Ui_information?.no_results_text || 'None currently';
  }

  const results = userNeedsData.results;

  // Sort needs by percentage to get primary and secondary
  const sortedNeeds = Object.entries(results)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  if (sortedNeeds.length >= 2) {
    const primary = sortedNeeds[0][0];
    const secondary = sortedNeeds[1][0];

    // Convert snake_case to Title Case
    const formatNeedName = (name) => {
      return name.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    };

    return `Your human needs: 1. ${formatNeedName(primary)} & 2. ${formatNeedName(secondary)}`;
  }

  return needsTestData?.Ui_information?.no_results_text || 'None currently';
};

/**
 * Formats user's Love Languages results for display
 * @param {Object} userLanguagesData - User's Love Languages test results
 * @param {Object} languagesTestData - Love Languages test metadata from Firebase
 * @returns {string} Formatted result string
 */
export const formatLoveLanguagesResult = (userLanguagesData, languagesTestData) => {
  if (!userLanguagesData?.completed || !userLanguagesData?.results) {
    return languagesTestData?.Ui_information?.no_results_text || 'None currently';
  }

  const results = userLanguagesData.results;

  // Sort languages by percentage to get primary and secondary
  const sortedLanguages = Object.entries(results)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  if (sortedLanguages.length >= 2) {
    const primary = sortedLanguages[0][0];
    const secondary = sortedLanguages[1][0];

    // Convert snake_case to Title Case
    const formatLanguageName = (name) => {
      return name.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    };

    return `Your Love Languages: 1. ${formatLanguageName(primary)} & 2. ${formatLanguageName(secondary)}`;
  }

  return languagesTestData?.Ui_information?.no_results_text || 'None currently';
};

/**
 * Clears cached personality data (useful for testing or updates)
 */
export const clearPersonalityDataCache = () => {
  cachedPersonalityData = null;
};