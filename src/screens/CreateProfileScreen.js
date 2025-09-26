import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import useAuthStore from '../store/authStore';
import { initializeUserProfile } from '../services/userProfileService';

const CreateProfileScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { user, refreshUserProfile } = useAuthStore();

  // Step 1: Personal Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');

  // Step 2: About You
  const [description, setDescription] = useState('');
  const [fiveWords, setFiveWords] = useState(['', '', '', '', '']);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [customInterest, setCustomInterest] = useState('');

  const [loading, setLoading] = useState(false);

  const ageRanges = [
    { label: 'Select age range', value: '' },
    { label: '18-24', value: '18-24' },
    { label: '25-34', value: '25-34' },
    { label: '35-44', value: '35-44' },
    { label: '45-54', value: '45-54' },
    { label: '55-64', value: '55-64' },
    { label: '65+', value: '65+' },
  ];

  const genderOptions = [
    { label: 'Select gender', value: '' },
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ];

  const availableInterests = [
    'Fitness & Health', 'Reading', 'Travel', 'Music', 'Art & Creativity',
    'Technology', 'Cooking', 'Sports', 'Movies & TV', 'Nature & Outdoors',
    'Photography', 'Gaming', 'Fashion', 'Learning & Education', 'Meditation & Mindfulness'
  ];

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!firstName || !lastName || !ageRange || !gender) {
          Alert.alert('Missing Information', 'Please fill in all personal information fields');
          return false;
        }
        break;
      case 2:
        if (!description) {
          Alert.alert('Missing Information', 'Please provide a description of yourself');
          return false;
        }
        if (description.length < 20) {
          Alert.alert('More Detail Needed', 'Please provide at least a brief description about yourself');
          return false;
        }
        const filledWords = fiveWords.filter(word => word.trim() !== '');
        if (filledWords.length < 5) {
          Alert.alert('Missing Information', 'Please provide all 5 words that describe you');
          return false;
        }
        if (selectedInterests.length < 3) {
          Alert.alert('Missing Information', 'Please select at least 3 interests');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    if (!validateStep(2)) return;

    setLoading(true);
    try {
      const { updateUserProfile, getUserProfile } = require('../services/userProfileService');

      // Get the current profile first
      const existingProfile = await getUserProfile(user.uid);

      // Update the profile with the new information
      const profileUpdates = {
        'profile.firstName': firstName,
        'profile.lastName': lastName,
        'profile.ageRange': ageRange,
        'profile.gender': gender,
        'profile.description': description,
        'profile.fiveWords': fiveWords.filter(word => word.trim() !== ''),
        'profile.interests': [...selectedInterests, customInterest].filter(interest => interest.trim() !== ''),
        profileCompleted: true,
        'accountStatus.lastActiveAt': new Date().toISOString()
      };

      await updateUserProfile(user.uid, profileUpdates);

      // Refresh the user profile in the auth store
      await refreshUserProfile();

      Alert.alert(
        'Profile Created!',
        'Welcome to LoveConnect! Your wellness journey starts now.',
        [{ text: 'Get Started', onPress: () => {
          // The navigation will be handled automatically by the App.js routing logic
          // since the user state has been refreshed with profileCompleted: true
        }}]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
      console.error('Profile creation error:', error);
    }
    setLoading(false);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Setup?',
      'You can complete this later, but a complete profile helps us provide better support.',
      [
        { text: 'Complete Now', style: 'cancel' },
        { text: 'Skip for Now', onPress: async () => {
          try {
            // Create minimal profile to allow app access
            await initializeUserProfile(user, null, { profileCompleted: true });
            // Navigation will be handled automatically by auth state change
          } catch (error) {
            Alert.alert('Error', 'Failed to skip profile setup. Please try again.');
            console.error('Skip profile error:', error);
          }
        }}
      ]
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>Help us get to know you better</Text>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={ageRange}
          onValueChange={setAgeRange}
          style={styles.picker}
        >
          {ageRanges.map((range) => (
            <Picker.Item key={range.value} label={range.label} value={range.value} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={gender}
          onValueChange={setGender}
          style={styles.picker}
        >
          {genderOptions.map((option) => (
            <Picker.Item key={option.value} label={option.label} value={option.value} />
          ))}
        </Picker>
      </View>
    </View>
  );

  const handleInterestToggle = (interest) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(item => item !== interest);
      } else {
        return [...prev, interest];
      }
    });
  };

  const handleAddCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests(prev => [...prev, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>About You</Text>
      <Text style={styles.stepDescription}>Tell us more about yourself</Text>

      <Text style={styles.label}>Describe yourself</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Tell us about yourself..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Five words that describe you</Text>
      {fiveWords.map((word, index) => (
        <TextInput
          key={index}
          style={styles.input}
          placeholder={`Word ${index + 1}`}
          value={word}
          onChangeText={(text) => {
            const newWords = [...fiveWords];
            newWords[index] = text;
            setFiveWords(newWords);
          }}
          autoCapitalize="words"
        />
      ))}

      <Text style={styles.label}>Interests (select at least 3)</Text>
      <View style={styles.interestsContainer}>
        {availableInterests.map((interest) => (
          <TouchableOpacity
            key={interest}
            style={[
              styles.interestItem,
              selectedInterests.includes(interest) && styles.interestItemSelected
            ]}
            onPress={() => handleInterestToggle(interest)}
          >
            <Text style={[
              styles.interestText,
              selectedInterests.includes(interest) && styles.interestTextSelected
            ]}>
              {interest}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.customInterestContainer}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 10 }]}
          placeholder="Add custom interest"
          value={customInterest}
          onChangeText={setCustomInterest}
          autoCapitalize="words"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCustomInterest}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / 2) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Step {currentStep} of 2</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          {renderProgressBar()}
        </View>

        <View style={styles.form}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}

          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            {currentStep < 2 ? (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.completeButton, loading && styles.buttonDisabled]}
                onPress={handleComplete}
                disabled={loading}
              >
                <Text style={styles.completeButtonText}>
                  {loading ? 'Creating Profile...' : 'Complete Profile'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e91e63',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e91e63',
    borderRadius: 3,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  form: {
    padding: 20,
    paddingTop: 0,
  },
  stepContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e91e63',
  },
  backButtonText: {
    color: '#e91e63',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  skipButton: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  interestItem: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  interestItemSelected: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  interestText: {
    fontSize: 14,
    color: '#333',
  },
  interestTextSelected: {
    color: 'white',
  },
  customInterestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CreateProfileScreen;