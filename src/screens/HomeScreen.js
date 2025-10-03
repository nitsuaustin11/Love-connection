import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import DebugConsole from '../components/DebugConsole';
import {
  getPersonalityTestData,
  formatMbtiResult,
  formatSixHumanNeedsResult,
  formatLoveLanguagesResult,
} from '../services/personalityDataService';

const HomeScreen = ({ navigation }) => {
  const { user, signOutUser } = useAuthStore();
  const [testData, setTestData] = useState(null);

  // Fetch personality test data on mount
  useEffect(() => {
    const loadTestData = async () => {
      try {
        const data = await getPersonalityTestData();
        setTestData(data);
      } catch (error) {
        console.error('Error loading personality test data:', error);
      }
    };

    loadTestData();
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutUser();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  // Get personality results using the same format functions as detail screens
  const mbtiResults = user?.personalityTests?.mbti;
  const sixNeedsResults = user?.personalityTests?.sixHumanNeeds;
  const loveLanguagesResults = user?.personalityTests?.loveLanguages;

  const mbtiText = testData?.mbti
    ? formatMbtiResult(mbtiResults, testData.mbti)
    : 'Loading...';

  const sixNeedsText = testData?.sixHumanNeeds
    ? formatSixHumanNeedsResult(sixNeedsResults, testData.sixHumanNeeds)
    : 'Loading...';

  const loveLanguagesText = testData?.loveLanguages
    ? formatLoveLanguagesResult(loveLanguagesResults, testData.loveLanguages)
    : 'Loading...';

  return (
    <ScrollView style={styles.container}>
      <DebugConsole />

      <Text style={styles.title}>Profile</Text>

      {/* User Info Card */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            console.log('Settings pressed');
            // TODO: Navigate to settings screen
          }}
        >
          <Feather name="settings" size={24} color="#666" />
        </TouchableOpacity>

        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Feather name="user" size={40} color="#e91e63" />
          </View>
          <View style={styles.nameSection}>
            <Text style={styles.name}>{user?.firstName || 'User'} {user?.lastName || ''}</Text>
            {user?.age && <Text style={styles.age}>{user.age} years old</Text>}
          </View>
        </View>

        {/* Gender and Age Range */}
        {(user?.gender || user?.ageRange) && (
          <View style={styles.section}>
            <View style={styles.inlineInfoContainer}>
              {user?.gender && (
                <View style={styles.inlineInfoItem}>
                  <Text style={styles.inlineLabel}>GENDER:</Text>
                  <Text style={styles.inlineValue}>{user.gender}</Text>
                </View>
              )}
              {user?.ageRange && (
                <View style={styles.inlineInfoItem}>
                  <Text style={styles.inlineLabel}>AGE RANGE:</Text>
                  <Text style={styles.inlineValue}>{user.ageRange}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Interest */}
        {user?.interests && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interest</Text>
            <View style={styles.wordsContainer}>
              {user.interests.map((word, index) => (
                <View key={index} style={styles.wordBadge}>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top 5 Words */}
        {user?.fiveWords && user.fiveWords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top 5 Words</Text>
            <View style={styles.wordsContainer}>
              {user.fiveWords.map((word, index) => (
                <View key={index} style={styles.wordBadge}>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {user?.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.description}>{user.description}</Text>
          </View>
        )}
      </View>

      {/* Personality Types Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personality Profile</Text>

        {/* MBTI */}
        <View style={styles.personalityItem}>
          <View style={styles.personalityIcon}>
            <Feather name="award" size={20} color="#0891b2" />
          </View>
          <View style={styles.personalityContent}>
            <Text style={styles.personalityLabel}>MBTI Type</Text>
            <Text style={styles.personalityValue}>{mbtiText}</Text>
          </View>
        </View>

        {/* Six Human Needs */}
        <View style={styles.personalityItem}>
          <View style={styles.personalityIcon}>
            <Feather name="heart" size={20} color="#e91e63" />
          </View>
          <View style={styles.personalityContent}>
            <Text style={styles.personalityLabel}>Six Human Needs</Text>
            <Text style={styles.personalityValue}>{sixNeedsText}</Text>
          </View>
        </View>

        {/* Love Languages */}
        <View style={styles.personalityItem}>
          <View style={styles.personalityIcon}>
            <Feather name="star" size={20} color="#f59e0b" />
          </View>
          <View style={styles.personalityContent}>
            <Text style={styles.personalityLabel}>Love Languages</Text>
            <Text style={styles.personalityValue}>{loveLanguagesText}</Text>
          </View>
        </View>
      </View>

      {/* Contacts Button */}
      <TouchableOpacity
        style={styles.contactsButton}
        onPress={() => {
          navigation.navigate('Contacts');
        }}
      >
        <Feather name="users" size={20} color="white" />
        <Text style={styles.contactsButtonText}>Contacts</Text>
      </TouchableOpacity>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e91e63',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  age: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordBadge: {
    backgroundColor: '#fce7f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  wordText: {
    color: '#e91e63',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  personalityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  personalityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  personalityContent: {
    flex: 1,
  },
  personalityLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  personalityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactsButton: {
    backgroundColor: '#e91e63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    gap: 10,
  },
  contactsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e91e63',
    marginBottom: 40,
  },
  signOutText: {
    color: '#e91e63',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inlineInfoContainer: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
  },
  inlineInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  inlineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  inlineValue: {
    fontSize: 14,
    color: '#333',
  },
});

export default HomeScreen;