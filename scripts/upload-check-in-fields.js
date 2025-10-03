/**
 * UPLOAD CHECK-IN FIELDS SCRIPT
 *
 * This script uploads the check-in fields configuration to Firebase
 * Deploys to: appData/checkInFields
 *
 * Usage: node scripts/upload-check-in-fields.js
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

const FIELDS_DIR = path.join(__dirname, '..', 'check-in-fields');
const FIELDS_FILE = path.join(FIELDS_DIR, 'check-in-fields.json');

console.log(`${colors.green}✓ Firebase initialized${colors.reset}\n`);

/**
 * Validate check-in fields structure
 */
function validateCheckInFields(data) {
  const errors = [];

  if (!data.checkInFields) {
    errors.push('Missing "checkInFields" root object');
    return errors;
  }

  if (!data.checkInFields.basic) {
    errors.push('Missing "basic" fields section');
  }

  if (!data.checkInFields.advanced) {
    errors.push('Missing "advanced" fields section');
  }

  // Validate each field has required properties
  const validateFieldSet = (fields, section) => {
    Object.entries(fields).forEach(([key, field]) => {
      if (!field.question) {
        errors.push(`${section}.${key}: Missing "question" property`);
      }
      if (!field.formType) {
        errors.push(`${section}.${key}: Missing "formType" property`);
      }
      if (field.order === undefined) {
        errors.push(`${section}.${key}: Missing "order" property`);
      }
      if (field.formType === 'checkbox' && !field.options) {
        errors.push(`${section}.${key}: Checkbox type requires "options" array`);
      }
      if (field.formType === 'slider' && !field.options) {
        errors.push(`${section}.${key}: Slider type requires "options" (max value)`);
      }
    });
  };

  if (data.checkInFields.basic) {
    validateFieldSet(data.checkInFields.basic, 'basic');
  }

  if (data.checkInFields.advanced) {
    validateFieldSet(data.checkInFields.advanced, 'advanced');
  }

  return errors;
}

/**
 * Upload check-in fields to Firebase
 */
async function uploadCheckInFields() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.magenta}UPLOADING CHECK-IN FIELDS TO FIREBASE${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  // Check if file exists
  if (!fs.existsSync(FIELDS_FILE)) {
    console.log(`${colors.red}Error:${colors.reset} check-in-fields.json not found`);
    console.log(`Expected path: ${FIELDS_FILE}\n`);
    process.exit(1);
  }

  try {
    // Read and parse JSON
    console.log(`${colors.blue}Reading:${colors.reset} check-in-fields.json`);
    const content = fs.readFileSync(FIELDS_FILE, 'utf8');
    const fieldsData = JSON.parse(content);

    // Validate structure
    console.log(`${colors.blue}Validating:${colors.reset} Field structure`);
    const validationErrors = validateCheckInFields(fieldsData);

    if (validationErrors.length > 0) {
      console.log(`\n${colors.red}✗ Validation failed:${colors.reset}`);
      validationErrors.forEach(error => {
        console.log(`  - ${error}`);
      });
      console.log('');
      process.exit(1);
    }

    console.log(`${colors.green}✓ Validation passed${colors.reset}\n`);

    // Count questions
    const basicCount = Object.keys(fieldsData.checkInFields.basic || {}).length;
    const advancedCount = Object.keys(fieldsData.checkInFields.advanced || {}).length;

    console.log(`${colors.cyan}Questions to upload:${colors.reset}`);
    console.log(`  Basic: ${basicCount} questions`);
    console.log(`  Advanced: ${advancedCount} questions`);
    console.log(`  Total: ${basicCount + advancedCount} questions\n`);

    // Add metadata
    const dataToUpload = {
      ...fieldsData,
      _metadata: {
        uploadedAt: new Date().toISOString(),
        version: '1.0',
        totalQuestions: basicCount + advancedCount,
        basicQuestions: basicCount,
        advancedQuestions: advancedCount
      }
    };

    // Upload to Firebase
    console.log(`${colors.blue}Uploading to:${colors.reset} appData/checkInFields`);
    const docRef = doc(db, 'appData', 'checkInFields');
    await setDoc(docRef, dataToUpload);

    console.log(`${colors.green}✓ Successfully uploaded!${colors.reset}\n`);
    console.log('='.repeat(60));
    console.log(`${colors.cyan}Your check-in fields are now live in Firebase${colors.reset}`);
    console.log(`Location: ${colors.yellow}appData/checkInFields${colors.reset}\n`);
    console.log(`${colors.green}✓ Your app will now use these survey questions${colors.reset}\n`);

  } catch (error) {
    console.log(`\n${colors.red}✗ Upload failed:${colors.reset} ${error.message}\n`);
    process.exit(1);
  }

  process.exit(0);
}

// Run upload
uploadCheckInFields().catch(error => {
  console.log(`\n${colors.red}Fatal error:${colors.reset} ${error.message}\n`);
  process.exit(1);
});
