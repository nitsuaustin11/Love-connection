import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../Firebaseconfig';

/**
 * Creates a complete default user profile structure
 * @param {Object} user - Firebase user object
 * @param {Object} additionalData - Any additional data to merge
 * @returns {Object} Complete user profile object
 */
export const createDefaultUserProfile = (user, additionalData = {}) => ({
  uid: user.uid,
  email: user.email,

  profile: {
    firstName: additionalData.firstName || "",
    lastName: additionalData.lastName || "",
    ageRange: additionalData.ageRange || null,
    pronouns: additionalData.pronouns || null,
    description: additionalData.whatBringsYouHere || "",
    primaryWellnessGoal: additionalData.primaryWellnessGoal || null,
    fiveWords: []
  },

  accountStatus: {
    status: "active",
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    emailVerified: user.emailVerified || false
  },

  subscription: {
    plan: "free",
    status: "active",
    stripeCustomerId: null,
    subscriptionId: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    features: {
      unlimitedAiMessages: false,
      personalityInsights: false,
      emotionAnalytics: false,
      exportData: false,
      prioritySupport: false,
      advancedFollowUp: false
    }
  },

  personalityTests: {
    mbti: {
      completed: false,
      selectedType: null,
      completedAt: null,
      results: null
    },
    sixHumanNeeds: {
      completed: false,
      completedAt: null,
      results: null
    },
    loveLanguages: {
      completed: false,
      completedAt: null,
      results: null
    }
  },

  currentCheckin: null,
  emotionHistory: [],
  availableEmotions: [
    "Anger",
    "Loneliness",
    "Frustration",
    "Shame",
    "Fear",
    "Sadness/Grief",
    "Guilt",
    "Hopeless"
  ],

  messageThreads: [],
  contacts: [
    {
      id: "general_therapist",
      name: "General Therapist",
      type: "ai_therapist",
      isActive: true,
      canReceiveEmotionUpdates: true,
      gptSettings: {
        responseStyle: "analytical_yet_empathetic",
        conversationDepth: "moderate",
        responseFrequency: "standard",
        emotionalValidationLevel: "balanced",
        personalityAnalysisLevel: "moderate",
        summaryStyle: "empathetic",
        adviceDepth: "standard",
        questionFocus: "emotional_processing",
        wantsActionableAdvice: true,
        openToVulnerability: true,
        checkInFormatting: {
          includeSummary: true,
          includePersonalityAnalysis: true,
          includeFeedback: true,
          personalityDepth: "moderate"
        }
      },
      addedAt: new Date().toISOString()
    }
  ],

  gptMessageContext: {
    lastUpdated: new Date().toISOString(),
    personalityContext: {
      mbti: null,
      sixHumanNeeds: null,
      loveLanguages: null,
      summary: null
    },
    currentEmotionalContext: {
      primaryEmotion: additionalData.currentEmotion || null,
      desiredEmotion: additionalData.desiredEmotion || null
    },
    recentEmotionalPatterns: [],
    communicationPreferences: {
      preferredResponseStyle: additionalData.preferredResponseStyle || "analytical_yet_empathetic",
      wantsActionableAdvice: true,
      openToVulnerability: true
    }
  },

  appPreferences: {
    gptContext: {
      includeAboutInfo: true,
      includePersonalityTests: true,
      includeCheckInHistory: true,
      includeDemographics: true,
      historyLength: 10
    },
    notifications: {
      dailyCheckinReminders: true,
      messageResponses: true,
      personalityTestReminders: false
    },
    privacy: {
      shareEmotionDataWithContacts: true,
      allowAiLearning: true,
      anonymousUsageData: false
    },
    ui: {
      theme: "light",
      fontSize: "medium",
      language: "en"
    },
    checkIn: {
      mode: "basic"
    }
  },

  // Profile completion tracking
  profileCompleted: additionalData.profileCompleted || false,

  ...additionalData
});

/**
 * Creates a complete user profile in Firestore
 * @param {string} uid - User ID
 * @param {Object} profileData - Complete profile data
 */
export const createUserProfile = async (uid, profileData) => {
  try {
    await setDoc(doc(db, 'users', uid), profileData);
    return profileData;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Gets a user profile from Firestore
 * @param {string} uid - User ID
 * @returns {Object|null} User profile data or null if not found
 */
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Updates specific fields in a user profile
 * @param {string} uid - User ID
 * @param {Object} updates - Fields to update
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    await updateDoc(doc(db, 'users', uid), updates);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Checks if a profile has all required fields
 * @param {Object} profile - User profile object
 * @returns {Object} { isComplete: boolean, missingFields: array }
 */
export const checkProfileCompleteness = (profile) => {
  const requiredFields = [
    'uid',
    'email',
    'profile',
    'accountStatus',
    'subscription',
    'personalityTests',
    'emotionHistory',
    'availableEmotions',
    'messageThreads',
    'contacts',
    'gptMessageContext',
    'appPreferences',
    'profileCompleted'
  ];

  const missingFields = [];

  requiredFields.forEach(field => {
    if (!profile || !profile.hasOwnProperty(field)) {
      missingFields.push(field);
    }
  });

  // Check nested required fields
  if (profile?.personalityTests) {
    const requiredTests = ['mbti', 'sixHumanNeeds', 'loveLanguages'];
    requiredTests.forEach(test => {
      if (!profile.personalityTests.hasOwnProperty(test)) {
        missingFields.push(`personalityTests.${test}`);
      }
    });
  }

  if (profile?.subscription && !profile.subscription.hasOwnProperty('features')) {
    missingFields.push('subscription.features');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
};

/**
 * Merges missing fields from default template into existing profile
 * @param {Object} existingProfile - Current user profile
 * @param {Object} user - Firebase user object
 * @returns {Object} Complete merged profile
 */
export const mergeWithDefaultProfile = (existingProfile, user) => {
  const defaultProfile = createDefaultUserProfile(user);

  // Deep merge function to preserve existing data while adding missing fields
  const deepMerge = (target, source) => {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (result[key] === undefined || result[key] === null) {
          // Field is missing, add from default
          result[key] = source[key];
        } else if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
          // Field exists but might be missing nested properties
          result[key] = deepMerge(result[key], source[key]);
        }
        // If field exists and is not an object, keep existing value
      }
    }

    return result;
  };

  return deepMerge(existingProfile, defaultProfile);
};

