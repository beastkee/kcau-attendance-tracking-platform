# Email Alerts Setup - Resend + Vercel

**Status:** Ready to deploy - No cost, free tier covers your needs

## Quick Start (5 minutes)

### 1. Get Resend API Key

1. Go to: https://resend.com
2. Sign up (free account)
3. Go to dashboard → API Keys
4. Copy your API key

### 2. Add Environment Variable

Add to `.env.local`:
```env
RESEND_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=https://your-vercel-url.com
```

### 3. Test Locally

```bash
npm run dev
```

Then create a test intervention in your admin panel with `riskScore >= 70` and check for emails.

### 4. Deploy to Vercel

```bash
git add .
git commit -m "feat: add email alerts via Resend API"
git push origin main
```

Vercel auto-deploys. Add the `RESEND_API_KEY` in Vercel dashboard → Settings → Environment Variables.

## How It Works

1. **User creates intervention** in admin panel
2. **API endpoint** (`/api/send-intervention-alert`) is called
3. **Resend API** sends emails to all admins
4. **Special handling** for counselor referrals
5. **Logs** are recorded for monitoring

## File Structure

```
src/
├── app/
│   └── api/
│       └── send-intervention-alert/
│           └── route.ts          # Email API endpoint
└── lib/
    └── alertTrigger.ts           # Helper to trigger alerts
```

## Integration

To use alerts in your code:

```typescript
import { triggerInterventionAlert } from '@/lib/alertTrigger';

// When creating an intervention
const interventionRef = doc(collection(db, 'interventions'));
await setDoc(interventionRef, {
  studentId: 'student-123',
  type: 'academic-support',
  riskScore: 85,
  reason: 'Missing assignments',
  createdAt: new Date(),
});

// Trigger the alert
await triggerInterventionAlert(interventionRef.id, {
  studentId: 'student-123',
  type: 'academic-support',
  riskScore: 85,
  reason: 'Missing assignments',
  createdAt: new Date(),
});
```

## Pricing

**Completely Free:**
- 100 emails/day forever (free tier)
- No credit card required initially
- You get way more than enough for a school platform

## Troubleshooting

### Emails not sending?

1. Check `RESEND_API_KEY` is set in `.env.local`
2. Verify admin users have valid email addresses in Firestore
3. Check browser console for error messages
4. Look at server logs in Vercel dashboard

### "RESEND_API_KEY is undefined"?

Make sure `.env.local` has your API key:
```bash
cat .env.local | grep RESEND_API_KEY
```

### Emails going to spam?

This is normal for first deployment. Resend has good reputation - most emails go to inbox.

## Next Steps

1. Get Resend API key
2. Add to `.env.local`
3. Test locally
4. Deploy to Vercel
5. Emails live!

---

**Total Setup Time:** 5-10 minutes  
**Cost:** $0 (free tier)  
**Ready to deploy:** Yes
