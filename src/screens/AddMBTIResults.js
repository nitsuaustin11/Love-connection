import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import useAuthStore from '../store/authStore';
import { updateUserProfile } from '../services/userProfileService';
import DebugConsole from '../components/DebugConsole';

const AddMBTIResults = ({ navigation, route }) => {
  const { user, refreshUserProfile } = useAuthStore();
  const { testData } = route.params;
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);

  const mbtiTypes = testData?.Test_information?.types_of_results || [];

  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  const generateGPTContext = (selectedResult) => {
    return selectedResult?.result_Gpt_context || `My Results from the MBTI personality test are: ${selectedResult?.result_name}: '${selectedResult?.result_title}', general info: summary: ${selectedResult?.result_summary}, description: ${selectedResult?.result_description} I want you to conceptualize my personality using these results, research accurate MBTI result information to understand me more precisely: and provide me information that could be useful based on my current experience, which I will provide you below:`;
  };

  const handleSaveResults = async () => {
    if (!selectedType) {
      Alert.alert('Please Select a Type', 'Choose your MBTI personality type before saving.');
      return;
    }

    try {
      setLoading(true);

      const gptContext = generateGPTContext(selectedType);

      const updates = {
        'personalityTests.mbti.completed': true,
        'personalityTests.mbti.completedAt': new Date().toISOString(),
        'personalityTests.mbti.selectedType': selectedType.result_name,
        'personalityTests.mbti.results': {
          type: selectedType.result_name,
          title: selectedType.result_title,
          summary: selectedType.result_summary,
          description: selectedType.result_description,
        },
        'gptMessageContext.personalityContext.mbti': gptContext,
        'gptMessageContext.lastUpdated': new Date().toISOString(),
      };

      await updateUserProfile(user.uid, updates);
      await refreshUserProfile();

      Alert.alert(
        'Results Saved!',
        `Your MBTI type: ${selectedType.result_name} - ${selectedType.result_title}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving results:', error);
      Alert.alert('Error', 'Failed to save your results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <DebugConsole />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Add Your MBTI Results</Text>
        <Text style={styles.subtitle}>
          Select your personality type from the 16 MBTI types below
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>
            After taking the MBTI assessment, find your 4-letter personality type below and select it. Each type represents a unique combination of psychological preferences.
          </Text>
        </View>

        <View style={styles.typesGrid}>
          {mbtiTypes.map((type) => (
            <TouchableOpacity
              key={type.result_name}
              style={[
                styles.typeCard,
                selectedType?.result_name === type.result_name && styles.typeCardSelected
              ]}
              onPress={() => handleTypeSelect(type)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.typeCode,
                selectedType?.result_name === type.result_name && styles.typeCodeSelected
              ]}>
                {type.result_name}
              </Text>
              <Text style={[
                styles.typeTitle,
                selectedType?.result_name === type.result_name && styles.typeTitleSelected
              ]}>
                {type.result_title}
              </Text>
              <Text style={[
                styles.typeSummary,
                selectedType?.result_name === type.result_name && styles.typeSummarySelected
              ]}>
                {type.result_summary}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedType && (
          <View style={styles.selectedTypeCard}>
            <Text style={styles.selectedTypeTitle}>Selected Type</Text>
            <Text style={styles.selectedTypeCode}>{selectedType.result_name}</Text>
            <Text style={styles.selectedTypeSubtitle}>{selectedType.result_title}</Text>
            <Text style={styles.selectedTypeDescription}>{selectedType.result_description}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!selectedType || loading) && styles.saveButtonDisabled
          ]}
          onPress={handleSaveResults}
          disabled={!selectedType || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Results</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: '#e91e63',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#e91e63',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  typeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    minHeight: 120,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  typeCardSelected: {
    borderColor: '#e91e63',
    backgroundColor: '#fdf2f8',
  },
  typeCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  typeCodeSelected: {
    color: '#e91e63',
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  typeTitleSelected: {
    color: '#be185d',
  },
  typeSummary: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  typeSummarySelected: {
    color: '#831843',
  },
  selectedTypeCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  selectedTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0369a1',
    marginBottom: 8,
  },
  selectedTypeCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  selectedTypeSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 12,
  },
  selectedTypeDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddMBTIResults;