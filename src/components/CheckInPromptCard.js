import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import { getFieldsForMode, generateCheckInContext } from '../services/checkInFieldsService';
import { acceptInvite, updateParticipantStatus } from '../services/sessionInvitationService';

const CheckInPromptCard = ({ inviteId, threadId, userId, onComplete }) => {
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [checkInFields, setCheckInFields] = useState({});
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(true);

  const availableEmotions = [
    "Anger",
    "Loneliness",
    "Frustration",
    "Shame",
    "Fear",
    "Sadness/Grief",
    "Guilt",
    "Hopeless"
  ];

  useEffect(() => {
    loadCheckInFields();
  }, []);

  const loadCheckInFields = async () => {
    try {
      setFieldsLoading(true);
      // Use basic mode for inline check-ins
      const fields = await getFieldsForMode('basic');
      setCheckInFields(fields);
    } catch (error) {
      console.error('Error loading check-in fields:', error);
    } finally {
      setFieldsLoading(false);
    }
  };

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
              numberOfLines={3}
            />
          </View>
        );

      default:
        return null;
    }
  };

  const handleJoinSession = async () => {
    if (!selectedEmotion) {
      Alert.alert('Required', 'Please select an emotion before joining');
      return;
    }

    setLoading(true);
    try {
      // Generate check-in context
      const checkInContext = await generateCheckInContext(responses, selectedEmotion);

      // Prepare check-in data
      const checkInData = {
        emotion: selectedEmotion,
        responses: responses,
        context: checkInContext,
        timestamp: new Date().toISOString()
      };

      if (inviteId) {
        // Accept the invite with check-in data
        await acceptInvite(inviteId, checkInData);
      } else {
        // Update participant status from pending_checkin to active
        await updateParticipantStatus(threadId, userId, 'active', checkInData);
      }

      Alert.alert('Success', 'You have joined the session!', [
        { text: 'OK', onPress: () => onComplete && onComplete() }
      ]);
    } catch (error) {
      console.error('Error joining session:', error);
      Alert.alert('Error', 'Failed to join session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fieldsLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading check-in...</Text>
      </View>
    );
  }

  const basicFields = checkInFields.basic || {};
  const basicFieldKeys = Object.keys(basicFields).sort((a, b) => {
    const orderA = basicFields[a]?.order || 999;
    const orderB = basicFields[b]?.order || 999;
    return orderA - orderB;
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Feather name="clipboard" size={24} color="#e91e63" />
        <Text style={styles.title}>Complete Check-In to Join</Text>
      </View>

      <Text style={styles.description}>
        Complete a quick emotional check-in to participate in this session
      </Text>

      {/* Emotion Selection */}
      <View style={styles.emotionSection}>
        <Text style={styles.sectionTitle}>How are you feeling?</Text>
        <View style={styles.emotionsGrid}>
          {availableEmotions.map(emotion => (
            <TouchableOpacity
              key={emotion}
              style={[
                styles.emotionButton,
                selectedEmotion === emotion && styles.emotionButtonSelected
              ]}
              onPress={() => setSelectedEmotion(emotion)}
            >
              <Text style={[
                styles.emotionButtonText,
                selectedEmotion === emotion && styles.emotionButtonTextSelected
              ]}>
                {emotion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Check-in Questions */}
      {selectedEmotion && (
        <View style={styles.questionsSection}>
          <Text style={styles.sectionTitle}>Tell us more</Text>
          {basicFieldKeys.map(fieldKey => renderField(fieldKey, basicFields[fieldKey]))}
        </View>
      )}

      {/* Join Button */}
      <TouchableOpacity
        style={[styles.joinButton, (!selectedEmotion || loading) && styles.joinButtonDisabled]}
        onPress={handleJoinSession}
        disabled={!selectedEmotion || loading}
      >
        <Feather name="log-in" size={20} color="white" />
        <Text style={styles.joinButtonText}>
          {loading ? 'Joining...' : 'Join Session'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef3c7',
    padding: 20,
    borderRadius: 15,
    margin: 15,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400e',
  },
  description: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 20,
    lineHeight: 20,
  },
  emotionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionButton: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fde68a',
  },
  emotionButtonSelected: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  emotionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#92400e',
  },
  emotionButtonTextSelected: {
    color: 'white',
  },
  questionsSection: {
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkboxOption: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  checkboxOptionSelected: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  checkboxOptionText: {
    fontSize: 14,
    color: '#92400e',
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
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#92400e',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#fde68a',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  joinButton: {
    backgroundColor: '#e91e63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 10,
    marginBottom: 20,
    gap: 10,
  },
  joinButtonDisabled: {
    backgroundColor: '#ccc',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckInPromptCard;
