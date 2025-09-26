import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import useAuthStore from '../store/authStore';

const DebugConsole = () => {
  const { user, refreshUserProfile } = useAuthStore();
  const [showDebugConsole, setShowDebugConsole] = useState(false);

  const toggleDebugConsole = () => {
    setShowDebugConsole(!showDebugConsole);
  };

  const handleToggleAuth = () => {
    Alert.alert('Debug', 'Auth state toggle would sign out user');
  };

  const handleToggleProfile = async () => {
    try {
      const { updateUserProfile } = require('../services/userProfileService');
      const newStatus = !user?.profileCompleted;

      await updateUserProfile(user.uid, {
        profileCompleted: newStatus
      });

      await refreshUserProfile();
      Alert.alert('Debug', `Profile completed status: ${newStatus}`);
    } catch (error) {
      Alert.alert('Debug Error', 'Failed to toggle profile status');
    }
  };

  const handleTogglePersonality = async () => {
    try {
      const { updateUserProfile } = require('../services/userProfileService');
      const newStatus = !user?.personalityTests?.mbti?.completed;

      await updateUserProfile(user.uid, {
        'personalityTests.mbti.completed': newStatus,
        'personalityTests.mbti.selectedType': newStatus ? 'INTJ' : null,
        'personalityTests.mbti.completedAt': newStatus ? new Date().toISOString() : null
      });

      await refreshUserProfile();
      Alert.alert('Debug', `Personality test completed: ${newStatus}`);
    } catch (error) {
      Alert.alert('Debug Error', 'Failed to toggle personality status');
    }
  };

  const handleToggleSixNeeds = async () => {
    try {
      const { updateUserProfile } = require('../services/userProfileService');
      const newStatus = !user?.personalityTests?.sixHumanNeeds?.completed;

      const mockResults = newStatus ? {
        growth: 35,
        love_connection: 25,
        certainty: 15,
        variety: 10,
        significance: 10,
        contribution: 5
      } : null;

      await updateUserProfile(user.uid, {
        'personalityTests.sixHumanNeeds.completed': newStatus,
        'personalityTests.sixHumanNeeds.results': mockResults,
        'personalityTests.sixHumanNeeds.completedAt': newStatus ? new Date().toISOString() : null
      });

      await refreshUserProfile();
      Alert.alert('Debug', `Six Human Needs completed: ${newStatus}`);
    } catch (error) {
      Alert.alert('Debug Error', 'Failed to toggle six needs status');
    }
  };

  const handleToggleLoveLanguages = async () => {
    try {
      const { updateUserProfile } = require('../services/userProfileService');
      const newStatus = !user?.personalityTests?.loveLanguages?.completed;

      const mockResults = newStatus ? {
        quality_time: 30,
        words_of_affirmation: 25,
        acts_of_service: 20,
        physical_touch: 15,
        receiving_gifts: 10
      } : null;

      await updateUserProfile(user.uid, {
        'personalityTests.loveLanguages.completed': newStatus,
        'personalityTests.loveLanguages.results': mockResults,
        'personalityTests.loveLanguages.completedAt': newStatus ? new Date().toISOString() : null
      });

      await refreshUserProfile();
      Alert.alert('Debug', `Love Languages completed: ${newStatus}`);
    } catch (error) {
      Alert.alert('Debug Error', 'Failed to toggle love languages status');
    }
  };

  const renderDebugConsole = () => (
    <View style={styles.debugConsole}>
      <Text style={styles.debugTitle}>Debug Console</Text>
      <Text style={styles.debugInfo}>Current States:</Text>
      <Text style={styles.debugState}>Auth: {user ? 'Logged In' : 'Logged Out'}</Text>
      <Text style={styles.debugState}>Profile: {user?.profileCompleted ? 'Completed' : 'Incomplete'}</Text>
      <Text style={styles.debugState}>MBTI: {user?.personalityTests?.mbti?.completed ? 'Completed' : 'Not Completed'}</Text>
      <Text style={styles.debugState}>Six Needs: {user?.personalityTests?.sixHumanNeeds?.completed ? 'Completed' : 'Not Completed'}</Text>
      <Text style={styles.debugState}>Love Languages: {user?.personalityTests?.loveLanguages?.completed ? 'Completed' : 'Not Completed'}</Text>

      <View style={styles.debugButtons}>
        <TouchableOpacity style={styles.debugButton} onPress={handleToggleAuth}>
          <Text style={styles.debugButtonText}>Toggle Auth</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.debugButton} onPress={handleToggleProfile}>
          <Text style={styles.debugButtonText}>Toggle Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.debugButton} onPress={handleTogglePersonality}>
          <Text style={styles.debugButtonText}>Toggle MBTI</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.debugButton} onPress={handleToggleSixNeeds}>
          <Text style={styles.debugButtonText}>Toggle Six Needs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.debugButton} onPress={handleToggleLoveLanguages}>
          <Text style={styles.debugButtonText}>Toggle Love Languages</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.debugToggle}
        onPress={toggleDebugConsole}
      >
        <Text style={styles.debugToggleText}>
          {showDebugConsole ? '🐛 Hide Debug' : '🐛 Debug Console'}
        </Text>
      </TouchableOpacity>

      {showDebugConsole && renderDebugConsole()}
    </>
  );
};

const styles = StyleSheet.create({
  debugToggle: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    zIndex: 1000,
  },
  debugToggleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  debugConsole: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    marginTop: 10,
  },
  debugTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugInfo: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  debugState: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  debugButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
  },
  debugButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    margin: 2,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default DebugConsole;