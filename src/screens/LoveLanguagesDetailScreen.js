import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import useAuthStore from '../store/authStore';
import DebugConsole from '../components/DebugConsole';
import { formatLoveLanguagesResult } from '../services/personalityDataService';

const LoveLanguagesDetailScreen = ({ navigation, route }) => {
  const { user } = useAuthStore();
  const { testData } = route.params;

  const testInfo = testData?.Test_information;
  const uiInfo = testData?.Ui_information || {};
  const userResults = user?.personalityTests?.loveLanguages;
  const resultText = formatLoveLanguagesResult(userResults, testData);

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

  const handleAddResults = () => {
    navigation.navigate('AddLoveLanguagesResults', { testData });
  };

  const renderDetailedResults = () => {
    if (!userResults?.completed || !userResults?.results) return null;

    const sortedResults = Object.entries(userResults.results)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Show top 3

    return (
      <View style={styles.detailedResult}>
        <Text style={styles.resultTitle}>Your Love Languages</Text>
        {sortedResults.map(([language, percentage], index) => {
          const languageInfo = testInfo.types_of_results?.find(
            result => result.result_name === language
          );

          return (
            <View key={language} style={styles.languageItem}>
              <View style={styles.languageHeader}>
                <Text style={styles.languageRank}>#{index + 1}</Text>
                <Text style={styles.languageName}>
                  {language.split('_').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Text>
                <Text style={styles.languagePercentage}>{percentage}%</Text>
              </View>
              {languageInfo && (
                <Text style={styles.languageDescription}>{languageInfo.result_description}</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  if (!testInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Test data not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <DebugConsole />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{testInfo.test_name}</Text>
          <View style={[styles.statusIndicator, {
            backgroundColor: userResults?.completed ? '#22C55E' : '#EF4444'
          }]} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>About This Assessment</Text>
          <Text style={styles.description}>{testInfo.test_description}</Text>
          <Text style={styles.completionTime}>⏱️ Estimated time: {testInfo.completion_time}</Text>
        </View>

        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Your Results</Text>
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>{resultText}</Text>
          </View>

          {renderDetailedResults()}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.takeTestButton}
            onPress={() => handleExternalLink(testInfo.test_link.url)}
          >
            <Text style={styles.takeTestButtonText}>{testInfo.test_link.button_text}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addResultsButton}
            onPress={handleAddResults}
          >
            <Text style={styles.addResultsButtonText}>+ Add Your Results</Text>
          </TouchableOpacity>
        </View>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 12,
  },
  completionTime: {
    fontSize: 14,
    color: '#999',
  },
  resultSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  resultContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  detailedResult: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 16,
  },
  languageItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  languageRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e91e63',
    marginRight: 12,
    minWidth: 24,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  languagePercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  languageDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 36,
  },
  actionsSection: {
    gap: 12,
  },
  takeTestButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  takeTestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addResultsButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e91e63',
  },
  addResultsButtonText: {
    color: '#e91e63',
    fontSize: 16,
    fontWeight: '600',
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
});

export default LoveLanguagesDetailScreen;