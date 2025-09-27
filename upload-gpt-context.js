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

// Read your generalized_gpt_context.json file
const gptContextData = JSON.parse(fs.readFileSync('./generalized_gpt_context.json', 'utf8'));

async function uploadGPTContextData() {
  try {
    // Upload to appData/gptContext
    const docRef = doc(db, 'appData', 'gptContext');
    await setDoc(docRef, gptContextData);
    console.log('✅ GPT context data uploaded successfully to appData/gptContext!');
    console.log('📊 Data structure:', Object.keys(gptContextData));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading data:', error);
    process.exit(1);
  }
}

console.log('🚀 Starting GPT context data upload...');
uploadGPTContextData();