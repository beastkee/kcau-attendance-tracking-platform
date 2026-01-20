# 📋 EMAIL ALERT DEPLOYMENT - QUICK REFERENCE

## 🎯 In One Sentence
Enable automatic professional emails whenever a high-risk student intervention is created.

---

## ⚡ Quick Deploy (13 minutes)

```bash
# Step 1: Get Gmail app password
# → https://myaccount.google.com/security → App passwords → Generate

# Step 2: Create credentials file
cd functions
cat > .env.local << EOF
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
APP_URL=https://your-vercel-url.com
EOF

# Step 3: Deploy
firebase login
firebase deploy --only functions

# Step 4: Test
# → Create intervention in Firestore with riskScore >= 70
# → Check email inbox in 30 seconds
```

---

## 📧 What Gets Emailed

**To:** All admin users  
**When:** New intervention with riskScore >= 70  
**Contains:** Student name, risk score, intervention type, reason  
**Format:** Professional HTML with action link

**Special:** Counselor gets separate urgent alert if type = "counselor-referral"

---

## 🔍 Verify Deployment

```bash
# Check functions deployed
firebase functions:log

# Monitor real-time logs
firebase functions:log --follow

# Check Firebase Console
# → https://console.firebase.google.com
# → Your project → Functions
```

---

## ✅ Success Checklist

- [ ] functions/.env.local created with 3 variables
- [ ] `firebase deploy --only functions` completed
- [ ] Firebase Console shows 2 functions
- [ ] Test intervention created (riskScore >= 70)
- [ ] Email arrives in inbox
- [ ] HTML formatting looks professional
- [ ] No errors in function logs

---

## 🚫 Common Issues

| Issue | Fix |
|-------|-----|
| "GMAIL_USER undefined" | Create .env.local file |
| "Failed to authenticate" | Use app password, not regular password |
| Email not arriving | Check spam folder, verify admin emails |
| Deploy fails | Run `firebase login` again |

---

## 📚 Full Guides

- **Quick Start:** `functions/README.md`
- **Setup Guide:** `FUNCTIONS_DEPLOYMENT.md`
- **Architecture:** `EMAIL_ALERT_IMPLEMENTATION.md`
- **Action Steps:** `DEPLOY_EMAIL_ALERTS_NOW.md` ← Start here!

---

## 🔒 Security

- Never commit `.env.local` (it's in .gitignore)
- Never share Gmail app password
- Use app password, not regular password
- Enable 2FA on Gmail account

---

## 🎮 Next Steps After Email Works

1. **Automated Triggers** (2-3 days)
   - Auto-create interventions when metrics drop
   - Auto-send alerts using this email system

2. **Reports** (1-2 days)
   - CSV exports of attendance/risk data
   - Charts and trends

3. **Launch** (2-3 days)
   - Polish UI
   - Deploy to Vercel
   - v1.0 release

---

**Status:** Ready to deploy  
**Effort:** 13 minutes  
**Impact:** Major competitive differentiator  
**Next:** Get Gmail app password → Run commands above → Done!
