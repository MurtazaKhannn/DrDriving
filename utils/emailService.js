const nodemailer = require('nodemailer');

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Function to send payment receipt to patient
const sendPatientReceipt = async (patientEmail, appointmentDetails) => {
  const { patientName, doctorName, date, time, amount, paymentId } = appointmentDetails;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patientEmail,
    subject: 'Payment Receipt - DrDriving Medical Appointment',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2B6CB0;">Payment Receipt</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          <p><strong>Dear ${patientName},</strong></p>
          <p>Thank you for your payment. Here are your appointment and payment details:</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 5px;">
            <h3 style="color: #2B6CB0; margin-top: 0;">Appointment Details</h3>
            <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${time}</p>
          </div>

          <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 5px;">
            <h3 style="color: #2B6CB0; margin-top: 0;">Payment Details</h3>
            <p><strong>Amount Paid:</strong> $${amount}</p>
            <p><strong>Payment ID:</strong> ${paymentId}</p>
            <p><strong>Status:</strong> <span style="color: green;">Completed</span></p>
          </div>

          <p>Please keep this receipt for your records.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Payment receipt email sent to patient successfully');
    return true;
  } catch (error) {
    console.error('Error sending payment receipt email to patient:', error);
    return false;
  }
};

// Function to send payment notification to doctor
const sendDoctorNotification = async (doctorEmail, appointmentDetails) => {
  const { patientName, doctorName, date, time, amount, paymentId } = appointmentDetails;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: doctorEmail,
    subject: 'Payment Received - New Appointment',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2B6CB0;">Payment Received</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          <p><strong>Dear Dr. ${doctorName},</strong></p>
          <p>A payment has been received for an upcoming appointment. Here are the details:</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 5px;">
            <h3 style="color: #2B6CB0; margin-top: 0;">Appointment Details</h3>
            <p><strong>Patient:</strong> ${patientName}</p>
            <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${time}</p>
          </div>

          <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 5px;">
            <h3 style="color: #2B6CB0; margin-top: 0;">Payment Details</h3>
            <p><strong>Amount Received:</strong> $${amount}</p>
            <p><strong>Payment ID:</strong> ${paymentId}</p>
            <p><strong>Status:</strong> <span style="color: green;">Completed</span></p>
          </div>

          <p>Please ensure you're available for this appointment.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Payment notification email sent to doctor successfully');
    return true;
  } catch (error) {
    console.error('Error sending payment notification email to doctor:', error);
    return false;
  }
};

module.exports = {
  sendPatientReceipt,
  sendDoctorNotification
}; 