import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import useAuthStore from '../store/authStore';
import DebugConsole from '../components/DebugConsole';
import {
  getPersonalityTestData,
  formatMbtiResult,
  formatSixHumanNeedsResult,
  formatLoveLanguagesResult,
} from '../services/personalityDataService';

const PersonalityTestScreen = ({ navigation }) => {
  const { user, refreshUserProfile } = useAuthStore();
  const [personalityData, setPersonalityData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersonalityData();
  }, []);

  const loadPersonalityData = async () => {
    try {
      const data = await getPersonalityTestData();
      setPersonalityData(data);
    } catch (error) {
      console.error('Error loading personality data:', error);
      Alert.alert('Error', 'Failed to load personality test data');
    } finally {
      setLoading(false);
    }
  };

  const handleExternalLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open external link');
    }
  };


  const renderPersonalityCard = (testKey, testData, userResults, formatFunction) => {
    if (!testData?.Test_information) return null;

    const testInfo = testData.Test_information;
    const uiInfo = testData.Ui_information || {};
    const resultText = formatFunction(userResults, testData);

    return (
      <View key={testKey} style={[styles.card, { borderLeftColor: uiInfo.card_color || '#e91e63' }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{testInfo.test_name}</Text>
          <View style={[styles.statusIndicator, {
            backgroundColor: userResults?.completed ? '#22C55E' : '#EF4444'
          }]} />
        </View>

        <Text style={styles.cardSummary}>{testInfo.card_summary}</Text>
        <Text style={styles.completionTime}>⏱️ {testInfo.completion_time}</Text>

        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{resultText}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.takeTestButton}
            onPress={() => handleExternalLink(testInfo.test_link.url)}
          >
            <Text style={styles.takeTestButtonText}>{testInfo.test_link.button_text}</Text>
          </TouchableOpacity>

          {userResults?.completed && (
            <TouchableOpacity style={styles.updateButton}>
              <Text style={styles.updateButtonText}>Update Results</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={styles.loadingText}>Loading personality tests...</Text>
      </View>
    );
  }

  if (!personalityData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load personality tests</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPersonalityData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <DebugConsole />

      <View style={styles.header}>
        <Text style={styles.title}>Personality Tests</Text>
        <Text style={styles.subtitle}>
          Discover your unique traits and patterns
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        {renderPersonalityCard(
          'mbti',
          personalityData.mbti,
          user?.personalityTests?.mbti,
          formatMbtiResult
        )}

        {renderPersonalityCard(
          'sixHumanNeeds',
          personalityData.sixHumanNeeds,
          user?.personalityTests?.sixHumanNeeds,
          formatSixHumanNeedsResult
        )}

        {renderPersonalityCard(
          'loveLanguages',
          personalityData.loveLanguages,
          user?.personalityTests?.loveLanguages,
          formatLoveLanguagesResult
        )}
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
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e91e63',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  cardsContainer: {
    padding: 20,
    paddingTop: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  completionTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  resultContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  takeTestButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  takeTestButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  updateButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  updateButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PersonalityTestScreen;