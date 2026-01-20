import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

interface InterventionData {
  studentId: string;
  type: string;
  riskScore: number;
  reason: string;
  createdAt?: any;
}

/**
 * POST /api/send-intervention-alert
 * Sends email alerts when high-risk interventions are created
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Resend at runtime
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY not set - alerts will be logged but not sent');
      return NextResponse.json(
        { warning: 'Email service not configured - contact administrator' },
        { status: 200 }
      );
    }

    const resend = new Resend(apiKey);
    const body = await request.json();
    const { interventionId, intervention }: { interventionId: string; intervention: InterventionData } = body;

    console.log('📧 Intervention alert received:', { interventionId, riskScore: intervention.riskScore });

    // Only send alerts for high-risk students
    if (intervention.riskScore < 70) {
      console.log('⏭️ Risk score below threshold, skipping alert');
      return NextResponse.json({ skipped: true, reason: 'Risk score below 70' }, { status: 200 });
    }

    // Fetch student details
    const studentRef = doc(db, 'users', intervention.studentId);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
      console.error('❌ Student not found:', intervention.studentId);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = studentSnap.data();

    // Fetch all admins
    const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
    const adminsSnap = await getDocs(adminsQuery);

    if (adminsSnap.empty) {
      console.error('❌ No admins found in database');
      return NextResponse.json({ error: 'No admins to notify' }, { status: 400 });
    }

    const admins = adminsSnap.docs.map((doc) => doc.data());

    // Send emails to all admins
    const emailPromises = admins.map((admin) =>
      resend.emails.send({
        from: 'KCAU Alerts <onboarding@resend.dev>',
        to: admin.email,
        subject: `🚨 High-Risk Student Alert: ${student.name} (Score: ${intervention.riskScore})`,
        html: generateAdminAlertHTML(student, intervention),
      })
    );

    await Promise.all(emailPromises);
    console.log(`✅ Alerts sent to ${admins.length} admins`);

    // Special handling for counselor referrals
    if (intervention.type === 'counselor-referral') {
      const counselorsQuery = query(collection(db, 'users'), where('role', '==', 'counselor'));
      const counselorsSnap = await getDocs(counselorsQuery);

      if (!counselorsSnap.empty) {
        const counselors = counselorsSnap.docs.map((doc) => doc.data());
        const counselorPromises = counselors.map((counselor) =>
          resend.emails.send({
            from: 'KCAU Alerts <onboarding@resend.dev>',
            to: counselor.email,
            subject: `🔴 URGENT: Counselor Referral - ${student.name}`,
            html: generateCounselorAlertHTML(student, intervention),
          })
        );

        await Promise.all(counselorPromises);
        console.log(`✅ Urgent counselor alerts sent to ${counselors.length} counselors`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Alerts sent successfully',
        adminsNotified: admins.length,
        counselorsNotified: intervention.type === 'counselor-referral' ? adminsSnap.size : 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error sending intervention alert:', error);
    return NextResponse.json(
      {
        error: 'Failed to send alerts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate professional HTML email for admin alerts
 */
function generateAdminAlertHTML(student: any, intervention: InterventionData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .alert-badge { display: inline-block; background: #dc2626; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .details { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; }
          .cta-button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0 0 10px 0;">KCAU Platform Alert</h2>
            <p style="margin: 0;"><span class="alert-badge">HIGH RISK</span></p>
          </div>

          <p>A high-risk student intervention has been flagged and requires your attention.</p>

          <div class="details">
            <div class="detail-row">
              <span class="label">Student Name:</span>
              <span class="value">${student.name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Risk Score:</span>
              <span class="value" style="color: #dc2626; font-weight: bold;">${intervention.riskScore}/100</span>
            </div>
            <div class="detail-row">
              <span class="label">Intervention Type:</span>
              <span class="value">${intervention.type.replace(/-/g, ' ').toUpperCase()}</span>
            </div>
            <div class="detail-row">
              <span class="label">Reason:</span>
              <span class="value">${intervention.reason}</span>
            </div>
          </div>

          <p>Please review this intervention immediately and take appropriate action.</p>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kcau.vercel.app'}/admin/interventions" class="cta-button">
            View Intervention Details
          </a>

          <div class="footer">
            <p>This is an automated alert from KCAU Platform. Do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate urgent HTML email for counselor referrals
 */
function generateCounselorAlertHTML(student: any, intervention: InterventionData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #b91c1c; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .urgent-badge { display: inline-block; background: #dc2626; color: white; padding: 6px 16px; border-radius: 4px; font-size: 14px; font-weight: bold; }
          .details { background: #fee2e2; border-left: 4px solid #b91c1c; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #7f1d1d; }
          .value { color: #333; }
          .cta-button { display: inline-block; background: #b91c1c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0 0 10px 0;">🔴 URGENT: Counselor Referral</h2>
            <p style="margin: 0; font-size: 14px;">Immediate action required</p>
          </div>

          <p style="color: #dc2626; font-weight: bold;">A student has been referred to counseling services. Please review immediately.</p>

          <div class="details">
            <div class="detail-row">
              <span class="label">Student Name:</span>
              <span class="value">${student.name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Risk Score:</span>
              <span class="value" style="color: #b91c1c; font-weight: bold;">${intervention.riskScore}/100</span>
            </div>
            <div class="detail-row">
              <span class="label">Referral Reason:</span>
              <span class="value">${intervention.reason}</span>
            </div>
          </div>

          <p><strong>Action Required:</strong> Please schedule a counseling session with this student as soon as possible.</p>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kcau.vercel.app'}/admin/interventions" class="cta-button">
            Access Student Profile
          </a>

          <div class="footer">
            <p>This is an urgent alert from KCAU Platform. Please take action promptly.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
