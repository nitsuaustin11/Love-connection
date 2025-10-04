import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../Firebaseconfig';

const AddContactScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [relationship, setRelationship] = useState('');
  const [participantRole, setParticipantRole] = useState('participant');
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter the contact\'s email');
      return;
    }

    if (!nickname.trim()) {
      Alert.alert('Required', 'Please enter a nickname for this contact');
      return;
    }

    if (!relationship.trim()) {
      Alert.alert('Required', 'Please describe your relationship');
      return;
    }

    // Check if trying to add themselves
    if (email.toLowerCase().trim() === user.email.toLowerCase()) {
      Alert.alert('Error', 'You cannot add yourself as a contact');
      return;
    }

    setLoading(true);
    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert('Not Found', 'No user found with that email address');
        setLoading(false);
        return;
      }

      const targetUser = snapshot.docs[0].data();
      const targetUserId = snapshot.docs[0].id;

      // Check if already contacts
      const isAlreadyContact = user?.contacts?.some(c => c.id === targetUserId);
      if (isAlreadyContact) {
        Alert.alert('Already Connected', 'This user is already in your contacts');
        setLoading(false);
        return;
      }

      // Check if request already sent
      const alreadySent = user?.contactRequests?.outgoing?.some(r => r.targetUserId === targetUserId);
      if (alreadySent) {
        Alert.alert('Request Pending', 'You already sent a request to this user');
        setLoading(false);
        return;
      }

      const { updateUserProfile } = require('../services/userProfileService');

      // Create outgoing request for current user
      const outgoingRequest = {
        id: `request_${Date.now()}`,
        targetUserId: targetUserId,
        targetEmail: targetUser.email,
        targetName: `${targetUser.profile?.firstName || ''} ${targetUser.profile?.lastName || ''}`.trim() || 'User',
        nickname: nickname.trim(),
        relationship: relationship.trim(),
        participantRole: participantRole,
        status: 'pending',
        sentAt: new Date().toISOString(),
      };

      // Create incoming request for target user
      const incomingRequest = {
        id: outgoingRequest.id,
        fromUserId: user.uid,
        fromEmail: user.email,
        fromName: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'User',
        nickname: nickname.trim(),
        relationship: relationship.trim(),
        participantRole: participantRole,
        status: 'pending',
        receivedAt: new Date().toISOString(),
      };

      // Update current user's outgoing requests
      const currentOutgoing = user?.contactRequests?.outgoing || [];
      await updateUserProfile(user.uid, {
        'contactRequests.outgoing': [...currentOutgoing, outgoingRequest],
      });

      // Update target user's incoming requests
      const targetIncoming = targetUser?.contactRequests?.incoming || [];
      await updateUserProfile(targetUserId, {
        'contactRequests.incoming': [...targetIncoming, incomingRequest],
      });

      // Refresh user profile
      const { refreshUserProfile } = useAuthStore.getState();
      await refreshUserProfile();

      Alert.alert('Success', 'Contact request sent successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error sending contact request:', error);
      Alert.alert('Error', 'Failed to send contact request. Please try again.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Contact</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Feather name="info" size={20} color="#0891b2" />
          <Text style={styles.infoText}>
            Send a contact request to another user. They'll need to accept before you can share check-ins.
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Contact's Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter their email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Nickname (How you'll see them)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Best Friend, Mom, Partner"
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Relationship</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Friend, Family, Partner"
            value={relationship}
            onChangeText={setRelationship}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Therapy Session Role</Text>
          <Text style={styles.roleHint}>
            How will this person participate in therapy sessions?
          </Text>

          <TouchableOpacity
            style={[styles.roleOption, participantRole === 'participant' && styles.roleOptionSelected]}
            onPress={() => setParticipantRole('participant')}
          >
            <View style={styles.roleIconContainer}>
              <Feather
                name="users"
                size={24}
                color={participantRole === 'participant' ? '#e91e63' : '#666'}
              />
            </View>
            <View style={styles.roleContent}>
              <Text style={[
                styles.roleTitle,
                participantRole === 'participant' && styles.roleTextSelected
              ]}>
                Participant
              </Text>
              <Text style={styles.roleSubtext}>
                Active participant - must check-in before joining
              </Text>
            </View>
            {participantRole === 'participant' && (
              <Feather name="check-circle" size={24} color="#e91e63" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleOption, participantRole === 'assistant' && styles.roleOptionSelected]}
            onPress={() => setParticipantRole('assistant')}
          >
            <View style={styles.roleIconContainer}>
              <Feather
                name="life-buoy"
                size={24}
                color={participantRole === 'assistant' ? '#0891b2' : '#666'}
              />
            </View>
            <View style={styles.roleContent}>
              <Text style={[
                styles.roleTitle,
                participantRole === 'assistant' && styles.roleTextSelected
              ]}>
                Assistant
              </Text>
              <Text style={styles.roleSubtext}>
                Observer & supporter - joins immediately
              </Text>
            </View>
            {participantRole === 'assistant' && (
              <Feather name="check-circle" size={24} color="#0891b2" />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, loading && styles.buttonDisabled]}
          onPress={handleSendRequest}
          disabled={loading}
        >
          <Feather name="send" size={18} color="white" />
          <Text style={styles.sendButtonText}>
            {loading ? 'Sending Request...' : 'Send Request'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#ecfeff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0e7490',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#e91e63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  roleHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  roleOptionSelected: {
    borderColor: '#e91e63',
    backgroundColor: '#fce7f3',
  },
  roleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roleTextSelected: {
    color: '#e91e63',
  },
  roleSubtext: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default AddContactScreen;
