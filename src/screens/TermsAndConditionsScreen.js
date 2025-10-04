import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';

const TermsAndConditionsScreen = ({ navigation }) => {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, refreshUserProfile } = useAuthStore();

  const handleContinue = async () => {
    if (!accepted) {
      Alert.alert('Terms Required', 'Please accept the terms and conditions to continue.');
      return;
    }

    setLoading(true);
    try {
      const { updateUserProfile } = require('../services/userProfileService');

      // Mark terms as accepted and profile as completed
      await updateUserProfile(user.uid, {
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        profileCompleted: true,
        'accountStatus.lastActiveAt': new Date().toISOString()
      });

      // Refresh the user profile to trigger navigation to main app
      await refreshUserProfile();

    } catch (error) {
      Alert.alert('Error', 'Failed to accept terms. Please try again.');
      console.error('Terms acceptance error:', error);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Terms & Conditions</Text>
        <Text style={styles.subtitle}>
          Please review and accept our terms to continue
        </Text>
      </View>

      <ScrollView style={styles.termsContainer} showsVerticalScrollIndicator={true}>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.termsText}>
          By accessing and using this application, you accept and agree to be bound by the terms
          and provision of this agreement. If you do not agree to these terms, please do not use
          this service.
        </Text>

        <Text style={styles.sectionTitle}>2. AI Therapist Disclaimer</Text>
        <Text style={styles.termsText}>
          This application provides AI-powered emotional support and wellness guidance. However,
          it is NOT a replacement for professional mental health services, therapy, or medical advice.
          {'\n\n'}
          If you are experiencing a mental health crisis, please contact a qualified mental health
          professional, your healthcare provider, or emergency services immediately.
        </Text>

        <Text style={styles.sectionTitle}>3. Privacy & Data Collection</Text>
        <Text style={styles.termsText}>
          We collect and store personal information including your name, email, personality test
          results, emotional check-ins, and conversation history. This data is used to provide
          personalized AI responses and improve your experience.
          {'\n\n'}
          Your data is stored securely and will not be shared with third parties without your consent,
          except as required by law.
        </Text>

        <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
        <Text style={styles.termsText}>
          You agree to:
          {'\n'}- Provide accurate information
          {'\n'}- Use the service responsibly and ethically
          {'\n'}- Not share sensitive or confidential information about others
          {'\n'}- Not use the service for harmful or illegal purposes
        </Text>

        <Text style={styles.sectionTitle}>5. Limitation of Liability</Text>
        <Text style={styles.termsText}>
          The creators and operators of this application are not liable for any damages or harm
          resulting from the use or inability to use this service. This includes any decisions or
          actions taken based on AI-generated advice or guidance.
        </Text>

        <Text style={styles.sectionTitle}>6. Service Availability</Text>
        <Text style={styles.termsText}>
          We strive to provide continuous service but do not guarantee uninterrupted access.
          The service may be modified, suspended, or discontinued at any time without notice.
        </Text>

        <Text style={styles.sectionTitle}>7. Changes to Terms</Text>
        <Text style={styles.termsText}>
          We reserve the right to modify these terms at any time. Continued use of the service
          after changes constitutes acceptance of the modified terms.
        </Text>

        <Text style={styles.sectionTitle}>8. Contact Information</Text>
        <Text style={styles.termsText}>
          If you have questions about these terms, please contact us at support@ittakestwo.app
        </Text>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAccepted(!accepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Feather name="check" size={18} color="white" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and accept the terms and conditions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, (!accepted || loading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!accepted || loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'Processing...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e91e63',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  termsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  termsText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    marginBottom: 15,
  },
  bottomPadding: {
    height: 20,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#e91e63',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TermsAndConditionsScreen;
