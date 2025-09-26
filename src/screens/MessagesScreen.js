import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import DebugConsole from '../components/DebugConsole';

const MessagesScreen = () => {
  return (
    <View style={styles.container}>
      <DebugConsole />
      <Text style={styles.title}>Messages Page</Text>
      <Text style={styles.description}>
        This is where AI therapist conversations will be displayed
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e91e63',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default MessagesScreen;