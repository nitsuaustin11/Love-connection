import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import useAuthStore from '../store/authStore';

const SettingsScreen = ({ navigation }) => {
  const { user, refreshUserProfile } = useAuthStore();

  // GPT Context Settings
  const [includeAboutInfo, setIncludeAboutInfo] = useState(
    user?.appPreferences?.gptContext?.includeAboutInfo ?? true
  );
  const [includePersonalityTests, setIncludePersonalityTests] = useState(
    user?.appPreferences?.gptContext?.includePersonalityTests ?? true
  );
  const [includeCheckInHistory, setIncludeCheckInHistory] = useState(
    user?.appPreferences?.gptContext?.includeCheckInHistory ?? true
  );
  const [includeDemographics, setIncludeDemographics] = useState(
    user?.appPreferences?.gptContext?.includeDemographics ?? true
  );
  const [historyLength, setHistoryLength] = useState(
    user?.appPreferences?.gptContext?.historyLength || 10
  );

  // Notification Settings
  const [dailyCheckinReminders, setDailyCheckinReminders] = useState(
    user?.appPreferences?.notifications?.dailyCheckinReminders ?? true
  );
  const [messageResponses, setMessageResponses] = useState(
    user?.appPreferences?.notifications?.messageResponses ?? true
  );
  const [personalityTestReminders, setPersonalityTestReminders] = useState(
    user?.appPreferences?.notifications?.personalityTestReminders ?? false
  );

  // Privacy Settings
  const [shareEmotionData, setShareEmotionData] = useState(
    user?.appPreferences?.privacy?.shareEmotionDataWithContacts ?? true
  );
  const [allowAiLearning, setAllowAiLearning] = useState(
    user?.appPreferences?.privacy?.allowAiLearning ?? true
  );

  // UI Settings
  const [theme, setTheme] = useState(user?.appPreferences?.ui?.theme || 'light');
  const [fontSize, setFontSize] = useState(user?.appPreferences?.ui?.fontSize || 'medium');

  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { updateUserProfile } = require('../services/userProfileService');

      const updates = {
        'appPreferences.gptContext.includeAboutInfo': includeAboutInfo,
        'appPreferences.gptContext.includePersonalityTests': includePersonalityTests,
        'appPreferences.gptContext.includeCheckInHistory': includeCheckInHistory,
        'appPreferences.gptContext.includeDemographics': includeDemographics,
        'appPreferences.gptContext.historyLength': historyLength,
        'appPreferences.notifications.dailyCheckinReminders': dailyCheckinReminders,
        'appPreferences.notifications.messageResponses': messageResponses,
        'appPreferences.notifications.personalityTestReminders': personalityTestReminders,
        'appPreferences.privacy.shareEmotionDataWithContacts': shareEmotionData,
        'appPreferences.privacy.allowAiLearning': allowAiLearning,
        'appPreferences.ui.theme': theme,
        'appPreferences.ui.fontSize': fontSize,
      };

      await updateUserProfile(user.uid, updates);
      await refreshUserProfile();

      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
    setSaving(false);
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This feature will be available soon. You will be able to export all your data as a JSON file.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Coming Soon', 'Account deletion will be available soon.');
          },
        },
      ]
    );
  };

  const renderSection = (title, icon) => (
    <View style={styles.sectionHeader}>
      <Feather name={icon} size={20} color="#e91e63" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderToggle = (label, description, value, onChange) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#d1d5db', true: '#fda4af' }}
        thumbColor={value ? '#e91e63' : '#f4f3f4'}
      />
    </View>
  );

  const renderPicker = (label, value, onChange, options) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          style={styles.picker}
        >
          {options.map((option) => (
            <Picker.Item key={option.value} label={option.label} value={option.value} />
          ))}
        </Picker>
      </View>
    </View>
  );

  const renderButton = (label, icon, onPress, destructive = false) => (
    <TouchableOpacity
      style={[styles.settingButton, destructive && styles.destructiveButton]}
      onPress={onPress}
    >
      <Feather name={icon} size={18} color={destructive ? '#ef4444' : '#666'} />
      <Text style={[styles.settingButtonText, destructive && styles.destructiveText]}>
        {label}
      </Text>
      <Feather name="chevron-right" size={18} color={destructive ? '#ef4444' : '#999'} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* GPT Context Settings */}
        <View style={styles.section}>
          {renderSection('GPT Context', 'message-circle')}
          <View style={styles.card}>
            {renderToggle(
              'Include About Info',
              'Send your description, five words, and interests to AI',
              includeAboutInfo,
              setIncludeAboutInfo
            )}
            {renderToggle(
              'Include Personality Tests',
              'Send MBTI, Six Human Needs, and Love Languages results',
              includePersonalityTests,
              setIncludePersonalityTests
            )}
            {renderToggle(
              'Include Check-in History',
              'Send past emotional check-ins for context',
              includeCheckInHistory,
              setIncludeCheckInHistory
            )}
            {renderToggle(
              'Include Demographics',
              'Send age range and gender information',
              includeDemographics,
              setIncludeDemographics
            )}
            {renderPicker(
              'History Length',
              historyLength,
              setHistoryLength,
              [
                { label: 'Last 5 check-ins', value: 5 },
                { label: 'Last 10 check-ins', value: 10 },
                { label: 'Last 20 check-ins', value: 20 },
                { label: 'All check-ins', value: 9999 },
              ]
            )}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          {renderSection('Notifications', 'bell')}
          <View style={styles.card}>
            {renderToggle(
              'Daily Check-in Reminders',
              'Get reminded to check in daily',
              dailyCheckinReminders,
              setDailyCheckinReminders
            )}
            {renderToggle(
              'Message Responses',
              'Notifications when AI responds to your messages',
              messageResponses,
              setMessageResponses
            )}
            {renderToggle(
              'Personality Test Reminders',
              'Get reminded to complete personality tests',
              personalityTestReminders,
              setPersonalityTestReminders
            )}
          </View>
        </View>

        {/* Privacy & Data */}
        <View style={styles.section}>
          {renderSection('Privacy & Data', 'shield')}
          <View style={styles.card}>
            {renderToggle(
              'Contacts Can View About Me',
              'Let contacts see your profile description and interests',
              user?.appPreferences?.privacy?.contactsCanViewAboutMe ?? true,
              (value) => {
                const { updateUserProfile } = require('../services/userProfileService');
                updateUserProfile(user.uid, {
                  'appPreferences.privacy.contactsCanViewAboutMe': value,
                });
                refreshUserProfile();
              }
            )}
            {renderToggle(
              'Contacts Can View Personality Tests',
              'Let contacts see your MBTI, Six Needs, and Love Languages',
              user?.appPreferences?.privacy?.contactsCanViewPersonality ?? true,
              (value) => {
                const { updateUserProfile } = require('../services/userProfileService');
                updateUserProfile(user.uid, {
                  'appPreferences.privacy.contactsCanViewPersonality': value,
                });
                refreshUserProfile();
              }
            )}
            {renderToggle(
              'Share Emotion Data',
              'Allow sharing check-ins with contacts',
              shareEmotionData,
              setShareEmotionData
            )}
            {renderToggle(
              'AI Learning',
              'Allow AI to learn from your interactions',
              allowAiLearning,
              setAllowAiLearning
            )}
            {renderButton('Export My Data', 'download', handleExportData)}
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          {renderSection('Appearance', 'eye')}
          <View style={styles.card}>
            {renderPicker(
              'Theme',
              theme,
              setTheme,
              [
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
              ]
            )}
            {renderPicker(
              'Font Size',
              fontSize,
              setFontSize,
              [
                { label: 'Small', value: 'small' },
                { label: 'Medium', value: 'medium' },
                { label: 'Large', value: 'large' },
              ]
            )}
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          {renderSection('Account', 'user')}
          <View style={styles.card}>
            {renderButton('Edit Profile', 'edit', () => navigation.navigate('CreateProfile'))}
            {renderButton('Update Email', 'mail', () => Alert.alert('Coming Soon', 'Email update will be available soon.'))}
            {renderButton('Change Password', 'lock', () => Alert.alert('Coming Soon', 'Password change will be available soon.'))}
            {renderButton('Terms & Conditions', 'file-text', () => Alert.alert('Coming Soon', 'Terms & Conditions will be available soon.'))}
            {renderButton('Delete Account', 'trash-2', handleDeleteAccount, true)}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSaveSettings}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    minWidth: 150,
  },
  picker: {
    height: 40,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  settingButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  destructiveButton: {
    borderBottomWidth: 0,
  },
  destructiveText: {
    color: '#ef4444',
  },
  saveButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
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
  bottomPadding: {
    height: 40,
  },
});

export default SettingsScreen;
