/**
 * UPLOAD ALL CONTEXTS SCRIPT
 *
 * This script uploads all JSON files from gpt-contexts/ to Firebase
 * Each file gets uploaded to: appData/gptContexts/{filename}
 *
 * Usage: node scripts/upload-all-contexts.js
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
  magenta: '\x1b[35m',
};

const CONTEXTS_DIR = path.join(__dirname, '..', 'gpt-contexts');

console.log(`${colors.green}✓ Firebase initialized${colors.reset}\n`);

/**
 * Upload a single context file to Firebase
 */
async function uploadContextFile(filePath) {
  const fileName = path.basename(filePath, '.json');
  const displayName = path.basename(filePath);

  try {
    console.log(`${colors.blue}Uploading:${colors.reset} ${displayName}`);

    // Read and parse JSON
    const content = fs.readFileSync(filePath, 'utf8');
    const contextData = JSON.parse(content);

    // Add metadata
    const dataToUpload = {
      ...contextData,
      _metadata: {
        fileName: displayName,
        uploadedAt: new Date().toISOString(),
        version: '1.0',
      }
    };

    // Upload to Firebase: gptContexts/{filename}
    const docRef = doc(db, 'gptContexts', fileName);
    await setDoc(docRef, dataToUpload);

    console.log(`  ${colors.green}✓ Uploaded to:${colors.reset} gptContexts/${fileName}`);
    return { success: true, fileName: displayName };

  } catch (error) {
    console.log(`  ${colors.red}✗ Upload failed:${colors.reset} ${error.message}`);
    return { success: false, fileName: displayName, error: error.message };
  }
}

/**
 * Main upload function
 */
async function uploadAllContexts() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.magenta}UPLOADING GPT CONTEXTS TO FIREBASE${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  // Check if contexts directory exists
  if (!fs.existsSync(CONTEXTS_DIR)) {
    console.log(`${colors.red}Error:${colors.reset} gpt-contexts/ directory not found`);
    console.log(`Expected path: ${CONTEXTS_DIR}\n`);
    process.exit(1);
  }

  // Get all JSON files
  const files = fs.readdirSync(CONTEXTS_DIR)
    .filter(file => file.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.log(`${colors.yellow}Warning:${colors.reset} No JSON files found in gpt-contexts/\n`);
    process.exit(1);
  }

  console.log(`Found ${files.length} context file(s) to upload\n`);

  // Upload each file
  const results = [];
  for (const file of files) {
    const filePath = path.join(CONTEXTS_DIR, file);
    const result = await uploadContextFile(filePath);
    results.push(result);
    console.log(''); // Empty line between uploads
  }

  // Summary
  console.log('='.repeat(60));
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  if (failCount === 0) {
    console.log(`${colors.green}✓ Successfully uploaded all ${successCount} context file(s)!${colors.reset}`);
    console.log('='.repeat(60) + '\n');
    console.log(`${colors.cyan}Your GPT contexts are now live in Firebase${colors.reset}`);
    console.log(`Location: ${colors.yellow}gptContexts/${colors.reset}\n`);
    console.log(`${colors.green}✓ Your app will now use these contexts${colors.reset}\n`);
  } else {
    console.log(`${colors.red}✗ ${failCount} file(s) failed to upload${colors.reset}`);
    console.log(`${colors.green}✓ ${successCount} file(s) uploaded successfully${colors.reset}`);
    console.log('='.repeat(60) + '\n');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run upload
uploadAllContexts().catch(error => {
  console.log(`\n${colors.red}Fatal error:${colors.reset} ${error.message}\n`);
  process.exit(1);
});
