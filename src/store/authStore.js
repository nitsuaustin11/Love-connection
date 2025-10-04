import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../../Firebaseconfig';
import {
  initializeUserProfile,
  getUserProfile,
  createDefaultUserProfile
} from '../services/userProfileService';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get existing profile data
          const existingProfile = await getUserProfile(user.uid);

          // Initialize or update profile to ensure completeness
          const completeProfile = await initializeUserProfile(user, existingProfile);

          set({
            user: {
              ...user,
              ...completeProfile
            },
            loading: false,
            error: null
          });
        } catch (error) {
          console.error('Error initializing user profile:', error);
          set({
            user: {
              ...user,
              // Fallback to basic user data if profile initialization fails
              uid: user.uid,
              email: user.email
            },
            loading: false,
            error: 'Failed to load profile data'
          });
        }
      } else {
        set({ user: null, loading: false });
      }
    });

    return unsubscribe;
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signUp: async (email, password, firstName = '', lastName = '') => {
    try {
      set({ loading: true, error: null });
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Create user profile with name and mark as incomplete (needs to accept terms)
      await initializeUserProfile(user, null, {
        profileCompleted: false,
        termsAccepted: false,
        firstName: firstName,
        lastName: lastName,
      });

      // Note: The auth state change listener will automatically
      // load the profile and route to TermsAndConditionsScreen

    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signOutUser: async () => {
    try {
      await signOut(auth);
      set({ user: null });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  refreshUserProfile: async () => {
    try {
      const currentUser = get().user;
      if (!currentUser) return;

      // Get updated profile data
      const updatedProfile = await getUserProfile(currentUser.uid);

      if (updatedProfile) {
        set({
          user: {
            ...currentUser,
            ...updatedProfile
          }
        });
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  }
}));

export default useAuthStore;