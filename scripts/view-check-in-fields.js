/**
 * VIEW CHECK-IN FIELDS SCRIPT
 *
 * This script shows the current check-in fields configuration in Firebase
 * Useful for verifying what's deployed
 *
 * Usage: node scripts/view-check-in-fields.js
 */

const { doc, getDoc } = require('firebase/firestore');

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
 * View check-in fields from Firebase
 */
async function viewCheckInFields() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}CHECK-IN FIELDS IN FIREBASE${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  try {
    // Get document from Firebase
    const docRef = doc(db, 'appData', 'checkInFields');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log(`${colors.yellow}No check-in fields found in Firebase${colors.reset}`);
      console.log(`Run: ${colors.cyan}node scripts/upload-check-in-fields.js${colors.reset} to upload\n`);
      return;
    }

    const data = docSnap.data();

    // Display metadata
    if (data._metadata) {
      console.log(`${colors.green}Metadata:${colors.reset}`);
      console.log(`  Uploaded: ${data._metadata.uploadedAt || 'Unknown'}`);
      console.log(`  Version: ${data._metadata.version || 'Unknown'}`);
      console.log(`  Total Questions: ${data._metadata.totalQuestions || 'Unknown'}`);
      console.log(`  Basic: ${data._metadata.basicQuestions || 0}`);
      console.log(`  Advanced: ${data._metadata.advancedQuestions || 0}`);
      console.log('');
    }

    // Display basic questions
    if (data.checkInFields?.basic) {
      console.log(`${colors.blue}BASIC QUESTIONS:${colors.reset}`);
      const basicFields = data.checkInFields.basic;
      const sortedBasic = Object.entries(basicFields).sort((a, b) => a[1].order - b[1].order);

      sortedBasic.forEach(([key, field]) => {
        console.log(`\n  ${colors.green}[${field.order}]${colors.reset} ${colors.cyan}${key}${colors.reset}`);
        console.log(`      Question: ${field.question}`);
        console.log(`      Type: ${field.formType}`);
        if (field.selectionType) {
          console.log(`      Selection: ${field.selectionType}`);
        }
        if (field.options) {
          if (Array.isArray(field.options)) {
            console.log(`      Options: ${field.options.length} choices`);
          } else {
            console.log(`      Range: 1-${field.options}`);
          }
        }
      });
      console.log('');
    }

    // Display advanced questions
    if (data.checkInFields?.advanced) {
      console.log(`${colors.magenta}ADVANCED QUESTIONS:${colors.reset}`);
      const advancedFields = data.checkInFields.advanced;
      const sortedAdvanced = Object.entries(advancedFields).sort((a, b) => a[1].order - b[1].order);

      sortedAdvanced.forEach(([key, field]) => {
        console.log(`\n  ${colors.green}[${field.order}]${colors.reset} ${colors.cyan}${key}${colors.reset}`);
        console.log(`      Question: ${field.question}`);
        console.log(`      Type: ${field.formType}`);
        if (field.selectionType) {
          console.log(`      Selection: ${field.selectionType}`);
        }
        if (field.options) {
          if (Array.isArray(field.options)) {
            console.log(`      Options: ${field.options.length} choices`);
          } else {
            console.log(`      Range: 1-${field.options}`);
          }
        }
      });
      console.log('');
    }

    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.log(`${colors.red}✗ Error fetching fields:${colors.reset} ${error.message}\n`);
    process.exit(1);
  }

  process.exit(0);
}

// Run
viewCheckInFields();
