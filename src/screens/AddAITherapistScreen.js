import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import { loadAllContexts } from '../services/contextAssembler';

const AddAITherapistScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [therapistName, setTherapistName] = useState('');
  const [contextSettings, setContextSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [settings, setSettings] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const contexts = await loadAllContexts();

      // Extract settings from all contexts
      const allSettings = {
        general: contexts.generalSystem?.settings || {},
        personality: contexts.personalityInstructions?.settings || {},
        emotion: contexts.emotionInstructions?.settings || {},
        history: contexts.messageHistoryInstructions?.settings || {},
        format: contexts.responseFormats?.settings || {},
      };

      setContextSettings(allSettings);

      // Initialize settings with defaults
      const defaultSettings = {};
      Object.entries(allSettings).forEach(([category, categorySettings]) => {
        Object.entries(categorySettings).forEach(([key, config]) => {
          if (key.startsWith('_')) return; // Skip comments
          defaultSettings[key] = config.default;
        });
      });

      setSettings(defaultSettings);
      setLoading(false);
    } catch (error) {
      console.error('Error loading context settings:', error);
      Alert.alert('Error', 'Failed to load settings');
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!therapistName.trim()) {
      Alert.alert('Required', 'Please enter a therapist name');
      return;
    }

    try {
      const { updateUserProfile } = require('../services/userProfileService');

      // Create new therapist contact
      const newTherapist = {
        id: `therapist_${Date.now()}`,
        name: therapistName.trim(),
        type: 'ai_therapist',
        isActive: true,
        canReceiveEmotionUpdates: true,
        gptSettings: settings,
        addedAt: new Date().toISOString(),
      };

      // Add to contacts array
      const currentContacts = user?.contacts || [];
      const updatedContacts = [...currentContacts, newTherapist];

      console.log('Creating new therapist:', newTherapist.name);
      console.log('Total contacts after add:', updatedContacts.length);

      // Save to Firebase
      await updateUserProfile(user.uid, {
        contacts: updatedContacts,
      });

      // Refresh user profile in store
      const { refreshUserProfile } = useAuthStore.getState();
      await refreshUserProfile();

      console.log('Therapist saved successfully');

      Alert.alert('Success', 'AI Therapist created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating therapist:', error);
      Alert.alert('Error', 'Failed to create AI Therapist');
    }
  };

  const renderSetting = (key, config) => {
    if (config.type === 'boolean') {
      return (
        <View key={key} style={styles.settingItem}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingTitle}>{config.label}</Text>
            <Text style={styles.settingDescription}>{config.description}</Text>
          </View>
          <Switch
            value={settings[key]}
            onValueChange={(value) => handleSettingChange(key, value)}
            trackColor={{ false: '#ccc', true: '#f8bbd0' }}
            thumbColor={settings[key] ? '#e91e63' : '#f4f3f4'}
          />
        </View>
      );
    }

    if (config.type === 'select') {
      return (
        <View key={key} style={styles.settingItem}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingTitle}>{config.label}</Text>
            <Text style={styles.settingDescription}>{config.description}</Text>
          </View>
          <View style={styles.selectContainer}>
            {config.options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.selectOption,
                  settings[key] === option && styles.selectOptionActive,
                ]}
                onPress={() => handleSettingChange(key, option)}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    settings[key] === option && styles.selectOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return null;
  };

  const renderSection = (title, categoryKey, categorySettings) => {
    if (!categorySettings || Object.keys(categorySettings).length === 0) return null;

    return (
      <View style={styles.section} key={categoryKey}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {Object.entries(categorySettings).map(([key, config]) => {
          if (key.startsWith('_')) return null; // Skip comments
          return renderSetting(key, config);
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#e91e63" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create AI Therapist</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Name Input */}
        <View style={styles.nameSection}>
          <Text style={styles.nameLabel}>Therapist Name</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g., Supportive Coach, Analytical Guide"
            value={therapistName}
            onChangeText={setTherapistName}
            placeholderTextColor="#999"
          />
        </View>

        {/* Settings Sections */}
        {contextSettings && (
          <>
            {renderSection('General Settings', 'general', contextSettings.general)}
            {renderSection('Personality Analysis', 'personality', contextSettings.personality)}
            {renderSection('Emotion Handling', 'emotion', contextSettings.emotion)}
            {renderSection('Conversation History', 'history', contextSettings.history)}
            {renderSection('Response Format', 'format', contextSettings.format)}
          </>
        )}

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Create AI Therapist</Text>
        </TouchableOpacity>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  nameSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  nameLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 15,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    marginBottom: 10,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: 'white',
  },
  selectOptionActive: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  selectOptionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  selectOptionTextActive: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#e91e63',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddAITherapistScreen;