/**
 * Ensures user has General Therapist contact
 * @param {Object} existingProfile - Current user profile
 * @returns {Object} Updated profile with General Therapist
 */
const ensureGeneralTherapist = (existingProfile) => {
  console.log('🔍 THERAPIST MIGRATION: Checking for General Therapist...');
  console.log('Current contacts:', existingProfile?.contacts?.map(c => ({ id: c.id, name: c.name })) || 'No contacts');

  const hasGeneralTherapist = existingProfile?.contacts?.some(contact => contact.id === 'general_therapist');
  console.log('Has General Therapist?', hasGeneralTherapist);

  if (!hasGeneralTherapist) {
    console.log('✨ THERAPIST MIGRATION: Adding General Therapist to profile...');
    const generalTherapist = {
      id: "general_therapist",
      name: "General Therapist",
      type: "ai_therapist",
      isActive: true,
      canReceiveEmotionUpdates: true,
      gptSettings: {
        responseStyle: "analytical_yet_empathetic",
        conversationDepth: "moderate",
        responseFrequency: "standard",
        emotionalValidationLevel: "balanced",
        personalityAnalysisLevel: "moderate",
        summaryStyle: "empathetic",
        adviceDepth: "standard",
        questionFocus: "emotional_processing",
        wantsActionableAdvice: true,
        openToVulnerability: true,
        checkInFormatting: {
          includeSummary: true,
          includePersonalityAnalysis: true,
          includeFeedback: true,
          personalityDepth: "moderate"
        }
      },
      addedAt: new Date().toISOString()
    };

    const updatedProfile = { ...existingProfile };
    updatedProfile.contacts = updatedProfile.contacts || [];

    // Remove old AI Therapist if it exists
    const oldAITherapist = updatedProfile.contacts.find(contact => contact.id === 'ai_therapist');
    if (oldAITherapist) {
      console.log('🗑️ THERAPIST MIGRATION: Removing old AI Therapist');
    }
    updatedProfile.contacts = updatedProfile.contacts.filter(contact => contact.id !== 'ai_therapist');

    // Add General Therapist
    updatedProfile.contacts.push(generalTherapist);

    console.log('✅ THERAPIST MIGRATION: General Therapist added successfully');
    console.log('Updated contacts:', updatedProfile.contacts.map(c => ({ id: c.id, name: c.name })));
    console.log('General Therapist settings:', generalTherapist.gptSettings);

    return updatedProfile;
  }

  console.log('✅ THERAPIST MIGRATION: General Therapist already exists, no changes needed');
  return existingProfile;
};

/**
 * Initializes or updates a user profile to ensure completeness
 * @param {Object} user - Firebase user object
 * @param {Object} existingProfile - Current profile data (if any)
 * @param {Object} additionalData - Any additional data to include
 * @returns {Object} Complete user profile
 */
export const initializeUserProfile = async (user, existingProfile = null, additionalData = {}) => {
  try {
    let profileData;

    if (!existingProfile) {
      // New user - create complete profile
      profileData = createDefaultUserProfile(user, additionalData);
      await createUserProfile(user.uid, profileData);
    } else {
      // Existing user - check completeness and merge if needed
      const { isComplete } = checkProfileCompleteness(existingProfile);

      // Always ensure General Therapist exists for existing users
      let updatedProfile = ensureGeneralTherapist(existingProfile);
      let needsUpdate = updatedProfile !== existingProfile;

      if (!isComplete) {
        // Profile is incomplete, merge with defaults
        profileData = mergeWithDefaultProfile(updatedProfile, user);
        await updateUserProfile(user.uid, profileData);
      } else if (needsUpdate) {
        // Profile is complete but needs General Therapist
        console.log('💾 THERAPIST MIGRATION: Saving General Therapist to Firebase...');
        profileData = updatedProfile;
        await updateUserProfile(user.uid, {
          contacts: profileData.contacts,
          'accountStatus.lastActiveAt': new Date().toISOString()
        });
        console.log('✅ THERAPIST MIGRATION: Successfully saved to Firebase');
      } else {
        // Profile is complete, just update last active
        profileData = existingProfile;
        await updateUserProfile(user.uid, {
          'accountStatus.lastActiveAt': new Date().toISOString()
        });
      }
    }

    return profileData;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    throw error;
  }
};