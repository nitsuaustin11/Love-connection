import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../Firebaseconfig';

class DatabaseService {
  createUser = async (userId, userData) => {
    try {
      await updateDoc(doc(db, 'users', userId), userData);
      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  };

  getUser = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { success: true, data: userDoc.data() };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  };

  updateUser = async (userId, updates) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  };

  createMatch = async (matchData) => {
    try {
      const docRef = await addDoc(collection(db, 'matches'), {
        ...matchData,
        createdAt: new Date().toISOString()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating match:', error);
      return { success: false, error: error.message };
    }
  };

  getUserMatches = async (userId) => {
    try {
      const q = query(
        collection(db, 'matches'),
        where('users', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const matches = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, data: matches };
    } catch (error) {
      console.error('Error getting matches:', error);
      return { success: false, error: error.message };
    }
  };

  sendMessage = async (messageData) => {
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        ...messageData,
        createdAt: new Date().toISOString(),
        timestamp: Date.now()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  };

  getMessages = async (conversationId, limitCount = 50) => {
    try {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse();

      return { success: true, data: messages };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: error.message };
    }
  };

  subscribeToMessages = (conversationId, callback) => {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  };

  getNearbyUsers = async (currentUserId, maxDistance = 50) => {
    try {
      const q = query(
        collection(db, 'users'),
        where('userId', '!=', currentUserId),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, data: users };
    } catch (error) {
      console.error('Error getting nearby users:', error);
      return { success: false, error: error.message };
    }
  };
}

export default new DatabaseService();