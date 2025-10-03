# Check-in Fields Configuration

This folder contains the check-in survey questions that appear when users do emotional check-ins.

## File Structure

- `check-in-fields.json` - Complete survey configuration with all questions

## Survey Structure

### Basic Questions (7 total)
Questions every user sees during a basic check-in:
1. **When** - When did the feeling start?
2. **How Much** - Intensity slider (1-10)
3. **Symptoms** - How it's affecting them
4. **Perspective** - What happened from their view
5. **Physical Response** - Body sensations
6. **Trigger Event** - What triggered it
7. **Coping Attempts** - What they've tried

### Advanced Questions (5 total)
Deeper questions shown when user toggles "Show Advanced Check-in":
1. **Underlying Needs** - What need isn't being met
2. **Past Patterns** - Similar past experiences
3. **Fear or Worry** - What they're afraid of
4. **Desired Outcome** - What they hope for
5. **Self Compassion** - How kind to themselves (slider 1-10)

## Deployment

### Upload to Firebase
```bash
node scripts/upload-check-in-fields.js
```

### View Current Fields
```bash
node scripts/view-check-in-fields.js
```

## Adding New Questions

1. Edit `check-in-fields.json`
2. Add your question to either `basic` or `advanced` section
3. Include required fields:
   - `question` - The question text
   - `formType` - Type: "checkbox", "slider", or "textInput"
   - `order` - Display order number
   - `options` - Array for checkbox, number for slider
4. Run upload script to deploy

### Question Types

**Checkbox (Single Choice)**
```json
{
  "question": "Your question?",
  "formType": "checkbox",
  "selectionType": "single",
  "options": ["Option 1", "Option 2"],
  "order": 1
}
```

**Checkbox (Multiple Choice)**
```json
{
  "question": "Your question?",
  "formType": "checkbox",
  "selectionType": "multiple",
  "options": ["Option 1", "Option 2"],
  "order": 2
}
```

**Slider**
```json
{
  "question": "Your question?",
  "formType": "slider",
  "options": 10,
  "order": 3
}
```

**Text Input**
```json
{
  "question": "Your question?",
  "formType": "textInput",
  "placeholder": "Optional placeholder...",
  "order": 4
}
```

## Ordering

Questions display in order based on their `order` field (lowest to highest).

**Basic Questions:** Order 1-7
**Advanced Questions:** Order 1-5 (separate from basic)

To reorder, just change the order numbers and re-upload.
