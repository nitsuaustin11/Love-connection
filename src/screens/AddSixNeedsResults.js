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

const AddSixNeedsResults = ({ navigation, route }) => {
  const { user, refreshUserProfile } = useAuthStore();
  const { testData } = route.params;
  const [loading, setLoading] = useState(false);

  const sixNeeds = [
    { key: 'growth', title: 'Growth', description: 'Driven by continuous improvement and expansion' },
    { key: 'love_connection', title: 'Love & Connection', description: 'Motivated by relationships and belonging' },
    { key: 'certainty', title: 'Certainty', description: 'Seeks security, stability, and predictability' },
    { key: 'variety', title: 'Variety', description: 'Craves novelty, excitement, and change' },
    { key: 'significance', title: 'Significance', description: 'Motivated by recognition and unique contribution' },
    { key: 'contribution', title: 'Contribution', description: 'Driven by service and making a difference' },
  ];

  const [needsScores, setNeedsScores] = useState({
    growth: 50,
    love_connection: 50,
    certainty: 50,
    variety: 50,
    significance: 50,
    contribution: 50,
  });

  const handleSliderChange = (needKey, value) => {
    setNeedsScores(prev => ({
      ...prev,
      [needKey]: Math.round(value)
    }));
  };

  const calculateTopTwoNeeds = () => {
    const sortedNeeds = Object.entries(needsScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    return {
      primary: { need: sortedNeeds[0][0], percentage: sortedNeeds[0][1] },
      secondary: { need: sortedNeeds[1][0], percentage: sortedNeeds[1][1] }
    };
  };

  const generateGPTContext = () => {
    const { primary, secondary } = calculateTopTwoNeeds();
    const primaryNeedInfo = testData?.Test_information?.types_of_results?.find(
      result => result.result_name === primary.need
    );
    const secondaryNeedInfo = testData?.Test_information?.types_of_results?.find(
      result => result.result_name === secondary.need
    );

    return {
      summary: `Primary: ${primaryNeedInfo?.result_title} (${primary.percentage}%), Secondary: ${secondaryNeedInfo?.result_title} (${secondary.percentage}%)`,
      context: `My Results from the Six Human Needs personality test are: Primary Need: ${primaryNeedInfo?.result_title} (${primary.percentage}%) - ${primaryNeedInfo?.result_description}. Secondary Need: ${secondaryNeedInfo?.result_title} (${secondary.percentage}%) - ${secondaryNeedInfo?.result_description}. I want you to conceptualize my personality using these results, research accurate Six Human Needs result information to understand me more precisely: and provide me information that could be useful based on my current experience, which I will provide you below:`
    };
  };

  const handleSaveResults = async () => {
    try {
      setLoading(true);

      const topTwo = calculateTopTwoNeeds();
      const gptContext = generateGPTContext();

      const updates = {
        'personalityTests.sixHumanNeeds.completed': true,
        'personalityTests.sixHumanNeeds.completedAt': new Date().toISOString(),
        'personalityTests.sixHumanNeeds.results': needsScores,
        'personalityTests.sixHumanNeeds.topTwo': topTwo,
        'gptMessageContext.personalityContext.sixHumanNeeds': gptContext.context,
        'gptMessageContext.lastUpdated': new Date().toISOString(),
      };

      await updateUserProfile(user.uid, updates);
      await refreshUserProfile();

      Alert.alert(
        'Results Saved!',
        `Your top needs are:\n1. ${topTwo.primary.need.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (${topTwo.primary.percentage}%)\n2. ${topTwo.secondary.need.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (${topTwo.secondary.percentage}%)`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving results:', error);
      Alert.alert('Error', 'Failed to save your results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPercentage = Object.values(needsScores).reduce((sum, score) => sum + score, 0);
  const averagePercentage = Math.round(totalPercentage / 6);

  return (
    <ScrollView style={styles.container}>
      <DebugConsole />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Add Your Six Human Needs Results</Text>
        <Text style={styles.subtitle}>
          Use the sliders to indicate how much each need drives your behavior (0-100%)
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>
            Reflect on your motivations and adjust each slider to represent how much that need drives your decisions and behavior. The percentages don't need to add up to 100%.
          </Text>
          <Text style={styles.averageText}>Current average: {averagePercentage}%</Text>
        </View>

        {sixNeeds.map((need) => (
          <View key={need.key} style={styles.needCard}>
            <View style={styles.needHeader}>
              <Text style={styles.needTitle}>{need.title}</Text>
              <Text style={styles.needPercentage}>{needsScores[need.key]}%</Text>
            </View>
            <Text style={styles.needDescription}>{need.description}</Text>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>0%</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={needsScores[need.key]}
                onValueChange={(value) => handleSliderChange(need.key, value)}
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
          <Text style={styles.previewTitle}>Your Top Two Needs Preview</Text>
          {(() => {
            const topTwo = calculateTopTwoNeeds();
            return (
              <>
                <Text style={styles.previewNeed}>
                  1. {topTwo.primary.need.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ({topTwo.primary.percentage}%)
                </Text>
                <Text style={styles.previewNeed}>
                  2. {topTwo.secondary.need.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ({topTwo.secondary.percentage}%)
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
  needCard: {
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
  needHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  needTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  needPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e91e63',
    minWidth: 50,
    textAlign: 'right',
  },
  needDescription: {
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
  previewNeed: {
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

export default AddSixNeedsResults;