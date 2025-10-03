# GPT Context Management Scripts

These scripts help you manage GPT context files that control your AI therapist's behavior.

## 📁 Workflow

1. Edit context files in `gpt-contexts/` folder
2. Validate them with `validate-contexts.js`
3. Upload to Firebase with `upload-all-contexts.js`
4. Verify with `view-firebase-contexts.js`

---

## 🔍 validate-contexts.js

**Purpose:** Check all JSON files for syntax errors before uploading

**Usage:**
```bash
node scripts/validate-contexts.js
```

**What it does:**
- ✓ Validates JSON syntax
- ✓ Checks for empty files
- ✓ Warns about missing documentation fields
- ✓ Shows property counts
- ✓ Provides clear error messages

**Example output:**
```
Found 5 context file(s)

Validating: 1-general-system.json
  ✓ Valid JSON
  Properties: 8

✓ All 5 context file(s) are valid!
Ready to upload to Firebase
```

---

## 📤 upload-all-contexts.js

**Purpose:** Upload all context files to Firebase

**Usage:**
```bash
node scripts/upload-all-contexts.js
```

**What it does:**
- ✓ Reads all JSON files from `gpt-contexts/`
- ✓ Uploads to `appData/gptContexts/{filename}` in Firebase
- ✓ Adds metadata (upload timestamp, version)
- ✓ Shows progress for each file
- ✓ Provides summary of successes/failures

**Example output:**
```
Found 5 context file(s) to upload

Uploading: 1-general-system.json
  ✓ Uploaded to: appData/gptContexts/1-general-system

✓ Successfully uploaded all 5 context file(s)!
Your GPT contexts are now live in Firebase
```

---

## 👀 view-firebase-contexts.js

**Purpose:** See what's currently deployed in Firebase

**Usage:**
```bash
node scripts/view-firebase-contexts.js
```

**What it does:**
- ✓ Fetches all contexts from Firebase
- ✓ Shows upload timestamps
- ✓ Displays property counts
- ✓ Shows descriptions

**Example output:**
```
Found 5 context(s) in Firebase:

● 1-general-system
  Uploaded: 2025-10-02T10:30:00.000Z
  Version: 1.0
  Description: GENERAL SYSTEM CONTEXT - Defines the AI therapist's core identity
  Properties: 8
```

---

## 🔄 Typical Workflow

### When you want to change AI behavior:

1. **Edit a context file**
   ```bash
   # Open and edit
   code gpt-contexts/1-general-system.json
   ```

2. **Validate your changes**
   ```bash
   node scripts/validate-contexts.js
   ```

3. **Upload to Firebase**
   ```bash
   node scripts/upload-all-contexts.js
   ```

4. **Verify it's live**
   ```bash
   node scripts/view-firebase-contexts.js
   ```

5. **Restart your app** - It will fetch the new contexts!

---

## 🚨 Troubleshooting

**Error: "Firebase initialization failed"**
- Check that `Firebaseconfig.js` exists in root directory
- Verify Firebase credentials are correct

**Error: "gpt-contexts/ directory not found"**
- Make sure you're running scripts from the project root
- Check that `gpt-contexts/` folder exists

**Error: "JSON parse error"**
- Run `validate-contexts.js` to see which file has syntax errors
- Common issues: missing commas, trailing commas, unclosed brackets

---

## 📝 Notes

- Scripts must be run from project root directory
- All scripts provide colored output for easy reading
- Upload overwrites existing contexts in Firebase
- Changes take effect immediately (app may cache for a few minutes)
- You can upload individual files by modifying the scripts
