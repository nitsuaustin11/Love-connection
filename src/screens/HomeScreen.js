import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import useAuthStore from '../store/authStore';
import DebugConsole from '../components/DebugConsole';

const HomeScreen = () => {
  const { user, signOutUser } = useAuthStore();

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

  return (
    <View style={styles.container}>
      <DebugConsole />
      <Text style={styles.title}>Welcome to LoveConnect!</Text>
      <Text style={styles.subtitle}>
        Hello, {user?.name || user?.email}!
      </Text>

      <View style={styles.content}>
        <Text style={styles.description}>
          Your self-help and emotional wellness journey starts here. Use the tabs below to explore your personality, check in with your emotions, and get support from our AI therapist.
        </Text>

        <Text style={styles.instructionText}>
          • Tap "Personality" to take personality assessments
        </Text>
        <Text style={styles.instructionText}>
          • Tap "Check-in" to log your emotions
        </Text>
        <Text style={styles.instructionText}>
          • Tap "Messages" to chat with your AI therapist
        </Text>
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  instructionText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'left',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  signOutButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e91e63',
    marginBottom: 20,
  },
  signOutText: {
    color: '#e91e63',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;