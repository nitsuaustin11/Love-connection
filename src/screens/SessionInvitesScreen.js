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
import useAuthStore from '../store/authStore';
import { getPendingInvites, acceptInvite, declineInvite } from '../services/sessionInvitationService';

const SessionInvitesScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingInviteId, setProcessingInviteId] = useState(null);

  useEffect(() => {
    loadInvites();
  }, [user]);

  // Reload when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadInvites();
    });

    return unsubscribe;
  }, [navigation]);

  const loadInvites = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const pendingInvites = await getPendingInvites(user.uid);
      setInvites(pendingInvites);
    } catch (error) {
      console.error('Error loading invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invite) => {
    if (invite.role === 'participant') {
      // Participant needs to check-in first
      Alert.alert(
        'Check-In Required',
        'You need to complete a check-in before joining as a participant. Navigate to the message thread to complete your check-in.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Thread',
            onPress: () => {
              navigation.navigate('Messages', {
                screen: 'MessageThread',
                params: {
                  threadId: invite.threadId,
                  contactName: invite.threadName,
                }
              });
            }
          }
        ]
      );
    } else {
      // Assistant can join immediately
      setProcessingInviteId(invite.inviteId);
      try {
        await acceptInvite(invite.inviteId, null); // No check-in data needed for assistant
        Alert.alert('Success', 'You have joined as an assistant!', [
          {
            text: 'OK',
            onPress: () => {
              loadInvites();
              navigation.navigate('Messages', {
                screen: 'MessageThread',
                params: {
                  threadId: invite.threadId,
                  contactName: invite.threadName,
                }
              });
            }
          }
        ]);
      } catch (error) {
        console.error('Error accepting invite:', error);
        Alert.alert('Error', 'Failed to accept invite. Please try again.');
      } finally {
        setProcessingInviteId(null);
      }
    }
  };

  const handleDecline = async (invite) => {
    Alert.alert(
      'Decline Invite',
      'Are you sure you want to decline this session invite?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingInviteId(invite.inviteId);
            try {
              await declineInvite(invite.inviteId);
              Alert.alert('Declined', 'Session invite declined');
              loadInvites();
            } catch (error) {
              console.error('Error declining invite:', error);
              Alert.alert('Error', 'Failed to decline invite. Please try again.');
            } finally {
              setProcessingInviteId(null);
            }
          }
        }
      ]
    );
  };

  const renderInvite = ({ item }) => {
    const isProcessing = processingInviteId === item.inviteId;
    const roleIcon = item.role === 'participant' ? 'users' : 'life-buoy';
    const roleColor = item.role === 'participant' ? '#e91e63' : '#0891b2';
    const roleLabel = item.role === 'participant' ? 'Participant' : 'Assistant';

    return (
      <View style={styles.inviteCard}>
        <View style={styles.inviteHeader}>
          <View style={[styles.roleIcon, { backgroundColor: `${roleColor}15` }]}>
            <Feather name={roleIcon} size={24} color={roleColor} />
          </View>
          <View style={styles.inviteInfo}>
            <Text style={styles.threadName}>{item.threadName}</Text>
            <View style={styles.roleBadge}>
              <Text style={[styles.roleText, { color: roleColor }]}>
                Join as {roleLabel}
              </Text>
            </View>
            <Text style={styles.inviteDate}>
              Invited {new Date(item.sentAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Text style={styles.inviteDescription}>
          {item.role === 'participant'
            ? 'You\'ll need to complete a check-in before joining this session'
            : 'Join immediately as an observer and supporter'}
        </Text>

        <View style={styles.inviteActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDecline(item)}
            disabled={isProcessing}
          >
            <Feather name="x" size={18} color="#ef4444" />
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.acceptButton,
              isProcessing && styles.actionButtonDisabled
            ]}
            onPress={() => handleAccept(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Feather name="check" size={18} color="white" />
                <Text style={styles.acceptButtonText}>
                  {item.role === 'participant' ? 'Check-In' : 'Accept'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Session Invites</Text>
        <View style={styles.placeholder} />
      </View>

      {invites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={64} color="#ddd" />
          <Text style={styles.emptyTitle}>No Pending Invites</Text>
          <Text style={styles.emptyDescription}>
            You don't have any session invites at the moment
          </Text>
        </View>
      ) : (
        <FlatList
          data={invites}
          renderItem={renderInvite}
          keyExtractor={(item) => item.inviteId}
          contentContainerStyle={styles.invitesList}
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
  invitesList: {
    padding: 15,
  },
  inviteCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inviteHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  inviteInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  threadName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inviteDate: {
    fontSize: 12,
    color: '#999',
  },
  inviteDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  declineButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  declineButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#e91e63',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default SessionInvitesScreen;
