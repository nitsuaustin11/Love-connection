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
  Switch,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import {
  getMessageThread,
  addMessageToThread,
  checkAndUpdateSummary,
} from '../services/messageThreadService';
import { assembleCompletePrompt } from '../services/contextAssembler';
import CheckInPromptCard from '../components/CheckInPromptCard';

const MessageThreadScreen = ({ route, navigation }) => {
  const { threadId, contactName } = route.params;
  const { user } = useAuthStore();
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // Modal states
  const [showAIToolbar, setShowAIToolbar] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // AI Toolbar modifier states (placeholders)
  const [modifiers, setModifiers] = useState({
    fullAnalysis: false,
    actionResponse: false,
    thoughtProvoking: false,
  });

  // Load thread on mount
  useEffect(() => {
    loadThread();
  }, [threadId]);

  const loadThread = async () => {
    try {
      setLoading(true);
      const threadData = await getMessageThread(threadId);
      if (threadData) {
        setThread(threadData);
        setMessages(threadData.messages || []);
      }
    } catch (error) {
      console.error('Error loading thread:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if current user needs to complete check-in
  const userParticipant = thread?.participants?.find(p => p.userId === user?.uid);
  const isPendingCheckin = userParticipant?.status === 'pending_checkin';
  const userPendingInvite = thread?.pendingInvites?.find(
    inv => inv.targetUserId === user?.uid && inv.status === 'pending' && inv.role === 'participant'
  );
  const needsCheckin = isPendingCheckin || userPendingInvite;

  const handleCheckInComplete = () => {
    // Reload thread after check-in is complete
    loadThread();
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessageContent = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      // 1. Add user message to thread
      const userMessage = await addMessageToThread(threadId, {
        sender: user.uid,
        content: userMessageContent,
      });

      // Update local state
      setMessages(prev => [...prev, userMessage]);

      // 2. Generate AI response (demo for now)
      // TODO: Replace with actual GPT API call
      setTimeout(async () => {
        const aiMessage = await addMessageToThread(threadId, {
          sender: 'ai',
          content: 'Demo of chat GPT response',
        });

        setMessages(prev => [...prev, aiMessage]);

        // 3. Check if we need to generate summary (every 5 messages)
        await checkAndUpdateSummary(threadId);

        // 4. Reload thread to get updated data (including potential summary update)
        await loadThread();

        setSending(false);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.sender === user?.uid;
    const isAI = item.sender === 'ai';

    // Check if this is a multi-participant thread (either sessionType is public OR has 2+ participants)
    const hasMultipleParticipants = (thread?.participants?.length || 0) >= 2;
    const isMultiParticipantThread = thread?.sessionType === 'public' || hasMultipleParticipants;

    // Get sender's name for human messages
    let senderName = null;
    if (!isAI) {
      // Find participant by userId
      const participant = thread?.participants?.find(p => p.userId === item.sender);
      if (participant) {
        // TODO: Fetch user profile to get actual display name (for now use userId truncated)
        senderName = participant.userId === user?.uid ? 'You' : `User ${item.sender.substring(0, 6)}`;
      } else if (item.sender === user?.uid) {
        // Fallback for current user if not in participants array
        senderName = 'you';
      } else if (item.sender === 'user') {
        // Backward compatibility with old message format
        senderName = 'You';
      } else {
        // Unknown sender
        senderName = `User ${item.sender.substring(0, 6)}`;
      }
    }

    // Determine message alignment and styling
    const isOwnMessage = isCurrentUser || item.sender === 'user'; // fallback to 'user' for backward compatibility

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.userMessageContainer : (isMultiParticipantThread && !isAI ? styles.otherUserMessageContainer : styles.aiMessageContainer)
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

        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.userMessageBubble : (isMultiParticipantThread && !isAI ? styles.otherUserMessageBubble : styles.aiMessageBubble)
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.userMessageText : (isMultiParticipantThread && !isAI ? styles.otherUserMessageText : styles.aiMessageText)
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.timestamp,
            isOwnMessage ? styles.userTimestamp : styles.aiTimestamp
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
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
          <Text style={styles.headerTitle}>{contactName}</Text>
          <Text style={styles.headerSubtitle}>
            {thread?.sessionType === 'public'
              ? `Multi-User Session • ${thread?.participants?.filter(p => p.status === 'active').length || 0} active`
              : 'AI Therapist'}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAIToolbar(true)}
          >
            <Feather name="sliders" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowInviteModal(true)}
          >
            <Feather name="user-plus" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List or Check-In Prompt */}
      {needsCheckin ? (
        <CheckInPromptCard
          inviteId={userPendingInvite?.inviteId}
          threadId={threadId}
          userId={user?.uid}
          onComplete={handleCheckInComplete}
        />
      ) : (
        <>
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
              style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
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

      {/* Debug info */}
      {thread?.conversationSummary && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Summary generated • {thread.fullMessageCount || thread.messageCount} total messages
          </Text>
        </View>
      )}

      {/* AI Toolbar Modal */}
      <Modal
        visible={showAIToolbar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAIToolbar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Response Modifiers</Text>
              <TouchableOpacity onPress={() => setShowAIToolbar(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Customize how the AI responds to your messages (Coming Soon)
              </Text>

              <View style={styles.modifierItem}>
                <View style={styles.modifierInfo}>
                  <Text style={styles.modifierTitle}>Get Full Analysis</Text>
                  <Text style={styles.modifierDescription}>
                    Receive comprehensive psychological analysis
                  </Text>
                </View>
                <Switch
                  value={modifiers.fullAnalysis}
                  onValueChange={(value) => setModifiers({...modifiers, fullAnalysis: value})}
                  trackColor={{ false: '#ddd', true: '#e91e63' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.modifierItem}>
                <View style={styles.modifierInfo}>
                  <Text style={styles.modifierTitle}>Give Action Response</Text>
                  <Text style={styles.modifierDescription}>
                    Focus on actionable steps and solutions
                  </Text>
                </View>
                <Switch
                  value={modifiers.actionResponse}
                  onValueChange={(value) => setModifiers({...modifiers, actionResponse: value})}
                  trackColor={{ false: '#ddd', true: '#e91e63' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.modifierItem}>
                <View style={styles.modifierInfo}>
                  <Text style={styles.modifierTitle}>Thought-Provoking Questions</Text>
                  <Text style={styles.modifierDescription}>
                    Encourage deeper self-reflection through questions
                  </Text>
                </View>
                <Switch
                  value={modifiers.thoughtProvoking}
                  onValueChange={(value) => setModifiers({...modifiers, thoughtProvoking: value})}
                  trackColor={{ false: '#ddd', true: '#e91e63' }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAIToolbar(false)}
            >
              <Text style={styles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite to Conversation</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Choose how to invite someone to this therapy session (Coming Soon)
              </Text>

              <TouchableOpacity
                style={styles.inviteOption}
                onPress={() => {
                  console.log('Assistant mode selected');
                  // TODO: Open contact selector for assistant mode
                }}
              >
                <View style={styles.inviteOptionIcon}>
                  <Feather name="life-buoy" size={32} color="#0891b2" />
                </View>
                <View style={styles.inviteOptionContent}>
                  <Text style={styles.inviteOptionTitle}>Request Assistance</Text>
                  <Text style={styles.inviteOptionDescription}>
                    Invite someone to observe and provide support. No check-in required.
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inviteOption}
                onPress={() => {
                  console.log('Participant mode selected');
                  // TODO: Open contact selector for participant mode
                }}
              >
                <View style={styles.inviteOptionIcon}>
                  <Feather name="users" size={32} color="#e91e63" />
                </View>
                <View style={styles.inviteOptionContent}>
                  <Text style={styles.inviteOptionTitle}>Participate in Session</Text>
                  <Text style={styles.inviteOptionDescription}>
                    Invite someone to join as an active participant. They'll complete their own check-in.
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowInviteModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
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
  messageText: {
    fontSize: 16,
    lineHeight: 22,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modifierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  modifierInfo: {
    flex: 1,
    marginRight: 15,
  },
  modifierTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modifierDescription: {
    fontSize: 13,
    color: '#666',
  },
  modalCloseButton: {
    backgroundColor: '#e91e63',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  inviteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  inviteOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  inviteOptionContent: {
    flex: 1,
  },
  inviteOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  inviteOptionDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default MessageThreadScreen;
