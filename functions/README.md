# Quick Start: Email Alert System Setup

## 5-Minute Setup

### 1️⃣ Create Gmail App Password (2 minutes)
```
1. Open: https://myaccount.google.com/security
2. Click: "App passwords" (if 2FA not enabled, enable it first)
3. Select: Mail → Your Device
4. Generate → Copy 16-char password
```

### 2️⃣ Configure Credentials (1 minute)
```bash
cd functions
cat > .env.local << EOF
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
APP_URL=https://your-vercel-url.com
EOF
```

### 3️⃣ Deploy Functions (2 minutes)
```bash
firebase login          # One-time authentication
firebase deploy --only functions
```

### ✅ Done! 
Emails now send automatically when interventions are created with `riskScore >= 70`.

## Testing

### Quick Test (No Code Needed):
1. Open [Firebase Console](https://console.firebase.google.com)
2. Go to: Firestore → `interventions` collection
3. Create new document:
   ```json
   {
     "studentId": "any-existing-student-id",
     "type": "academic-support",
     "riskScore": 85,
     "reason": "Test"
   }
   ```
4. Check your Gmail inbox → 📧 Email arrives!

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "GMAIL_USER is undefined" | `cat functions/.env.local` to verify |
| "Failed to create transporter" | Gmail password is wrong (use app password, not regular password) |
| Emails not arriving | Check spam folder, verify admin emails exist in `users` collection |
| Function deploy fails | Run `npm install` in functions dir, then retry |

## What Gets Emailed?

**To:** All users with role `admin`
**When:** New intervention created with `riskScore >= 70`
**Content:**
- Student name and ID
- Risk score
- Intervention type
- Reason
- Link to dashboard

**Special:** Counselor alerts sent separately if type = `counselor-referral`

## Next Features

After email alerts working:
1. Auto-trigger interventions based on risk threshold
2. CSV/PDF report exports
3. Email preference management

---

**Full guide:** See `FUNCTIONS_DEPLOYMENT.md` for detailed troubleshooting & production setup.
