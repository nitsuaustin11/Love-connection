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
import { formatMbtiResult } from '../services/personalityDataService';

const MBTIDetailScreen = ({ navigation, route }) => {
  const { user } = useAuthStore();
  const { testData } = route.params;

  const testInfo = testData?.Test_information;
  const uiInfo = testData?.Ui_information || {};
  const userResults = user?.personalityTests?.mbti;
  const resultText = formatMbtiResult(userResults, testData);

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
    navigation.navigate('AddMBTIResults', { testData });
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
          <Text style={styles.sectionTitle}>About This Test</Text>
          <Text style={styles.description}>{testInfo.test_description}</Text>
          <Text style={styles.completionTime}>⏱️ Estimated time: {testInfo.completion_time}</Text>
        </View>

        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Your Results</Text>
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>{resultText}</Text>
          </View>

          {userResults?.completed && userResults?.selectedType && (
            <View style={styles.detailedResult}>
              {testInfo.types_of_results?.find(type => type.result_name === userResults.selectedType) && (
                <>
                  <Text style={styles.resultTitle}>
                    {testInfo.types_of_results.find(type => type.result_name === userResults.selectedType).result_title}
                  </Text>
                  <Text style={styles.resultDescription}>
                    {testInfo.types_of_results.find(type => type.result_name === userResults.selectedType).result_description}
                  </Text>
                </>
              )}
            </View>
          )}
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
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
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

export default MBTIDetailScreen;