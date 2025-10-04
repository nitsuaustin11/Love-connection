import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';

const ContactRequestsScreen = ({ navigation }) => {
  const { user, refreshUserProfile } = useAuthStore();
  const [incomingRequests, setIncomingRequests] = useState([]);

  useEffect(() => {
    loadRequests();
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadRequests();
    });
    return unsubscribe;
  }, [navigation]);

  const loadRequests = () => {
    const requests = user?.contactRequests?.incoming || [];
    setIncomingRequests(requests.filter(r => r.status === 'pending'));
  };

  const handleAccept = async (request) => {
    try {
      const { updateUserProfile, getUserProfile } = require('../services/userProfileService');

      // Get the other user's profile
      const otherUserProfile = await getUserProfile(request.fromUserId);

      // Create contact for current user
      const newContact = {
        id: request.fromUserId,
        name: request.nickname,
        type: 'user',
        email: request.fromEmail,
        relationship: request.relationship,
        isActive: true,
        canReceiveEmotionUpdates: true,
        addedAt: new Date().toISOString(),
      };

      // Find the outgoing request from the other user
      const otherUserOutgoing = otherUserProfile?.contactRequests?.outgoing || [];
      const matchingOutgoing = otherUserOutgoing.find(r => r.id === request.id);

      // Create contact for other user (using their nickname for current user)
      const reciprocalContact = {
        id: user.uid,
        name: matchingOutgoing?.nickname || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'User',
        type: 'user',
        email: user.email,
        relationship: matchingOutgoing?.relationship || 'Contact',
        isActive: true,
        canReceiveEmotionUpdates: true,
        addedAt: new Date().toISOString(),
      };

      // Update current user: add contact, remove incoming request
      const currentContacts = user?.contacts || [];
      const currentIncoming = user?.contactRequests?.incoming || [];
      await updateUserProfile(user.uid, {
        contacts: [...currentContacts, newContact],
        'contactRequests.incoming': currentIncoming.filter(r => r.id !== request.id),
      });

      // Update other user: add contact, update outgoing request status
      const otherContacts = otherUserProfile?.contacts || [];
      await updateUserProfile(request.fromUserId, {
        contacts: [...otherContacts, reciprocalContact],
        'contactRequests.outgoing': otherUserOutgoing.map(r =>
          r.id === request.id ? { ...r, status: 'accepted' } : r
        ),
      });

      await refreshUserProfile();

      Alert.alert('Success', `You're now connected with ${request.nickname}!`);
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    }
  };

  const handleDecline = async (request) => {
    Alert.alert(
      'Decline Request',
      `Are you sure you want to decline the request from ${request.fromName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const { updateUserProfile, getUserProfile } = require('../services/userProfileService');

              // Remove from current user's incoming
              const currentIncoming = user?.contactRequests?.incoming || [];
              await updateUserProfile(user.uid, {
                'contactRequests.incoming': currentIncoming.filter(r => r.id !== request.id),
              });

              // Update other user's outgoing request status
              const otherUserProfile = await getUserProfile(request.fromUserId);
              const otherUserOutgoing = otherUserProfile?.contactRequests?.outgoing || [];
              await updateUserProfile(request.fromUserId, {
                'contactRequests.outgoing': otherUserOutgoing.map(r =>
                  r.id === request.id ? { ...r, status: 'declined' } : r
                ),
              });

              await refreshUserProfile();

              Alert.alert('Declined', 'Contact request declined');
            } catch (error) {
              console.error('Error declining request:', error);
              Alert.alert('Error', 'Failed to decline request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderRequest = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestAvatar}>
        <Feather name="user" size={24} color="#e91e63" />
      </View>
      <View style={styles.requestContent}>
        <Text style={styles.requestName}>{item.fromName}</Text>
        <Text style={styles.requestNickname}>Wants to be saved as: {item.nickname}</Text>
        <Text style={styles.requestRelationship}>Relationship: {item.relationship}</Text>
        <Text style={styles.requestEmail}>{item.fromEmail}</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAccept(item)}
        >
          <Feather name="check" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleDecline(item)}
        >
          <Feather name="x" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Requests</Text>
        <View style={styles.placeholder} />
      </View>

      {incomingRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={64} color="#ddd" />
          <Text style={styles.emptyTitle}>No pending requests</Text>
          <Text style={styles.emptyDescription}>
            You'll see contact requests from other users here
          </Text>
        </View>
      ) : (
        <FlatList
          data={incomingRequests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.requestsList}
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
  requestsList: {
    padding: 15,
  },
  requestItem: {
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
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  requestContent: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  requestNickname: {
    fontSize: 14,
    color: '#e91e63',
    marginBottom: 2,
  },
  requestRelationship: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  requestEmail: {
    fontSize: 12,
    color: '#999',
  },
  requestActions: {
    flexDirection: 'column',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10b981',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#ef4444',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ContactRequestsScreen;
