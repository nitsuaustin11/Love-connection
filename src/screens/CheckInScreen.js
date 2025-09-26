import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import useAuthStore from '../store/authStore';
import DebugConsole from '../components/DebugConsole';

const CheckInScreen = ({ navigation }) => {
  const { user } = useAuthStore();

  // Check if user has completed personality tests
  const hasPersonalityType = user?.personalityTests?.mbti?.completed || false;

  const handlePersonalityRedirect = () => {
    navigation.navigate('PersonalityTest');
  };

  const handleDebugGPTContext = () => {
    console.log('=== USER GPT CONTEXT DEBUG ===');
    console.log('Full GPT Context Object:', JSON.stringify(user?.gptMessageContext, null, 2));
    console.log('Personality Context:', user?.gptMessageContext?.personalityContext);
    console.log('Current Emotional Context:', user?.gptMessageContext?.currentEmotionalContext);
    console.log('Communication Preferences:', user?.gptMessageContext?.communicationPreferences);
    console.log('==============================');

    Alert.alert(
      'GPT Context Logged',
      'Check the console/logs for the full GPT context object',
      [{ text: 'OK' }]
    );
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
    <ScrollView style={styles.container}>
      <DebugConsole />
      <View style={styles.centeredContent}>
        <Text style={styles.title}>Check-in</Text>
        <Text style={styles.description}>
          Welcome to your emotion check-in! This is where you can track your daily emotions and wellness.
        </Text>

        {/* Future check-in functionality will go here */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Check-in features coming soon...</Text>
        </View>

        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleDebugGPTContext}
        >
          <Text style={styles.debugButtonText}>🐛 Debug GPT Context</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  placeholder: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CheckInScreen;