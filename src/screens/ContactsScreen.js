import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import DebugConsole from '../components/DebugConsole';

const ContactsScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [incomingCount, setIncomingCount] = useState(0);

  useEffect(() => {
    loadContacts();
  }, [user]);

  // Reload contacts when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadContacts();
    });

    return unsubscribe;
  }, [navigation]);

  const loadContacts = () => {
    if (user?.contacts) {
      console.log('Loading contacts:', user.contacts.length);
      setContacts(user.contacts);
    } else {
      console.log('No contacts found');
      setContacts([]);
    }

    // Load pending outgoing requests
    const outgoing = user?.contactRequests?.outgoing || [];
    setPendingRequests(outgoing.filter(r => r.status === 'pending'));

    // Count incoming requests
    const incoming = user?.contactRequests?.incoming || [];
    setIncomingCount(incoming.filter(r => r.status === 'pending').length);
  };

  const handleContactPress = (contact) => {
    // Navigate to contact details/settings screen
    if (contact.type === 'ai_therapist' || contact.type === 'ai') {
      // Navigate to AI Therapist settings
      navigation.navigate('EditAITherapist', {
        contact: contact,
      });
    } else {
      // Navigate to user contact detail screen
      navigation.navigate('ContactDetail', {
        contact: contact,
      });
    }
  };

  const renderContact = ({ item }) => {
    // Determine icon and label based on type
    const isAI = item.type === 'ai_therapist' || item.type === 'ai';
    const iconName = isAI ? 'cpu' : 'user';
    const typeLabel = isAI ? 'AI Therapist' : 'Contact';

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleContactPress(item)}
      >
        <View style={styles.contactAvatar}>
          <Feather
            name={iconName}
            size={24}
            color="#e91e63"
          />
        </View>
        <View style={styles.contactContent}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactType}>{typeLabel}</Text>
          {item.gptSettings && (
            <Text style={styles.contactMeta}>
              {Object.keys(item.gptSettings).length} custom settings
            </Text>
          )}
        </View>
        <Feather name="chevron-right" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <DebugConsole />

      <View style={styles.headerContainer}>
        <Text style={styles.title}>Contacts</Text>
        {incomingCount > 0 && (
          <TouchableOpacity
            style={styles.requestsButton}
            onPress={() => navigation.navigate('ContactRequests')}
          >
            <Feather name="inbox" size={20} color="#e91e63" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{incomingCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => {
            navigation.navigate('AddAITherapist');
          }}
        >
          <Text style={styles.floatingButtonText}>Add AI +</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => {
            navigation.navigate('AddContact');
          }}
        >
          <Text style={styles.floatingButtonText}>Add Contact +</Text>
        </TouchableOpacity>
      </View>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <View style={styles.pendingSection}>
          <Text style={styles.pendingSectionTitle}>Pending Requests</Text>
          {pendingRequests.map((request) => (
            <View key={request.id} style={styles.pendingItem}>
              <View style={styles.pendingAvatar}>
                <Feather name="clock" size={20} color="#f59e0b" />
              </View>
              <View style={styles.pendingContent}>
                <Text style={styles.pendingName}>{request.nickname}</Text>
                <Text style={styles.pendingStatus}>Waiting for {request.targetName} to accept</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="users" size={64} color="#ddd" />
          <Text style={styles.emptyTitle}>No contacts yet</Text>
          <Text style={styles.emptyDescription}>
            Add AI assistants or contacts to start conversations
          </Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contactsList}
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    marginBottom: 20,
    paddingHorizontal: 20,
    position: 'relative',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  requestsButton: {
    position: 'absolute',
    right: 20,
    padding: 8,
    backgroundColor: '#fce7f3',
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fce7f3',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  floatingButtonContainer: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    gap: 10,
  },
  floatingButton: {
    flex: 1,
    backgroundColor: '#e91e63',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
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
  contactsList: {
    paddingHorizontal: 15,
    paddingTop: 70,
  },
  contactItem: {
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
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactContent: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  contactType: {
    fontSize: 14,
    color: '#666',
  },
  contactMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  pendingSection: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 15,
    marginTop: 70,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  pendingSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  pendingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pendingContent: {
    flex: 1,
  },
  pendingName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  pendingStatus: {
    fontSize: 13,
    color: '#92400e',
  },
});

export default ContactsScreen;
