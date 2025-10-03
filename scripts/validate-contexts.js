/**
 * VALIDATE CONTEXTS SCRIPT
 *
 * This script validates all JSON files in gpt-contexts/ folder
 * Run this before uploading to catch syntax errors
 *
 * Usage: node scripts/validate-contexts.js
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const CONTEXTS_DIR = path.join(__dirname, '..', 'gpt-contexts');

/**
 * Validate a single JSON file
 */
function validateFile(filePath) {
  const fileName = path.basename(filePath);

  try {
    console.log(`${colors.blue}Validating:${colors.reset} ${fileName}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if file is empty
    if (!content.trim()) {
      throw new Error('File is empty');
    }

    // Parse JSON
    const parsed = JSON.parse(content);

    // Check if it's an object
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('JSON must be an object');
    }

    // Check for _comment field (good practice)
    if (!parsed._comment) {
      console.log(`  ${colors.yellow}Warning:${colors.reset} Missing _comment field (recommended for documentation)`);
    }

    // Check for _usage field (good practice)
    if (!parsed._usage) {
      console.log(`  ${colors.yellow}Warning:${colors.reset} Missing _usage field (recommended for documentation)`);
    }

    console.log(`  ${colors.green}✓ Valid JSON${colors.reset}`);
    console.log(`  ${colors.cyan}Properties:${colors.reset} ${Object.keys(parsed).length}`);

    return { valid: true, fileName, parsed };

  } catch (error) {
    console.log(`  ${colors.red}✗ Error:${colors.reset} ${error.message}`);
    return { valid: false, fileName, error: error.message };
  }
}

/**
 * Main validation function
 */
function validateAllContexts() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}GPT CONTEXT VALIDATION${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  // Check if contexts directory exists
  if (!fs.existsSync(CONTEXTS_DIR)) {
    console.log(`${colors.red}Error:${colors.reset} gpt-contexts/ directory not found`);
    console.log(`Expected path: ${CONTEXTS_DIR}`);
    process.exit(1);
  }

  // Get all JSON files
  const files = fs.readdirSync(CONTEXTS_DIR)
    .filter(file => file.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.log(`${colors.yellow}Warning:${colors.reset} No JSON files found in gpt-contexts/`);
    process.exit(1);
  }

  console.log(`Found ${files.length} context file(s)\n`);

  // Validate each file
  const results = [];
  for (const file of files) {
    const filePath = path.join(CONTEXTS_DIR, file);
    const result = validateFile(filePath);
    results.push(result);
    console.log(''); // Empty line between files
  }

  // Summary
  console.log('='.repeat(60));
  const validCount = results.filter(r => r.valid).length;
  const invalidCount = results.filter(r => !r.valid).length;

  if (invalidCount === 0) {
    console.log(`${colors.green}✓ All ${validCount} context file(s) are valid!${colors.reset}`);
    console.log('='.repeat(60) + '\n');
    console.log(`${colors.green}Ready to upload to Firebase${colors.reset}`);
    console.log(`Run: ${colors.cyan}node scripts/upload-all-contexts.js${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ ${invalidCount} file(s) have errors${colors.reset}`);
    console.log(`${colors.green}✓ ${validCount} file(s) are valid${colors.reset}`);
    console.log('='.repeat(60) + '\n');
    console.log('Please fix the errors before uploading\n');
    process.exit(1);
  }
}

// Run validation
validateAllContexts();
