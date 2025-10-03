import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
  TextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import { getTherapistDebugInfo, generateTherapistPrompt, verifyTherapistData } from '../services/gptContextService';
import { getFieldsForMode, generateCheckInContext } from '../services/checkInFieldsService';
import { assembleCompletePrompt, debugAssembledPrompt } from '../services/contextAssembler';
import { createMessageThread, addMessageToThread, createCheckInSummaryMessage } from '../services/messageThreadService';
import DebugConsole from '../components/DebugConsole';

const CheckInScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [checkInFields, setCheckInFields] = useState({});
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [showContactSelection, setShowContactSelection] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [checkInCompleted, setCheckInCompleted] = useState(false);

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

  // Load check-in fields when component mounts
  useEffect(() => {
    const loadCheckInFields = async () => {
      setLoading(true);
      try {
        const checkInMode = user?.appPreferences?.checkIn?.mode || 'basic';
        const fields = await getFieldsForMode(checkInMode);
        setCheckInFields(fields);
        console.log('Loaded check-in fields for mode:', checkInMode, fields);
      } catch (error) {
        console.error('Error loading check-in fields:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCheckInFields();
  }, [user]);

  const handleEmotionSelect = (emotion) => {
    setSelectedEmotion(emotion);
    setShowFollowUp(true);
    setResponses({}); // Clear previous responses
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

  const updateResponse = (fieldKey, value) => {
    setResponses(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const renderField = (fieldKey, field) => {
    const currentValue = responses[fieldKey];

    switch (field.formType) {
      case 'checkbox':
        if (field.selectionType === 'single') {
          return (
            <View key={fieldKey} style={styles.fieldContainer}>
              <Text style={styles.fieldQuestion}>{field.question}</Text>
              <View style={styles.checkboxContainer}>
                {field.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.checkboxOption,
                      currentValue === option && styles.checkboxOptionSelected
                    ]}
                    onPress={() => updateResponse(fieldKey, option)}
                  >
                    <Text style={[
                      styles.checkboxOptionText,
                      currentValue === option && styles.checkboxOptionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        } else if (field.selectionType === 'multiple') {
          return (
            <View key={fieldKey} style={styles.fieldContainer}>
              <Text style={styles.fieldQuestion}>{field.question}</Text>
              <View style={styles.checkboxContainer}>
                {field.options.map((option, index) => {
                  const isSelected = Array.isArray(currentValue) && currentValue.includes(option);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.checkboxOption,
                        isSelected && styles.checkboxOptionSelected
                      ]}
                      onPress={() => {
                        const current = Array.isArray(currentValue) ? currentValue : [];
                        if (isSelected) {
                          updateResponse(fieldKey, current.filter(item => item !== option));
                        } else {
                          updateResponse(fieldKey, [...current, option]);
                        }
                      }}
                    >
                      <Text style={[
                        styles.checkboxOptionText,
                        isSelected && styles.checkboxOptionTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }
        break;

      case 'slider':
        return (
          <View key={fieldKey} style={styles.fieldContainer}>
            <Text style={styles.fieldQuestion}>{field.question}</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValue}>{currentValue || 1}</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={field.options}
                step={1}
                value={currentValue || 1}
                onValueChange={(value) => updateResponse(fieldKey, value)}
                minimumTrackTintColor="#e91e63"
                maximumTrackTintColor="#ddd"
                thumbStyle={styles.sliderThumb}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>1</Text>
                <Text style={styles.sliderLabel}>{field.options}</Text>
              </View>
            </View>
          </View>
        );

      case 'textInput':
        return (
          <View key={fieldKey} style={styles.fieldContainer}>
            <Text style={styles.fieldQuestion}>{field.question}</Text>
            <TextInput
              style={styles.textInput}
              value={currentValue || ''}
              onChangeText={(text) => updateResponse(fieldKey, text)}
              placeholder={field.placeholder || 'Enter your response...'}
              multiline={true}
              numberOfLines={4}
            />
          </View>
        );

      default:
        return null;
    }
  };

  const handleSendToContacts = async () => {
    // First complete the check-in (same logic as handleCompleteCheckIn)
    try {
      // Generate check-in context from responses
      const checkInContext = await generateCheckInContext(responses, selectedEmotion);

      // Update user's current emotional context with check-in data
      const updatedEmotionalContext = {
        ...user?.gptMessageContext?.currentEmotionalContext,
        primaryEmotion: selectedEmotion,
        checkInResponses: responses,
        checkInContext: checkInContext,
        lastCheckInAt: new Date().toISOString()
      };

      // Create complete updated GPT message context
      const updatedGptContext = {
        ...user?.gptMessageContext,
        currentEmotionalContext: updatedEmotionalContext,
        lastUpdated: new Date().toISOString()
      };

      console.log('=== COMPLETE GPT CONTEXT AFTER CHECK-IN ===');
      console.log('Updated GPT Message Context:', JSON.stringify(updatedGptContext, null, 2));
      console.log('===');
      console.log('Current Emotional Context:');
      console.log('Primary Emotion:', updatedEmotionalContext.primaryEmotion);
      console.log('Desired Emotion:', updatedEmotionalContext.desiredEmotion);
      console.log('Check-in Context:', updatedEmotionalContext.checkInContext);
      console.log('Check-in Responses:', JSON.stringify(updatedEmotionalContext.checkInResponses, null, 2));
      console.log('Last Check-in:', updatedEmotionalContext.lastCheckInAt);
      console.log('===');
      console.log('Personality Context:');
      console.log('MBTI:', user?.gptMessageContext?.personalityContext?.mbti || 'Not set');
      console.log('Six Human Needs:', user?.gptMessageContext?.personalityContext?.sixHumanNeeds || 'Not set');
      console.log('Love Languages:', user?.gptMessageContext?.personalityContext?.loveLanguages || 'Not set');
      console.log('=== END GPT CONTEXT ===');

      // TODO: Save updated context to user profile in Firebase

      // Now open contact selection
      setCheckInCompleted(true);
      setShowContactSelection(true);
    } catch (error) {
      console.error('Error completing check-in:', error);
      Alert.alert('Error', 'Failed to complete check-in. Please try again.');
    }
  };

  const handleContactToggle = (contact) => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(c => c.id === contact.id);
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  const handleSendToSelectedContacts = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Contacts Selected', 'Please select at least one contact to send to.');
      return;
    }

    try {
      console.log('=== SENDING CHECK-IN TO SELECTED CONTACTS ===');
      console.log('Selected Contacts:', selectedContacts.map(c => `${c.name} (${c.type})`));
      console.log('');

      // For now, handle only the first AI therapist contact
      const aiTherapist = selectedContacts.find(c => c.type === 'ai_therapist');

      if (aiTherapist && aiTherapist.gptSettings) {
        // 1. Create updated user context with check-in data
        const checkInContext = await generateCheckInContext(responses, selectedEmotion);
        const updatedUser = {
          ...user,
          gptMessageContext: {
            ...user?.gptMessageContext,
            currentEmotionalContext: {
              ...user?.gptMessageContext?.currentEmotionalContext,
              primaryEmotion: selectedEmotion,
              checkInContext: checkInContext,
              checkInResponses: responses,
              lastCheckInAt: new Date().toISOString()
            },
            lastUpdated: new Date().toISOString()
          }
        };

        // 2. Create new message thread
        const thread = await createMessageThread(
          user.uid,
          aiTherapist.id,
          aiTherapist.name,
          aiTherapist.type
        );

        console.log('Created thread:', thread.threadId);

        // 3. Create check-in summary message (user's message)
        const checkInSummary = createCheckInSummaryMessage(selectedEmotion, checkInContext);

        await addMessageToThread(thread.threadId, {
          sender: 'user',
          content: checkInSummary,
        });

        // 4. Generate AI response (demo for now)
        await addMessageToThread(thread.threadId, {
          sender: 'ai',
          content: 'Demo of chat GPT response',
        });

        console.log('Added initial messages to thread');

        // 5. Clear check-in state
        setShowContactSelection(false);
        setShowFollowUp(false);
        setSelectedEmotion(null);
        setResponses({});
        setSelectedContacts([]);
        setCheckInCompleted(false);

        // 6. Navigate to message thread
        navigation.navigate('Messages', {
          screen: 'MessageThread',
          params: {
            threadId: thread.threadId,
            contactName: aiTherapist.name,
          }
        });
      }

    } catch (error) {
      console.error('Error sending to contacts:', error);
      Alert.alert('Send Error', 'Failed to send check-in to contacts.');
    }
  };


  const renderContactSelectionModal = () => {
    const activeContacts = user?.contacts?.filter(contact => contact.isActive) || [];

    return (
      <View style={styles.followUpOverlay}>
        <ScrollView style={styles.followUpCard} showsVerticalScrollIndicator={false}>
          <View style={styles.followUpHeader}>
            <Text style={styles.followUpTitle}>Send Check-in To</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowContactSelection(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.followUpDescription}>
            Select contacts to share your emotional check-in with.
          </Text>

          <View style={styles.contactsContainer}>
            <Text style={styles.contactsTitle}>Available Contacts:</Text>

            {activeContacts.length === 0 ? (
              <Text style={styles.noContactsText}>No active contacts found.</Text>
            ) : (
              activeContacts.map(contact => {
                const isSelected = selectedContacts.some(c => c.id === contact.id);
                return (
                  <TouchableOpacity
                    key={contact.id}
                    style={[
                      styles.contactItem,
                      isSelected && styles.contactItemSelected
                    ]}
                    onPress={() => handleContactToggle(contact)}
                  >
                    <View style={styles.contactInfo}>
                      <Text style={[
                        styles.contactName,
                        isSelected && styles.contactNameSelected
                      ]}>
                        {contact.name}
                      </Text>
                      <Text style={[
                        styles.contactType,
                        isSelected && styles.contactTypeSelected
                      ]}>
                        {contact.type === 'ai_therapist' ? 'AI Therapist' : 'Personal Contact'}
                      </Text>
                    </View>
                    <View style={[
                      styles.contactCheckbox,
                      isSelected && styles.contactCheckboxSelected
                    ]}>
                      {isSelected && <Text style={styles.checkboxText}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={styles.contactActionButtons}>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendToSelectedContacts}
              disabled={selectedContacts.length === 0}
            >
              <Text style={styles.sendButtonText}>
                Send to {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderFollowUpCard = () => {
    const allFields = { ...checkInFields.basic, ...checkInFields.advanced };
    const fieldKeys = Object.keys(allFields);

    return (
      <View style={styles.followUpOverlay}>
        <ScrollView style={styles.followUpCard} showsVerticalScrollIndicator={false}>
          <View style={styles.followUpHeader}>
            <Text style={styles.followUpTitle}>Tell us more about {selectedEmotion}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowFollowUp(false);
                setSelectedEmotion(null);
                setResponses({});
                setCheckInCompleted(false);
                setShowContactSelection(false);
                setSelectedContacts([]);
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.followUpDescription}>
            Share what's contributing to this feeling and how we can help you work through it.
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading questions...</Text>
            </View>
          ) : (
            <View style={styles.fieldsContainer}>
              {fieldKeys.map(fieldKey => renderField(fieldKey, allFields[fieldKey]))}

              <TouchableOpacity
                style={styles.sendToButton}
                onPress={handleSendToContacts}
              >
                <View style={styles.sendButtonContent}>
                  <Text style={styles.sendToButtonText}>Send To Contact </Text>
                  <Feather name="send" size={20} color="white" />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

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
          <Text style={styles.debugButtonText}>🐛 Debug Old Context</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.debugButton, { backgroundColor: '#0891b2', borderColor: '#0e7490' }]}
          onPress={async () => {
            try {
              const prompt = await debugAssembledPrompt(user);
              Alert.alert(
                'Context Assembled!',
                `Successfully assembled ${prompt.length} characters. Check console for full prompt.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Error', `Failed to assemble context: ${error.message}`);
            }
          }}
        >
          <Text style={styles.debugButtonText}>🎯 Test NEW Context Assembler</Text>
        </TouchableOpacity>
      </ScrollView>

      {showFollowUp && renderFollowUpCard()}
      {showContactSelection && renderContactSelectionModal()}
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  fieldsContainer: {
    marginTop: 10,
    paddingBottom: 30,
  },
  fieldContainer: {
    marginBottom: 25,
  },
  fieldQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  checkboxOption: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: '45%',
    alignItems: 'center',
  },
  checkboxOptionSelected: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  checkboxOptionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  checkboxOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  sliderContainer: {
    paddingHorizontal: 10,
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e91e63',
    textAlign: 'center',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#e91e63',
    width: 20,
    height: 20,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  sendToButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 50,
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendToButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  contactsContainer: {
    marginTop: 10,
  },
  contactsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  noContactsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  contactItemSelected: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactNameSelected: {
    color: 'white',
  },
  contactType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactTypeSelected: {
    color: '#fce7f3',
  },
  contactCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCheckboxSelected: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  checkboxText: {
    color: '#e91e63',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactActionButtons: {
    marginTop: 20,
  },
  sendButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckInScreen;