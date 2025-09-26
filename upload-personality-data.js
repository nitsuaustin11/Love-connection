const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD2B_ATDyyRaKXC1fzkYvCexQZIT-u9Xp8",
  authDomain: "ittakestwo-9b9f0.firebaseapp.com",
  projectId: "ittakestwo-9b9f0",
  storageBucket: "ittakestwo-9b9f0.firebasestorage.app",
  messagingSenderId: "27800171622",
  appId: "1:27800171622:web:8bde1b87fd24421d3fa9a7",
  measurementId: "G-VRVSW6GWDP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Read your personality.json file
const personalityData = JSON.parse(fs.readFileSync('./personality.json', 'utf8'));

async function uploadPersonalityData() {
  try {
    // Upload to appData/personalityTests (note the 's' at the end)
    const docRef = doc(db, 'appData', 'personalityTests');
    await setDoc(docRef, personalityData);
    console.log('✅ Personality data uploaded successfully to appData/personalityTests!');
    console.log('📊 Data structure:', Object.keys(personalityData));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading data:', error);
    process.exit(1);
  }
}

console.log('🚀 Starting personality data upload...');
uploadPersonalityData();