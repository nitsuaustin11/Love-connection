/**
 * UPLOAD SINGLE FILE SCRIPT
 *
 * Uploads a specific JSON file to a specific Firebase location
 *
 * Usage: node scripts/upload.js <json-file-path> <firebase-collection/document>
 * Example: node scripts/upload.js gpt-contexts/1-general-system.json gptContexts/1-general-system
 */

const fs = require('fs');
const path = require('path');
const { doc, setDoc } = require('firebase/firestore');

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
};

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`${colors.red}Error: Missing arguments${colors.reset}\n`);
  console.log('Usage: node scripts/upload.js <json-file-path> <firebase-path>');
  console.log('\nExamples:');
  console.log('  node scripts/upload.js gpt-contexts/1-general-system.json gptContexts/1-general-system');
  console.log('  node scripts/upload.js data/test.json appData/testDoc');
  process.exit(1);
}

const jsonFilePath = args[0];
const firebasePath = args[1];

// Parse Firebase path (collection/document)
const pathParts = firebasePath.split('/');
if (pathParts.length !== 2) {
  console.log(`${colors.red}Error: Invalid Firebase path${colors.reset}`);
  console.log('Firebase path must be in format: collection/document');
  console.log(`Example: gptContexts/1-general-system`);
  process.exit(1);
}

const [collection, document] = pathParts;

/**
 * Upload file to Firebase
 */
async function uploadFile() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}UPLOADING FILE TO FIREBASE${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  try {
    // Resolve file path
    const filePath = path.resolve(jsonFilePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log(`${colors.blue}Source:${colors.reset} ${jsonFilePath}`);
    console.log(`${colors.blue}Target:${colors.reset} ${collection}/${document}\n`);

    // Read and parse JSON
    console.log('Reading file...');
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    console.log(`${colors.green}✓ File loaded successfully${colors.reset}`);
    console.log(`  Data size: ${JSON.stringify(data).length} bytes\n`);

    // Upload to Firebase
    console.log('Uploading to Firebase...');
    const docRef = doc(db, collection, document);
    await setDoc(docRef, data, { merge: true });

    console.log(`${colors.green}✓ Upload successful!${colors.reset}\n`);
    console.log('='.repeat(60));
    console.log(`${colors.green}Document uploaded to: ${collection}/${document}${colors.reset}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);

  } catch (error) {
    console.log(`\n${colors.red}✗ Upload failed${colors.reset}`);
    console.log(`Error: ${error.message}\n`);

    if (error.code) {
      console.log(`Error code: ${error.code}`);
    }
    if (error.stack) {
      console.log(`\nStack trace:\n${error.stack}\n`);
    }

    process.exit(1);
  }
}

// Run upload
uploadFile();
