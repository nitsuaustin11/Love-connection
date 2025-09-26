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
import Slider from '@react-native-community/slider';
import useAuthStore from '../store/authStore';
import { updateUserProfile } from '../services/userProfileService';
import DebugConsole from '../components/DebugConsole';

const AddLoveLanguagesResults = ({ navigation, route }) => {
  const { user, refreshUserProfile } = useAuthStore();
  const { testData } = route.params;
  const [loading, setLoading] = useState(false);

  const loveLanguages = [
    { key: 'quality_time', title: 'Quality Time', description: 'Values focused attention and presence' },
    { key: 'words_of_affirmation', title: 'Words of Affirmation', description: 'Appreciates verbal and written encouragement' },
    { key: 'acts_of_service', title: 'Acts of Service', description: 'Values helpful actions and thoughtful gestures' },
    { key: 'physical_touch', title: 'Physical Touch', description: 'Values appropriate physical connection' },
    { key: 'receiving_gifts', title: 'Receiving Gifts', description: 'Appreciates thoughtful tokens of affection' },
  ];

  const [languageScores, setLanguageScores] = useState({
    quality_time: 50,
    words_of_affirmation: 50,
    acts_of_service: 50,
    physical_touch: 50,
    receiving_gifts: 50,
  });

  const handleSliderChange = (languageKey, value) => {
    setLanguageScores(prev => ({
      ...prev,
      [languageKey]: Math.round(value)
    }));
  };

  const calculateTopTwoLanguages = () => {
    const sortedLanguages = Object.entries(languageScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    return {
      primary: { language: sortedLanguages[0][0], percentage: sortedLanguages[0][1] },
      secondary: { language: sortedLanguages[1][0], percentage: sortedLanguages[1][1] }
    };
  };

  const generateGPTContext = () => {
    const { primary, secondary } = calculateTopTwoLanguages();
    const primaryLanguageInfo = testData?.Test_information?.types_of_results?.find(
      result => result.result_name === primary.language
    );
    const secondaryLanguageInfo = testData?.Test_information?.types_of_results?.find(
      result => result.result_name === secondary.language
    );

    return {
      summary: `Primary: ${primaryLanguageInfo?.result_title} (${primary.percentage}%), Secondary: ${secondaryLanguageInfo?.result_title} (${secondary.percentage}%)`,
      context: `My Results from the Love Languages personality test are: Primary Love Language: ${primaryLanguageInfo?.result_title} (${primary.percentage}%) - ${primaryLanguageInfo?.result_description}. Secondary Love Language: ${secondaryLanguageInfo?.result_title} (${secondary.percentage}%) - ${secondaryLanguageInfo?.result_description}. I want you to conceptualize my personality using these results, research accurate Love Languages result information to understand me more precisely: and provide me information that could be useful based on my current experience, which I will provide you below:`
    };
  };

  const handleSaveResults = async () => {
    try {
      setLoading(true);

      const topTwo = calculateTopTwoLanguages();
      const gptContext = generateGPTContext();

      const updates = {
        'personalityTests.loveLanguages.completed': true,
        'personalityTests.loveLanguages.completedAt': new Date().toISOString(),
        'personalityTests.loveLanguages.results': languageScores,
        'personalityTests.loveLanguages.topTwo': topTwo,
        'gptMessageContext.personalityContext.loveLanguages': gptContext.context,
        'gptMessageContext.lastUpdated': new Date().toISOString(),
      };

      await updateUserProfile(user.uid, updates);
      await refreshUserProfile();

      Alert.alert(
        'Results Saved!',
        `Your top love languages are:\n1. ${topTwo.primary.language.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (${topTwo.primary.percentage}%)\n2. ${topTwo.secondary.language.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (${topTwo.secondary.percentage}%)`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving results:', error);
      Alert.alert('Error', 'Failed to save your results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPercentage = Object.values(languageScores).reduce((sum, score) => sum + score, 0);
  const averagePercentage = Math.round(totalPercentage / 5);

  return (
    <ScrollView style={styles.container}>
      <DebugConsole />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Add Your Love Languages Results</Text>
        <Text style={styles.subtitle}>
          Use the sliders to indicate how much each love language resonates with you (0-100%)
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>
            Reflect on how you prefer to receive and express love, then adjust each slider to represent how important that love language is to you. The percentages don't need to add up to 100%.
          </Text>
          <Text style={styles.averageText}>Current average: {averagePercentage}%</Text>
        </View>

        {loveLanguages.map((language) => (
          <View key={language.key} style={styles.languageCard}>
            <View style={styles.languageHeader}>
              <Text style={styles.languageTitle}>{language.title}</Text>
              <Text style={styles.languagePercentage}>{languageScores[language.key]}%</Text>
            </View>
            <Text style={styles.languageDescription}>{language.description}</Text>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>0%</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={languageScores[language.key]}
                onValueChange={(value) => handleSliderChange(language.key, value)}
                minimumTrackTintColor="#e91e63"
                maximumTrackTintColor="#ddd"
                thumbStyle={styles.sliderThumb}
                trackStyle={styles.sliderTrack}
              />
              <Text style={styles.sliderLabel}>100%</Text>
            </View>
          </View>
        ))}

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Your Top Two Love Languages Preview</Text>
          {(() => {
            const topTwo = calculateTopTwoLanguages();
            return (
              <>
                <Text style={styles.previewLanguage}>
                  1. {topTwo.primary.language.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ({topTwo.primary.percentage}%)
                </Text>
                <Text style={styles.previewLanguage}>
                  2. {topTwo.secondary.language.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ({topTwo.secondary.percentage}%)
                </Text>
              </>
            );
          })()}
          <Text style={styles.previewNote}>
            These will be used to personalize your AI interactions
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveResults}
          disabled={loading}
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
    marginBottom: 12,
  },
  averageText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  languageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  languageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  languageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  languagePercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e91e63',
    minWidth: 50,
    textAlign: 'right',
  },
  languageDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#999',
    minWidth: 30,
    textAlign: 'center',
  },
  sliderThumb: {
    backgroundColor: '#e91e63',
    width: 20,
    height: 20,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
  },
  previewCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0369a1',
    marginBottom: 12,
  },
  previewLanguage: {
    fontSize: 16,
    color: '#0c4a6e',
    marginBottom: 4,
    fontWeight: '600',
  },
  previewNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
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

export default AddLoveLanguagesResults;