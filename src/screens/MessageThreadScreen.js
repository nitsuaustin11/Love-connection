import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import {
  getMessageThread,
  addMessageToThread,
  checkAndUpdateSummary,
} from '../services/messageThreadService';
import { getUserProfile } from '../services/userProfileService';
import CheckInPromptCard from '../components/CheckInPromptCard';

const MessageThread = ({ route, navigation }) => {
  const { threadId, contactName } = route.params;
  const { user } = useAuthStore();

  // Thread and message state
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // User profiles cache - maps userId to user profile data
  const [userProfiles, setUserProfiles] = useState({});
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Participants dropdown state
  const [showParticipantsDropdown, setShowParticipantsDropdown] = useState(false);

  const flatListRef = useRef(null);
  const [inputText, setInputText] = useState('');

  // Load thread data on mount
  useEffect(() => {
    loadThread();
  }, [threadId]);

  // Load user profiles when thread participants or invites change
  useEffect(() => {
    if (thread?.participants || thread?.pendingInvites) {
      loadParticipantProfiles();
    }
  }, [thread?.participants, thread?.pendingInvites]);

  /**
   * Load thread data from Firebase
   */
  const loadThread = async () => {
    try {
      setLoading(true);
      const threadData = await getMessageThread(threadId);
      if (threadData) {
        setThread(threadData);
        setMessages(threadData.messages || []);
        console.log('Thread loaded:', {
          threadId: threadData.threadId,
          sessionType: threadData.sessionType,
          participantCount: threadData.participants?.length || 0,
          messageCount: threadData.messages?.length || 0,
        });
      }
    } catch (error) {
      console.error('Error loading thread:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load user profiles for all participants and invited users in the thread
   * This ensures we have display names and other user data
   */
  const loadParticipantProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const participants = thread.participants || [];
      const pendingInvites = thread.pendingInvites || [];
      const profilesCache = {};

      // Collect all unique user IDs from both participants and invites
      const participantUserIds = participants.map(p => p.userId);
      const invitedUserIds = pendingInvites.map(inv => inv.targetUserId);
      const uniqueUserIds = [...new Set([...participantUserIds, ...invitedUserIds])];

      console.log('Loading profiles for participants and invited users:', uniqueUserIds);

      for (const userId of uniqueUserIds) {
        try {
          const profile = await getUserProfile(userId);
          if (profile) {
            profilesCache[userId] = profile;
            console.log(`Loaded profile for ${userId}:`, {
              firstName: profile.firstName,
              lastName: profile.lastName,
              displayName: profile.displayName,
            });
          }
        } catch (error) {
          console.error(`Error loading profile for user ${userId}:`, error);
          // Add placeholder if profile fails to load
          profilesCache[userId] = {
            firstName: 'User',
            lastName: userId.substring(0, 6),
            displayName: `User ${userId.substring(0, 6)}`,
          };
        }
      }

      setUserProfiles(profilesCache);
      console.log('All participant profiles loaded:', Object.keys(profilesCache));
    } catch (error) {
      console.error('Error loading participant profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  /**
   * Check if current user needs to complete check-in
   */
  const userParticipant = thread?.participants?.find(p => p.userId === user?.uid);
  const isPendingCheckin = userParticipant?.status === 'pending_checkin';
  const userPendingInvite = thread?.pendingInvites?.find(
    inv => inv.targetUserId === user?.uid && inv.status === 'pending' && inv.role === 'participant'
  );
  const needsCheckin = isPendingCheckin || userPendingInvite;

  /**
   * Handle check-in completion - reload thread data
   */
  const handleCheckInComplete = () => {
    loadThread();
  };

  /**
   * Send a message to the thread
   * Message inherits sender's userId for proper identification
   */
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessageContent = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      // Add user message with proper sender userId
      const userMessage = await addMessageToThread(threadId, {
        sender: user.uid, // Critical: Use actual user ID, not 'user' string
        content: userMessageContent,
      });

      console.log('Message sent:', {
        sender: userMessage.sender,
        content: userMessage.content.substring(0, 50),
        timestamp: userMessage.timestamp,
      });

      // Update local state immediately for responsiveness
      setMessages(prev => [...prev, userMessage]);

      // Add loading message placeholder
      const loadingMessageId = `loading_${Date.now()}`;
      const loadingMessage = {
        id: loadingMessageId,
        sender: 'ai',
        content: 'Loading GPT Response...',
        timestamp: new Date().toISOString(),
        isLoading: true, // Flag to identify loading messages
      };

      setMessages(prev => [...prev, loadingMessage]);
      setSending(false);

      // TODO: Generate AI response (placeholder for now)
      setTimeout(async () => {
        const aiMessage = await addMessageToThread(threadId, {
          sender: 'ai',
          content: 'This is a demo AI response. Integration with GPT coming soon.',
        });

        // Replace loading message with actual AI response
        setMessages(prev => prev.map(msg =>
          msg.id === loadingMessageId ? aiMessage : msg
        ));

        // Check if summary needs updating (every 5 messages)
        await checkAndUpdateSummary(threadId);
      }, 2000);

    } catch (error) {
      console.error('Error sending message:', error);
      setSending(false);
    }
  };

  /**
   * Get display name for a user
   * Returns formatted name from profile data, or falls back to userId
   */
  const getUserDisplayName = (userId) => {
    // Handle current user
    if (userId === user?.uid) {
      return 'You';
    }

    // Get from profiles cache
    const profile = userProfiles[userId];
    if (profile) {
      // Try displayName first, then firstName, then fallback
      return profile.displayName || profile.firstName || `User ${userId.substring(0, 6)}`;
    }

    // Fallback if profile not loaded
    return `User ${userId.substring(0, 6)}`;
  };

  /**
   * Render individual message with proper styling and sender info
   */
  const renderMessage = ({ item }) => {
    const isAI = item.sender === 'ai';
    const isCurrentUser = item.sender === user?.uid;

    // Check if this is a multi-participant thread
    const hasMultipleParticipants = (thread?.participants?.length || 0) >= 2;
    const isMultiParticipantThread = thread?.sessionType === 'public' || hasMultipleParticipants;

    // Get sender information
    let senderName = null;
    let senderProfile = null;

    if (!isAI) {
      senderName = getUserDisplayName(item.sender);
      senderProfile = userProfiles[item.sender];

      console.log('Rendering message:', {
        sender: item.sender,
        senderName,
        hasProfile: !!senderProfile,
        isCurrentUser,
        isMultiParticipantThread,
      });
    }

    // Determine message styling based on sender
    const isOwnMessage = isCurrentUser;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage
          ? styles.userMessageContainer
          : (isMultiParticipantThread && !isAI
              ? styles.otherUserMessageContainer
              : styles.aiMessageContainer)
      ]}>
        {/* Show sender name for human messages in multi-participant threads */}
        {isMultiParticipantThread && !isAI && senderName && (
          <Text style={[
            styles.senderName,
            isOwnMessage ? styles.senderNameRight : styles.senderNameLeft
          ]}>
            {senderName}
          </Text>
        )}

        {/* Message bubble */}
        <View style={[
          styles.messageBubble,
          isOwnMessage
            ? styles.userMessageBubble
            : (isMultiParticipantThread && !isAI
                ? styles.otherUserMessageBubble
                : styles.aiMessageBubble),
          item.isLoading && styles.loadingMessageBubble
        ]}>
          {item.isLoading && (
            <ActivityIndicator
              size="small"
              color="#e91e63"
              style={styles.loadingIndicator}
            />
          )}

          <Text style={[
            styles.messageText,
            isOwnMessage
              ? styles.userMessageText
              : (isMultiParticipantThread && !isAI
                  ? styles.otherUserMessageText
                  : styles.aiMessageText),
            item.isLoading && styles.loadingMessageText
          ]}>
            {item.content}
          </Text>

          <Text style={[
            styles.timestamp,
            isOwnMessage ? styles.userTimestamp : styles.aiTimestamp
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
    );
  };

  /**
   * Render participants modal for multi-user sessions
   */
  const renderParticipantsModal = () => {
    if (!thread?.participants || thread.participants.length === 0) {
      return null;
    }

    const participants = thread.participants || [];
    const pendingInvites = thread.pendingInvites || [];

    // Calculate counts
    const activeCount = participants.filter(p => p.status === 'active').length;
    const pendingCheckinCount = participants.filter(p => p.status === 'pending_checkin').length;
    const invitedCount = pendingInvites.filter(inv => inv.status === 'pending').length;
    const totalPendingCount = pendingCheckinCount + invitedCount;

    // Combine participants and pending invites for display
    const displayList = [
      // Active participants
      ...participants.map(p => ({ type: 'participant', data: p })),
      // Pending invites
      ...pendingInvites
        .filter(inv => inv.status === 'pending')
        .map(inv => ({ type: 'invite', data: inv }))
    ];

    return (
      <Modal
        visible={showParticipantsDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowParticipantsDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Participants</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowParticipantsDropdown(false)}
              >
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Participant Count */}
            <Text style={styles.participantCount}>
              {activeCount} active • {totalPendingCount} pending
            </Text>

            {/* Participants List */}
            <ScrollView style={styles.participantsList}>
              {displayList.map((item, index) => {
                if (item.type === 'participant') {
                  // Existing participant
                  const participant = item.data;
                  const profile = userProfiles[participant.userId];
                  const displayName = participant.userId === user?.uid
                    ? 'You'
                    : (profile?.displayName || profile?.firstName || `User ${participant.userId.substring(0, 6)}`);

                  const role = participant.role === 'creator'
                    ? 'Creator'
                    : participant.role === 'assistant'
                    ? 'Assistant'
                    : 'Participant';

                  const isActive = participant.status === 'active';

                  return (
                    <View key={`participant-${index}`} style={styles.participantItem}>
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>{displayName}</Text>
                        <Text style={styles.participantRole}> - {role}</Text>
                      </View>
                      <View style={[
                        styles.statusDot,
                        isActive ? styles.statusDotActive : styles.statusDotPending
                      ]} />
                    </View>
                  );
                } else {
                  // Pending invite
                  const invite = item.data;
                  const profile = userProfiles[invite.targetUserId];
                  const displayName = invite.targetUserId === user?.uid
                    ? 'You'
                    : (profile?.displayName || profile?.firstName || `User ${invite.targetUserId.substring(0, 6)}`);

                  const role = invite.role === 'assistant'
                    ? 'Assistant'
                    : 'Participant';

                  return (
                    <View key={`invite-${index}`} style={styles.participantItem}>
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>{displayName}</Text>
                        <Text style={styles.participantRole}> - {role} (Invited)</Text>
                      </View>
                      <View style={[
                        styles.statusDot,
                        styles.statusDotInvited
                      ]} />
                    </View>
                  );
                }
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Loading state
  if (loading || loadingProfiles) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={styles.loadingText}>
          {loading ? 'Loading conversation...' : 'Loading participants...'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {/* Display check-in name or fallback to contactName */}
          <Text style={styles.headerTitle}>
            {thread?.checkInMetadata?.name || contactName}
          </Text>

          {/* Display emotion and intensity if available */}
          {thread?.checkInMetadata?.emotion && (
            <View style={styles.emotionRow}>
              <Feather name="heart" size={14} color="#e91e63" />
              <Text style={styles.emotionText}>
                {thread.checkInMetadata.emotion}
                {thread.checkInMetadata.intensity &&
                  ` • Intensity: ${thread.checkInMetadata.intensity}/10`
                }
              </Text>
              {console.log('Rendering thread header - checkInMetadata:', thread.checkInMetadata)}
            </View>
          )}

          {/* Participant status - only show simple text for AI therapist */}
          {thread?.sessionType !== 'public' && (
            <Text style={styles.headerSubtitle}>AI Therapist</Text>
          )}
        </View>

        {/* Participants Button - always show */}
        {thread?.participants && (
          <TouchableOpacity
            style={styles.participantsButton}
            onPress={() => setShowParticipantsDropdown(true)}
          >
            <Feather name="users" size={20} color="#e91e63" />
          </TouchableOpacity>
        )}
      </View>

      {/* Participants Modal */}
      {renderParticipantsModal()}

      {/* Messages or Check-In Prompt */}
      {needsCheckin ? (
        <CheckInPromptCard
          inviteId={userPendingInvite?.inviteId}
          threadId={threadId}
          userId={user?.uid}
          onComplete={handleCheckInComplete}
        />
      ) : (
        <>
          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Feather name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Debug Info */}
      {thread?.conversationSummary && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Summary generated • {thread.fullMessageCount || thread.messageCount} total messages
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
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
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  emotionText: {
    fontSize: 13,
    color: '#e91e63',
    fontWeight: '500',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  participantsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '85%',
    maxHeight: '70%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  participantCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  participantsList: {
    maxHeight: 400,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 8,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  participantRole: {
    fontSize: 15,
    color: '#666',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  statusDotActive: {
    backgroundColor: '#10b981',
  },
  statusDotPending: {
    backgroundColor: '#f59e0b',
  },
  statusDotInvited: {
    backgroundColor: '#9ca3af',
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 15,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  otherUserMessageContainer: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  senderNameLeft: {
    marginLeft: 12,
  },
  senderNameRight: {
    marginRight: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
  },
  userMessageBubble: {
    backgroundColor: '#e91e63',
    borderBottomRightRadius: 5,
  },
  aiMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  otherUserMessageBubble: {
    backgroundColor: '#0891b2',
    borderBottomLeftRadius: 5,
  },
  loadingMessageBubble: {
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  loadingMessageText: {
    fontStyle: 'italic',
    color: '#999',
  },
  userMessageText: {
    color: 'white',
  },
  otherUserMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 5,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#e91e63',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  debugInfo: {
    backgroundColor: '#0891b2',
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  debugText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default MessageThread;
