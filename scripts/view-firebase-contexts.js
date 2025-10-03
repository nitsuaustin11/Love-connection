/**
 * VIEW FIREBASE CONTEXTS SCRIPT
 *
 * This script shows what GPT contexts are currently stored in Firebase
 * Useful for verifying what's deployed
 *
 * Usage: node scripts/view-firebase-contexts.js
 */

const { collection, getDocs } = require('firebase/firestore');

// Import Firebase config (Node.js version)
const { db } = require('./firebase-node-config');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

/**
 * View all contexts in Firebase
 */
async function viewFirebaseContexts() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}GPT CONTEXTS IN FIREBASE${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  try {
    // Get all documents in gptContexts collection
    const contextsRef = collection(db, 'gptContexts');
    const snapshot = await getDocs(contextsRef);

    if (snapshot.empty) {
      console.log(`${colors.yellow}No contexts found in Firebase${colors.reset}`);
      console.log(`Run: ${colors.cyan}node scripts/upload-all-contexts.js${colors.reset} to upload\n`);
      return;
    }

    console.log(`Found ${snapshot.size} context(s) in Firebase:\n`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`${colors.green}●${colors.reset} ${colors.blue}${doc.id}${colors.reset}`);

      if (data._metadata) {
        console.log(`  Uploaded: ${data._metadata.uploadedAt || 'Unknown'}`);
        console.log(`  Version: ${data._metadata.version || 'Unknown'}`);
      }

      if (data._comment) {
        console.log(`  ${colors.cyan}Description:${colors.reset} ${data._comment}`);
      }

      const propCount = Object.keys(data).filter(k => !k.startsWith('_')).length;
      console.log(`  Properties: ${propCount}`);
      console.log('');
    });

    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.log(`${colors.red}✗ Error fetching contexts:${colors.reset} ${error.message}\n`);
    process.exit(1);
  }

  process.exit(0);
}

// Run
viewFirebaseContexts();
