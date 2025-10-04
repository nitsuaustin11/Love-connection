import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import { getUserProfile } from '../services/userProfileService';
import {
  formatMbtiResult,
  formatSixHumanNeedsResult,
  formatLoveLanguagesResult,
} from '../services/personalityDataService';

const ContactDetailScreen = ({ route, navigation }) => {
  const { contact } = route.params;
  const { user } = useAuthStore();
  const [contactProfile, setContactProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContactProfile();
  }, []);

  const loadContactProfile = async () => {
    try {
      const profile = await getUserProfile(contact.id);
      setContactProfile(profile);
    } catch (error) {
      console.error('Error loading contact profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const canViewAboutMe = contactProfile?.appPreferences?.privacy?.contactsCanViewAboutMe ?? true;
  const canViewPersonality = contactProfile?.appPreferences?.privacy?.contactsCanViewPersonality ?? true;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Contact Info Card */}
        <View style={styles.card}>
          <View style={styles.avatarCircle}>
            <Feather name="user" size={40} color="#e91e63" />
          </View>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.contactEmail}>{contact.email}</Text>
          <View style={styles.relationshipBadge}>
            <Text style={styles.relationshipText}>{contact.relationship}</Text>
          </View>
        </View>

        {/* About Me Section */}
        {canViewAboutMe ? (
          <>
            {contactProfile?.profile?.description && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>About Me</Text>
                <Text style={styles.description}>{contactProfile.profile.description}</Text>
              </View>
            )}

            {contactProfile?.profile?.fiveWords && contactProfile.profile.fiveWords.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Five Words</Text>
                <View style={styles.wordsContainer}>
                  {contactProfile.profile.fiveWords.map((word, index) => (
                    <View key={index} style={styles.wordBadge}>
                      <Text style={styles.wordText}>{word}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {contactProfile?.profile?.interests && contactProfile.profile.interests.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <View style={styles.wordsContainer}>
                  {contactProfile.profile.interests.map((interest, index) => (
                    <View key={index} style={styles.wordBadge}>
                      <Text style={styles.wordText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {(contactProfile?.profile?.gender || contactProfile?.profile?.ageRange) && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Demographics</Text>
                <View style={styles.infoRow}>
                  {contactProfile.profile.gender && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Gender:</Text>
                      <Text style={styles.infoValue}>{contactProfile.profile.gender}</Text>
                    </View>
                  )}
                  {contactProfile.profile.ageRange && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Age Range:</Text>
                      <Text style={styles.infoValue}>{contactProfile.profile.ageRange}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.privacyCard}>
            <Feather name="lock" size={32} color="#999" />
            <Text style={styles.privacyTitle}>Profile Information Hidden</Text>
            <Text style={styles.privacyDescription}>
              This user has chosen not to share their profile information with contacts.
            </Text>
          </View>
        )}

        {/* Personality Tests Section */}
        {canViewPersonality ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personality Profile</Text>

            {contactProfile?.personalityTests?.mbti?.completed && (
              <View style={styles.personalityItem}>
                <View style={styles.personalityIcon}>
                  <Feather name="award" size={20} color="#0891b2" />
                </View>
                <View style={styles.personalityContent}>
                  <Text style={styles.personalityLabel}>MBTI Type</Text>
                  <Text style={styles.personalityValue}>
                    {contactProfile.personalityTests.mbti.selectedType || 'Not set'}
                  </Text>
                </View>
              </View>
            )}

            {contactProfile?.personalityTests?.sixHumanNeeds?.completed && (
              <View style={styles.personalityItem}>
                <View style={styles.personalityIcon}>
                  <Feather name="heart" size={20} color="#e91e63" />
                </View>
                <View style={styles.personalityContent}>
                  <Text style={styles.personalityLabel}>Six Human Needs</Text>
                  <Text style={styles.personalityValue}>
                    {contactProfile.personalityTests.sixHumanNeeds.results?.primary || 'Not completed'}
                  </Text>
                </View>
              </View>
            )}

            {contactProfile?.personalityTests?.loveLanguages?.completed && (
              <View style={styles.personalityItem}>
                <View style={styles.personalityIcon}>
                  <Feather name="star" size={20} color="#f59e0b" />
                </View>
                <View style={styles.personalityContent}>
                  <Text style={styles.personalityLabel}>Love Languages</Text>
                  <Text style={styles.personalityValue}>
                    {contactProfile.personalityTests.loveLanguages.results?.primary || 'Not completed'}
                  </Text>
                </View>
              </View>
            )}

            {!contactProfile?.personalityTests?.mbti?.completed &&
              !contactProfile?.personalityTests?.sixHumanNeeds?.completed &&
              !contactProfile?.personalityTests?.loveLanguages?.completed && (
                <Text style={styles.emptyText}>No personality tests completed yet</Text>
              )}
          </View>
        ) : (
          <View style={styles.privacyCard}>
            <Feather name="lock" size={32} color="#999" />
            <Text style={styles.privacyTitle}>Personality Tests Hidden</Text>
            <Text style={styles.privacyDescription}>
              This user has chosen not to share their personality test results with contacts.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  contactName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  contactEmail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  relationshipBadge: {
    backgroundColor: '#fce7f3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  relationshipText: {
    color: '#e91e63',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
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
  infoRow: {
    flexDirection: 'row',
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
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
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  privacyCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    margin: 15,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
  },
  privacyDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ContactDetailScreen;
