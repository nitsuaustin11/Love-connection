import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome, Feather, Octicons } from '@expo/vector-icons';

import useAuthStore from './src/store/authStore';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import TermsAndConditionsScreen from './src/screens/TermsAndConditionsScreen';
import CreateProfileScreen from './src/screens/CreateProfileScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PersonalityTestScreen from './src/screens/PersonalityTestScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import MessageThreadScreen from './src/screens/MessageThreadScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import AddAITherapistScreen from './src/screens/AddAITherapistScreen';
import EditAITherapistScreen from './src/screens/EditAITherapistScreen';
import AddContactScreen from './src/screens/AddContactScreen';
import ContactRequestsScreen from './src/screens/ContactRequestsScreen';
import MBTIDetailScreen from './src/screens/MBTIDetailScreen';
import SixHumanNeedsDetailScreen from './src/screens/SixHumanNeedsDetailScreen';
import LoveLanguagesDetailScreen from './src/screens/LoveLanguagesDetailScreen';
import AddSixNeedsResults from './src/screens/AddSixNeedsResults';
import AddMBTIResults from './src/screens/AddMBTIResults';
import AddLoveLanguagesResults from './src/screens/AddLoveLanguagesResults';
import ContactDetailScreen from './src/screens/ContactDetailScreen';
import SessionInvitesScreen from './src/screens/SessionInvitesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function PersonalityStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PersonalityTestMain" component={PersonalityTestScreen} />
      <Stack.Screen name="MbtiDetail" component={MBTIDetailScreen} />
      <Stack.Screen name="SixHumanNeedsDetail" component={SixHumanNeedsDetailScreen} />
      <Stack.Screen name="LoveLanguagesDetail" component={LoveLanguagesDetailScreen} />
      <Stack.Screen name="AddSixNeedsResults" component={AddSixNeedsResults} />
      <Stack.Screen name="AddMBTIResults" component={AddMBTIResults} />
      <Stack.Screen name="AddLoveLanguagesResults" component={AddLoveLanguagesResults} />
    </Stack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={HomeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      <Stack.Screen name="Contacts" component={ContactsScreen} />
      <Stack.Screen name="AddAITherapist" component={AddAITherapistScreen} />
      <Stack.Screen name="EditAITherapist" component={EditAITherapistScreen} />
      <Stack.Screen name="AddContact" component={AddContactScreen} />
      <Stack.Screen name="ContactRequests" component={ContactRequestsScreen} />
      <Stack.Screen name="ContactDetail" component={ContactDetailScreen} />
    </Stack.Navigator>
  );
}

function MessagesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MessagesList" component={MessagesScreen} />
      <Stack.Screen name="MessageThread" component={MessageThreadScreen} />
      <Stack.Screen name="SessionInvites" component={SessionInvitesScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'PersonalityTest') {
            // Using pencil icon from icons.txt as placeholder for personality test
            return <Octicons name="pencil" size={size} color={color} />;
          } else if (route.name === 'CheckIn') {
            // Using send icon from icons.txt for check-in
            return <Feather name="send" size={size} color={color} />;
          } else if (route.name === 'Messages') {
            const iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Profile') {
            const iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#e91e63',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="PersonalityTest"
        component={PersonalityStackNavigator}
        options={{ tabBarLabel: 'Personality' }}
      />
      <Tab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ tabBarLabel: 'Check-in' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStackNavigator}
        options={{ tabBarLabel: 'Messages' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Reset the Messages stack to the first screen when tab is pressed
            navigation.navigate('Messages', { screen: 'MessagesList' });
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { user, loading, initializeAuth } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    setInitializing(false);


    return unsubscribe;
  }, []);

  if (initializing || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  // Check if user needs to accept terms
  const needsTermsAcceptance = user && !user.termsAccepted;

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          needsTermsAcceptance ? (
            // User just signed up and needs to accept terms
            <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
          ) : (
            // User has accepted terms - go to main app
            <Stack.Screen name="MainTabs" component={TabNavigator} />
          )
        ) : (
          // User is not logged in
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
