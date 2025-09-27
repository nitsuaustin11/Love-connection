import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import useAuthStore from '../store/authStore';

const DebugConsole = () => {
  const { user, refreshUserProfile } = useAuthStore();
  const [showDebugConsole, setShowDebugConsole] = useState(false);

  const toggleDebugConsole = () => {
    setShowDebugConsole(!showDebugConsole);
  };

  const handleToggleAuth = () => {
    Alert.alert('Debug', 'Auth state toggle would sign out user');
  };

  const handleToggleProfile = async () => {
    try {
      const { updateUserProfile } = require('../services/userProfileService');
      const newStatus = !user?.profileCompleted;

      await updateUserProfile(user.uid, {
        profileCompleted: newStatus
      });

      await refreshUserProfile();
      Alert.alert('Debug', `Profile completed status: ${newStatus}`);
    } catch (error) {
      Alert.alert('Debug Error', 'Failed to toggle profile status');
    }
  };

  const handleTogglePersonality = async () => {
    try {
      const { updateUserProfile } = require('../services/userProfileService');
      const newStatus = !user?.personalityTests?.mbti?.completed;

      const mockGptContext = newStatus ?
        "My Results from the MBTI personality test are: INTJ: 'The Strategist', general info: summary: Independent, systems thinker, long-range planner., description: Strategic and future-oriented, INTJs enjoy building models to solve complex problems. They value competence, autonomy, and clarity of purpose. I want you to conceptualize my personality using these results, research accurate MBTI result information to understand me more precisely: and provide me information that could be useful based on my current experience, which I will provide you below:"
        : null;

      const updates = {
        'personalityTests.mbti.completed': newStatus,
        'personalityTests.mbti.selectedType': newStatus ? 'INTJ' : null,
        'personalityTests.mbti.completedAt': newStatus ? new Date().toISOString() : null
      };

      if (newStatus) {
        updates['personalityTests.mbti.results'] = {
          type: 'INTJ',
          title: 'The Strategist',
          summary: 'Independent, systems thinker, long-range planner.',
          description: 'Strategic and future-oriented, INTJs enjoy building models to solve complex problems. They value competence, autonomy, and clarity of purpose.'
        };
        updates['gptMessageContext.personalityContext.mbti'] = mockGptContext;
        updates['gptMessageContext.lastUpdated'] = new Date().toISOString();
      }

      await updateUserProfile(user.uid, updates);
      await refreshUserProfile();
      Alert.alert('Debug', `Personality test completed: ${newStatus}`);
    } catch (error) {
      Alert.alert('Debug Error', 'Failed to toggle personality status');
    }
  };

  const handleToggleSixNeeds = async () => {
    try {
      const { updateUserProfile } = require('../services/userProfileService');
      const newStatus = !user?.personalityTests?.sixHumanNeeds?.completed;

      const mockResults = newStatus ? {
        growth: 35,
        love_connection: 25,
        certainty: 15,
        variety: 10,
        significance: 10,
        contribution: 5
      } : null;

      const mockGptContext = newStatus ?
        "My Results from the Six Human Needs personality test are: Primary Need: Growth (35%) - People with Growth as their primary need are motivated by progress, learning, and developing their potential. They seek new experiences and challenges. Secondary Need: Love & Connection (25%) - Those driven by Love & Connection prioritize relationships, empathy, and shared experiences. They value intimacy and emotional bonds. I want you to conceptualize my personality using these results, research accurate Six Human Needs result information to understand me more precisely: and provide me information that could be useful based on my current experience, which I will provide you below:"
        : null;

      const updates = {
        'personalityTests.sixHumanNeeds.completed': newStatus,
        'personalityTests.sixHumanNeeds.results': mockResults,
        'personalityTests.sixHumanNeeds.completedAt': newStatus ? new Date().toISOString() : null
      };

      if (newStatus) {
        updates['gptMessageContext.personalityContext.sixHumanNeeds'] = mockGptContext;
        updates['gptMessageContext.lastUpdated'] = new Date().toISOString();
      }

      await updateUserProfile(user.uid, updates);
      await refreshUserProfile();
      Alert.alert('Debug', `Six Human Needs completed: ${newStatus}`);
    } catch (error) {
      Alert.alert('Debug Error', 'Failed to toggle six needs status');
    }
  };

  const handleToggleLoveLanguages = async () => {
    try {
      const { updateUserProfile } = require('../services/userProfileService');
      const newStatus = !user?.personalityTests?.loveLanguages?.completed;

      const mockResults = newStatus ? {
        quality_time: 30,
        words_of_affirmation: 25,
        acts_of_service: 20,
        physical_touch: 15,
        receiving_gifts: 10
      } : null;

      const mockGptContext = newStatus ?
        "My Results from the Love Languages personality test are: Primary Love Language: Quality Time (30%) - People with Quality Time as their love language feel most loved through focused attention, meaningful conversations, and shared experiences without distractions. Secondary Love Language: Words of Affirmation (25%) - Those with Words of Affirmation as their love language value verbal appreciation, encouragement, and positive communication. I want you to conceptualize my personality using these results, research accurate Love Languages result information to understand me more precisely: and provide me information that could be useful based on my current experience, which I will provide you below:"
        : null;

      const updates = {
        'personalityTests.loveLanguages.completed': newStatus,
        'personalityTests.loveLanguages.results': mockResults,
        'personalityTests.loveLanguages.completedAt': newStatus ? new Date().toISOString() : null
      };

      if (newStatus) {
        updates['gptMessageContext.personalityContext.loveLanguages'] = mockGptContext;
        updates['gptMessageContext.lastUpdated'] = new Date().toISOString();
      }

      await updateUserProfile(user.uid, updates);
      await refreshUserProfile();
      Alert.alert('Debug', `Love Languages completed: ${newStatus}`);
    } catch (error) {
      Alert.alert('Debug Error', 'Failed to toggle love languages status');
    }
  };

  const handleCreateGeneralTherapist = async () => {
    try {
      const { updateUserProfile } = require('../services/userProfileService');

      // Check if user already has general therapist
      const hasGeneralTherapist = user?.contacts?.some(contact => contact.id === 'general_therapist');

      if (hasGeneralTherapist) {
        Alert.alert('Debug', 'User already has General Therapist contact');
        return;
      }

      // Create the General Therapist contact
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

      // Add to existing contacts array
      const currentContacts = user?.contacts || [];
      const updatedContacts = [...currentContacts, generalTherapist];

      await updateUserProfile(user.uid, {
        contacts: updatedContacts
      });

      await refreshUserProfile();
      Alert.alert('Debug', 'General Therapist contact created successfully!');
    } catch (error) {
      Alert.alert('Debug Error', 'Failed to create General Therapist contact');
      console.error('Error creating General Therapist:', error);
    }
  };

  const renderDebugConsole = () => (
    <View style={styles.debugConsole}>
      <Text style={styles.debugTitle}>Debug Console</Text>
      <Text style={styles.debugInfo}>Current States:</Text>
      <Text style={styles.debugState}>Auth: {user ? 'Logged In' : 'Logged Out'}</Text>
      <Text style={styles.debugState}>Profile: {user?.profileCompleted ? 'Completed' : 'Incomplete'}</Text>
      <Text style={styles.debugState}>MBTI: {user?.personalityTests?.mbti?.completed ? 'Completed' : 'Not Completed'}</Text>
      <Text style={styles.debugState}>Six Needs: {user?.personalityTests?.sixHumanNeeds?.completed ? 'Completed' : 'Not Completed'}</Text>
      <Text style={styles.debugState}>Love Languages: {user?.personalityTests?.loveLanguages?.completed ? 'Completed' : 'Not Completed'}</Text>

      <View style={styles.debugButtons}>
        <TouchableOpacity style={styles.debugButton} onPress={handleToggleAuth}>
          <Text style={styles.debugButtonText}>Toggle Auth</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.debugButton} onPress={handleToggleProfile}>
          <Text style={styles.debugButtonText}>Toggle Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.debugButton} onPress={handleTogglePersonality}>
          <Text style={styles.debugButtonText}>Toggle MBTI</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.debugButton} onPress={handleToggleSixNeeds}>
          <Text style={styles.debugButtonText}>Toggle Six Needs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.debugButton} onPress={handleToggleLoveLanguages}>
          <Text style={styles.debugButtonText}>Toggle Love Languages</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.debugButton, styles.therapistButton]} onPress={handleCreateGeneralTherapist}>
          <Text style={styles.debugButtonText}>Add General Therapist</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.debugToggle}
        onPress={toggleDebugConsole}
      >
        <Text style={styles.debugToggleText}>
          {showDebugConsole ? '🐛 Hide Debug' : '🐛 Debug Console'}
        </Text>
      </TouchableOpacity>

      {showDebugConsole && renderDebugConsole()}
    </>
  );
};

const styles = StyleSheet.create({
  debugToggle: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    zIndex: 1000,
  },
  debugToggleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  debugConsole: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    marginTop: 10,
  },
  debugTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugInfo: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  debugState: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  debugButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
  },
  debugButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    margin: 2,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  therapistButton: {
    backgroundColor: '#8B5CF6',
  },
});

export default DebugConsole;