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
import { Feather } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import { initializeUserProfile } from '../services/userProfileService';

const CreateProfileScreen = ({ navigation }) => {
  const { user, refreshUserProfile } = useAuthStore();

  // Initialize with existing user data
  const [firstName, setFirstName] = useState(user?.profile?.firstName || '');
  const [lastName, setLastName] = useState(user?.profile?.lastName || '');
  const [ageRange, setAgeRange] = useState(user?.profile?.ageRange || '');
  const [gender, setGender] = useState(user?.profile?.gender || '');
  const [description, setDescription] = useState(user?.profile?.description || '');
  const [fiveWords, setFiveWords] = useState(
    user?.profile?.fiveWords?.length === 5
      ? user.profile.fiveWords
      : ['', '', '', '', '']
  );
  const [selectedInterests, setSelectedInterests] = useState(user?.profile?.interests || []);
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

  const validateProfile = () => {
    if (!firstName || !lastName || !ageRange || !gender) {
      Alert.alert('Missing Information', 'Please fill in all personal information fields');
      return false;
    }
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
    return true;
  };

  const handleComplete = async () => {
    if (!validateProfile()) return;

    setLoading(true);
    try {
      const { updateUserProfile } = require('../services/userProfileService');

      // Update the profile with the new information
      const profileUpdates = {
        'profile.firstName': firstName,
        'profile.lastName': lastName,
        'profile.ageRange': ageRange,
        'profile.gender': gender,
        'profile.description': description,
        'profile.fiveWords': fiveWords.filter(word => word.trim() !== ''),
        'profile.interests': [...selectedInterests, customInterest].filter(interest => interest.trim() !== ''),
        'accountStatus.lastActiveAt': new Date().toISOString()
      };

      await updateUserProfile(user.uid, profileUpdates);

      // Refresh the user profile in the auth store
      await refreshUserProfile();

      // Navigate back to profile
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

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


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Complete Your Profile</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.stepContainer}>
            {/* Personal Information Section */}
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Age Range</Text>
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

            <Text style={styles.label}>Gender</Text>
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

            {/* About You Section */}
            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>About You</Text>

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
                style={[styles.input, { flex: 1, marginRight: 10, marginBottom: 0 }]}
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

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving Profile...' : 'Save Profile'}
              </Text>
            </TouchableOpacity>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  form: {
    padding: 20,
    paddingTop: 0,
  },
  stepContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 20,
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
  saveButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
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