const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
admin.initializeApp();

// Configure email service
// Use environment variables for Gmail credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'your-email@gmail.com',
    pass: process.env.GMAIL_PASSWORD || 'your-app-password',
  },
});

/**
 * Trigger email alert when intervention is created for high-risk student
 */
exports.sendInterventionAlert = functions.firestore
  .document('interventions/{interventionId}')
  .onCreate(async (snap, context) => {
    const intervention = snap.data();
    
    console.log('📧 Intervention created, checking if alert needed:', intervention);
    
    // Only send alerts for high-risk students
    if (intervention.riskScore < 70) {
      console.log('⏭️ Risk score below threshold, skipping alert');
      return;
    }

    try {
      // Get student info
      const studentRef = await admin
        .firestore()
        .collection('users')
        .doc(intervention.studentId)
        .get();
      
      const student = studentRef.data();
      if (!student) {
        console.error('❌ Student not found:', intervention.studentId);
        return;
      }

      // Get all admins
      const adminsSnapshot = await admin
        .firestore()
        .collection('users')
        .where('role', '==', 'admin')
        .get();

      const admins = adminsSnapshot.docs.map(doc => doc.data());
      
      // Send alert emails to all admins
      for (const admin of admins) {
        if (!admin.email) continue;
        
        const mailOptions = {
          from: process.env.GMAIL_USER || 'your-email@gmail.com',
          to: admin.email,
          subject: `🚨 High-Risk Intervention Alert: ${student.name}`,
          html: generateAdminAlertHTML(student, intervention),
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Alert sent to admin: ${admin.email}`);
      }

      // If intervention is counselor referral, also alert counselor
      if (intervention.type === 'counselor-referral' && intervention.counselorId) {
        const counselor = await admin
          .firestore()
          .collection('users')
          .doc(intervention.counselorId)
          .get();
        
        if (counselor.exists && counselor.data().email) {
          const counselorMail = {
            from: process.env.GMAIL_USER || 'your-email@gmail.com',
            to: counselor.data().email,
            subject: `🚨 Urgent: Counselor Referral - ${student.name}`,
            html: generateCounselorAlertHTML(student, intervention),
          };
          
          await transporter.sendMail(counselorMail);
          console.log(`✅ Counselor alert sent to: ${counselor.data().email}`);
        }
      }

      console.log('✅ All alerts sent successfully');
    } catch (error) {
      console.error('❌ Error sending alerts:', error);
      throw error;
    }
  });

/**
 * Trigger email alert when student risk score increases significantly
 */
exports.sendRiskIncreaseAlert = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const oldData = change.before.data();
    const newData = change.after.data();

    // Only track if this is a student
    if (newData.role !== 'student') {
      return;
    }

    console.log('📊 Checking risk score changes...');
    // Risk score tracking would happen in separate update function
    // For now, this is placeholder for future enhancement
  });

/**
 * HTML template for admin alerts
 */
function generateAdminAlertHTML(student, intervention) {
  const riskLevel = intervention.riskScore >= 80 ? '🔴 CRITICAL' : '🟠 HIGH';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .stat { margin: 10px 0; }
        .stat-label { font-weight: bold; color: #666; }
        .stat-value { color: #333; font-size: 18px; }
        .action-button { background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .footer { font-size: 12px; color: #999; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚠️ High-Risk Student Alert</h2>
          <p>Immediate attention required</p>
        </div>
        
        <div class="content">
          <h3>Student Information</h3>
          <div class="stat">
            <span class="stat-label">Name:</span>
            <span class="stat-value">${student.name}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Email:</span>
            <span class="stat-value">${student.email}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Student ID:</span>
            <span class="stat-value">${student.identificationNumber || 'N/A'}</span>
          </div>

          <h3 style="margin-top: 20px;">Risk Assessment</h3>
          <div class="stat">
            <span class="stat-label">Risk Level:</span>
            <span class="stat-value">${riskLevel}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Risk Score:</span>
            <span class="stat-value">${intervention.riskScore}/100</span>
          </div>
          <div class="stat">
            <span class="stat-label">Reason:</span>
            <span class="stat-value">${intervention.reason}</span>
          </div>

          <h3 style="margin-top: 20px;">Recommended Actions</h3>
          <ul>
            <li>Contact student immediately to discuss attendance concerns</li>
            <li>Explore underlying issues (personal, health, academic)</li>
            <li>Establish an attendance improvement plan</li>
            <li>Schedule regular follow-up meetings</li>
            <li>Log intervention details in the system</li>
          </ul>
        </div>

        <a href="${process.env.APP_URL || 'https://your-app.com'}/admin/interventions" class="action-button">
          View Intervention Details
        </a>

        <div class="footer">
          <p>KCAU Attendance Tracking Platform - Automated Alert System</p>
          <p>This is an automated alert. Do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * HTML template for counselor alerts
 */
function generateCounselorAlertHTML(student, intervention) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #d32f2f; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .alert-box { background: #fff3cd; border-left: 4px solid #ff6b6b; padding: 15px; margin: 15px 0; }
        .action-button { background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .footer { font-size: 12px; color: #999; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🚨 Urgent: Counselor Referral Required</h2>
          <p>High-risk student intervention escalation</p>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <strong>Priority:</strong> URGENT<br/>
            Student is at significant risk and requires immediate counselor intervention.
          </div>

          <h3>Student Information</h3>
          <p>
            <strong>Name:</strong> ${student.name}<br/>
            <strong>Email:</strong> ${student.email}<br/>
            <strong>ID:</strong> ${student.identificationNumber || 'N/A'}
          </p>

          <h3>Risk Assessment</h3>
          <p>
            <strong>Risk Score:</strong> ${intervention.riskScore}/100 (CRITICAL)<br/>
            <strong>Concern:</strong> ${intervention.reason}<br/>
            <strong>Intervention Type:</strong> ${intervention.type}
          </p>

          <h3>Recommended Actions</h3>
          <ol>
            <li><strong>Schedule urgent meeting</strong> with the student</li>
            <li><strong>Assess underlying issues:</strong>
              <ul>
                <li>Personal/family circumstances</li>
                <li>Health concerns</li>
                <li>Financial difficulties</li>
                <li>Academic struggles</li>
              </ul>
            </li>
            <li><strong>Develop intervention plan</strong> with clear support measures</li>
            <li><strong>Coordinate with parents/guardians</strong> if appropriate</li>
            <li><strong>Consider academic accommodations</strong> or support services</li>
            <li><strong>Update intervention status</strong> in the system</li>
          </ol>

          <p><em>This student may be at risk of dropping out. Your immediate attention is critical.</em></p>
        </div>

        <a href="${process.env.APP_URL || 'https://your-app.com'}/admin/interventions" class="action-button">
          View Full Intervention Details
        </a>

        <div class="footer">
          <p>KCAU Attendance Tracking Platform - Counselor Alert System</p>
          <p>This is an urgent automated alert requiring immediate action.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
