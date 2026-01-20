# Email Alert System - Firebase Cloud Functions Deployment

## Overview
This guide covers deploying the automated email alert system to Firebase Cloud Functions. Emails are sent when high-risk student interventions are created (risk score ≥ 70).

## Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Active Firebase project configured in `firebase.json`
- Gmail account (for SMTP email delivery)

## Step 1: Get Gmail App Password

The email system uses Gmail's SMTP server for reliable email delivery. You need an app-specific password (NOT your regular Gmail password).

### Generate Gmail App Password:
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in left sidebar
3. Enable **2-Step Verification** if not already enabled
4. Scroll down and find **App passwords**
5. Select **Mail** and **Windows Computer** (or your device)
6. Click **Generate**
7. Copy the 16-character password (without spaces)

**Important:** This password is only shown once. Copy and save it immediately.

## Step 2: Configure Environment Variables

### Create `.env.local` in the functions directory:
```bash
cd functions
touch .env.local
```

### Edit `functions/.env.local`:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
APP_URL=https://your-vercel-url.com
```

**Variables:**
- `GMAIL_USER`: Your Gmail address (the "from" address for emails)
- `GMAIL_PASSWORD`: 16-character app password from Step 1
- `APP_URL`: Your Vercel deployment URL (e.g., `https://kcau.vercel.app`)
  - Used in email action buttons to link back to the platform

### Security Note:
- `.env.local` is in `.gitignore` - never commit credentials
- Firebase Functions can also use Secret Manager for production
- For now, `.env.local` works for local development and deployment

## Step 3: Deploy Cloud Functions

### Authenticate with Firebase:
```bash
firebase login
```

### Deploy functions:
```bash
cd /home/beast/PROJECTS/kcau-attendance-tracking-platform
firebase deploy --only functions
```

Expected output:
```
✔ functions: Deploying functions
✔ functions[sendInterventionAlert(us-central1)]: Existing function updated
✔ functions[sendRiskIncreaseAlert(us-central1)]: Existing function updated
✔ Deploy complete
```

## Step 4: Verify Deployment

### Check Firebase Console:
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select your KCAU project
3. Click **Functions** in left sidebar
4. You should see:
   - `sendInterventionAlert` (primary function)
   - `sendRiskIncreaseAlert` (placeholder)

### Check Logs:
```bash
firebase functions:log
```

## Step 5: Test Email System

### Test Approach 1: Firebase Emulator (Recommended for Development)
```bash
# Terminal 1: Start emulators
cd functions
npm run serve

# Terminal 2: Trigger test in your app
# Create an intervention with riskScore >= 70 in Firestore
```

### Test Approach 2: Live Firestore
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select KCAU project → Firestore Database
3. Create a test document in `interventions` collection:
   ```json
   {
     "studentId": "test-student-123",
     "type": "academic-support",
     "riskScore": 85,
     "reason": "Test intervention",
     "createdAt": "2026-01-20T12:00:00Z"
   }
   ```
4. Check your Gmail inbox within 30 seconds
5. Expected: Email from `your-email@gmail.com` with student details

## Function Details

### Primary Function: `sendInterventionAlert`
- **Trigger:** Firestore collection `interventions` → `onCreate` event
- **Conditions:**
  - Only fires when `riskScore >= 70`
  - Skips alerts for lower-risk interventions
- **Recipients:**
  - All users with role `admin`
  - Users with role `counselor` (if intervention type is `counselor-referral`)
- **Email Format:**
  - HTML-formatted for readability
  - Includes student name, risk score, intervention type
  - Contains action button linking to intervention dashboard
- **Error Handling:**
  - Logs all errors to Firebase Functions console
  - Catches missing students, admins, or Firestore issues
  - Won't fail deployment if email fails (logged instead)

### Secondary Function: `sendRiskIncreaseAlert`
- **Status:** Framework in place
- **Future Use:** Track when student risk score increases significantly
- **Currently:** Placeholder - implement as needed

## Troubleshooting

### Issue: "GMAIL_USER is undefined"
**Solution:** Ensure `.env.local` exists with `GMAIL_USER` set
```bash
cat functions/.env.local  # Verify file contents
```

### Issue: "Permission denied" on Firestore read
**Solution:** Update Firestore security rules to allow Cloud Functions to read
```javascript
// In Firebase Console → Firestore → Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null || request.auth.token.firebase.sign_in_provider == 'custom';
    }
  }
}
```

### Issue: "Invalid sender email"
**Solution:** Verify the Gmail account in `GMAIL_USER` has:
- 2-Step Verification enabled
- App-specific password generated (not regular password)
- Account not locked for security reasons

### Issue: Emails not arriving
**Solution:** Check:
1. Admin/counselor email addresses in Firestore `users` collection are correct
2. Function logs: `firebase functions:log` (look for delivery status)
3. Gmail spam folder (may be caught as spam initially)
4. Intervention `riskScore` is >= 70 (lower scores don't trigger alerts)

## Production Configuration (Optional)

For production deployments, use Firebase Secret Manager instead of `.env.local`:

```bash
# Store secrets securely
gcloud secrets create GMAIL_USER --data-file=-
gcloud secrets create GMAIL_PASSWORD --data-file=-

# Reference in function (update index.js)
const secret = await client.secretManager.accessSecretVersion({
  name: `projects/${projectId}/secrets/GMAIL_USER/versions/latest`,
});
```

See [Firebase Secret Manager documentation](https://cloud.google.com/secret-manager/docs) for details.

## Monitoring & Maintenance

### View Real-time Logs:
```bash
firebase functions:log --follow
```

### Performance Metrics:
- Go to Firebase Console → Functions → Insights
- Monitor: Execution count, average duration, error rate
- Target: < 100ms per function, 0% error rate

### Email Delivery Rate:
- Check: Gmail sent/spam rates in Gmail Admin Console
- Monitor: Bounce rate and SMTP issues
- Adjust: Email content if marked as spam frequently

## Rollback

If you need to disable the email system temporarily:

```bash
# Delete specific function
firebase functions:delete sendInterventionAlert

# Or redeploy without functions
firebase deploy --except functions
```

## Next Steps

1. ✅ Deploy functions (you are here)
2. Test email delivery with Firestore
3. Implement automated intervention triggers
4. Build reports (CSV, PDF export)
5. Launch v1.0 with email alerts

---

**Last Updated:** January 20, 2026  
**Status:** ✅ Ready for Deployment
