import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import useAuthStore from '../store/authStore';
import { getTherapistDebugInfo, generateTherapistPrompt, verifyTherapistData } from '../services/gptContextService';
import DebugConsole from '../components/DebugConsole';

const CheckInScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [showFollowUp, setShowFollowUp] = useState(false);

  // Check if user has completed personality tests
  const hasPersonalityType = user?.personalityTests?.mbti?.completed || false;

  // Get available emotions from user profile
  const availableEmotions = user?.availableEmotions || [
    "Anger",
    "Loneliness",
    "Frustration",
    "Shame",
    "Fear",
    "Sadness/Grief",
    "Guilt",
    "Hopeless"
  ];

  const handlePersonalityRedirect = () => {
    navigation.navigate('PersonalityTest');
  };

  const handleEmotionSelect = (emotion) => {
    setSelectedEmotion(emotion);
    setShowFollowUp(true);
    console.log('Selected emotion:', emotion);
  };

  const handleAddCustomEmotion = () => {
    Alert.prompt(
      'Add Custom Emotion',
      'What emotion are you feeling that\'s not listed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (customEmotion) => {
            if (customEmotion && customEmotion.trim()) {
              setSelectedEmotion(customEmotion.trim());
              setShowFollowUp(true);
              console.log('Custom emotion added:', customEmotion.trim());
              // TODO: Save custom emotion to user's available emotions
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const renderEmotionButton = (emotion) => (
    <TouchableOpacity
      key={emotion}
      style={[
        styles.emotionButton,
        selectedEmotion === emotion && styles.emotionButtonSelected
      ]}
      onPress={() => handleEmotionSelect(emotion)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.emotionButtonText,
        selectedEmotion === emotion && styles.emotionButtonTextSelected
      ]}>
        {emotion}
      </Text>
    </TouchableOpacity>
  );

  const renderFollowUpCard = () => (
    <View style={styles.followUpOverlay}>
      <View style={styles.followUpCard}>
        <View style={styles.followUpHeader}>
          <Text style={styles.followUpTitle}>Tell us more about {selectedEmotion}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFollowUp(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.followUpDescription}>
          Share what's contributing to this feeling and how we can help you work through it.
        </Text>

        {/* TODO: Add follow-up content here */}
        <View style={styles.followUpContent}>
          <Text style={styles.placeholderText}>Follow-up content will go here</Text>
        </View>
      </View>
    </View>
  );

  const handleDebugGPTContext = async () => {
    try {
      console.log('=== GPT CONTEXT & THERAPIST DEBUG ===');

      // Verify therapist data first
      const verificationResult = verifyTherapistData(user);
      console.log('THERAPIST VERIFICATION RESULT:', verificationResult);
      console.log('---');

      // Get therapist debug info
      const therapistInfo = await getTherapistDebugInfo(user);
      console.log('THERAPIST CONFIGURATION:');
      console.log(JSON.stringify(therapistInfo, null, 2));
      console.log('---');

      console.log('GPT MESSAGE CONTEXT:');
      console.log('Last Updated:', user?.gptMessageContext?.lastUpdated);
      console.log('---');
      console.log('PERSONALITY CONTEXT:');
      console.log('MBTI Context:', user?.gptMessageContext?.personalityContext?.mbti || 'Not set');
      console.log('Six Human Needs Context:', user?.gptMessageContext?.personalityContext?.sixHumanNeeds || 'Not set');
      console.log('Love Languages Context:', user?.gptMessageContext?.personalityContext?.loveLanguages || 'Not set');
      console.log('---');
      console.log('CURRENT EMOTIONAL CONTEXT:');
      console.log('Primary Emotion:', user?.gptMessageContext?.currentEmotionalContext?.primaryEmotion || 'Not set');
      console.log('User Context:', user?.gptMessageContext?.currentEmotionalContext?.userContext || 'Not set');
      console.log('Wellness Goal:', user?.gptMessageContext?.currentEmotionalContext?.wellnessGoal || 'Not set');
      console.log('---');

      // Generate a sample therapist prompt
      console.log('SAMPLE THERAPIST PROMPT (Check-in format):');
      const samplePrompt = await generateTherapistPrompt(
        user,
        therapistInfo.settings,
        'check_in',
        'I\'ve been feeling really anxious lately about work and my relationships.'
      );
      console.log(samplePrompt || 'Could not generate prompt');
      console.log('============================================');

      const personalityContexts = [
        user?.gptMessageContext?.personalityContext?.mbti,
        user?.gptMessageContext?.personalityContext?.sixHumanNeeds,
        user?.gptMessageContext?.personalityContext?.loveLanguages
      ].filter(Boolean);

      const hasTherapist = !!therapistInfo?.therapistName;

      Alert.alert(
        'GPT Context & Therapist Debug',
        `Therapist Found: ${verificationResult.hasGeneralTherapist ? 'Yes' : 'No'}\nGPT Settings: ${verificationResult.hasGptSettings ? 'Yes' : 'No'}\nTotal Contacts: ${verificationResult.contactCount}\nPersonality Contexts: ${personalityContexts.length}/3\n\nCheck console for detailed verification and configuration`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error in GPT context debug:', error);
      Alert.alert('Debug Error', 'Failed to generate debug information. Check console for details.');
    }
  };

  if (!hasPersonalityType) {
    return (
      <ScrollView style={styles.container}>
        <DebugConsole />
        <View style={styles.centeredContent}>
          <Text style={styles.title}>Check-in</Text>
          <Text style={styles.requirementText}>
            Add a personality to access Check-in features
          </Text>

          <TouchableOpacity
            style={styles.personalityButton}
            onPress={handlePersonalityRedirect}
          >
            <Text style={styles.personalityButtonText}>→ Personality Page</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.debugButton}
            onPress={handleDebugGPTContext}
          >
            <Text style={styles.debugButtonText}>🐛 Debug GPT Context</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <DebugConsole />

        <Text style={styles.title}>Check-in</Text>

        <View style={styles.emotionsContainer}>
          <View style={styles.emotionsGrid}>
            {availableEmotions.map(emotion => renderEmotionButton(emotion))}
          </View>

          <TouchableOpacity
            style={styles.addEmotionButton}
            onPress={handleAddCustomEmotion}
            activeOpacity={0.7}
          >
            <Text style={styles.addEmotionButtonText}>+ ADD emotion</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleDebugGPTContext}
        >
          <Text style={styles.debugButtonText}>🐛 Debug GPT Context</Text>
        </TouchableOpacity>
      </ScrollView>

      {showFollowUp && renderFollowUpCard()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e91e63',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  requirementText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  personalityButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 20,
  },
  personalityButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#047857',
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    marginBottom: 30,
  },
  emotionsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  emotionButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e9ecef',
    width: '48%',
    alignItems: 'center',
  },
  emotionButtonSelected: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  emotionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  emotionButtonTextSelected: {
    color: 'white',
  },
  addEmotionButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  addEmotionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedEmotionContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#e91e63',
    alignItems: 'center',
  },
  selectedEmotionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  selectedEmotionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 8,
  },
  selectedEmotionNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  followUpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  followUpCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  followUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  followUpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  followUpDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  followUpContent: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default CheckInScreen;