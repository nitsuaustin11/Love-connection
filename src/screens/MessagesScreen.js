import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../Firebaseconfig';
import useAuthStore from '../store/authStore';
import { getUserMessageThreads } from '../services/messageThreadService';
import DebugConsole from '../components/DebugConsole';

const MessagesScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThreads();
  }, [user]);

  // Reload threads when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadThreads();
    });

    return unsubscribe;
  }, [navigation]);

  const loadThreads = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const userThreads = await getUserMessageThreads(user.uid);
      setThreads(userThreads);
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThreadPress = (thread) => {
    navigation.navigate('MessageThread', {
      threadId: thread.threadId,
      contactName: thread.contactName,
    });
  };

  const handleDeleteThread = async (thread) => {
    Alert.alert(
      'Delete Therapy Session?',
      'This will permanently delete this conversation. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from Firebase
              const threadRef = doc(db, 'messageThreads', thread.threadId);
              await deleteDoc(threadRef);

              // Refresh threads list
              await loadThreads();

              console.log('Thread deleted:', thread.threadId);
            } catch (error) {
              console.error('Error deleting thread:', error);
              Alert.alert('Error', 'Failed to delete conversation. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderThread = ({ item }) => {
    const lastMessage = item.messages?.[item.messages.length - 1];
    const lastMessagePreview = lastMessage?.content || 'No messages yet';
    const lastMessageTime = lastMessage?.timestamp
      ? new Date(lastMessage.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : '';

    return (
      <TouchableOpacity
        style={styles.threadItem}
        onPress={() => handleThreadPress(item)}
        onLongPress={() => handleDeleteThread(item)}
      >
        <View style={styles.threadAvatar}>
          <Feather name="heart" size={24} color="#e91e63" />
        </View>
        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text style={styles.threadName}>{item.contactName}</Text>
            <Text style={styles.threadTime}>{lastMessageTime}</Text>
          </View>
          <Text style={styles.threadPreview} numberOfLines={2}>
            {lastMessagePreview}
          </Text>
          <Text style={styles.threadMeta}>
            {item.messageCount} message{item.messageCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <DebugConsole />
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DebugConsole />

      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity
          style={styles.contactsButton}
          onPress={() => navigation.navigate('Profile', { screen: 'Contacts' })}
        >
          <Feather name="users" size={20} color="#e91e63" />
        </TouchableOpacity>
      </View>

      {threads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="message-circle" size={64} color="#ddd" />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyDescription}>
            Complete a check-in and send it to your AI therapist to start a conversation
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          renderItem={renderThread}
          keyExtractor={(item) => item.threadId}
          contentContainerStyle={styles.threadsList}
        />
      )}
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
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 60,
    marginBottom: 20,
    position: 'relative',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  contactsButton: {
    position: 'absolute',
    right: 20,
    padding: 8,
    backgroundColor: '#fce7f3',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  threadsList: {
    paddingHorizontal: 15,
  },
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  threadAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  threadName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  threadTime: {
    fontSize: 12,
    color: '#999',
  },
  threadPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 5,
  },
  threadMeta: {
    fontSize: 12,
    color: '#999',
  },
});

export default MessagesScreen;