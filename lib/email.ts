import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use app password for Gmail
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your email address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Verify your email address</h1>
        <p>Click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px;">
          Verify Email
        </a>
        <p style="color: #666; margin-top: 20px;">
          If you didn't request this email, you can safely ignore it.
        </p>
        <p style="color: #666;">
          This link will expire in 24 hours.
        </p>
      </div>
    `,
  });
}

interface FormSubmissionEmailParams {
  to: string;
  formTitle: string;
  submitterName: string;
  submitterEmail: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submissionData: Record<string, any>;
  formResultsUrl: string;
}

export async function sendFormSubmissionEmail({
  to,
  formTitle,
  submitterName,
  submitterEmail,
  submissionData,
  formResultsUrl,
}: FormSubmissionEmailParams) {
  // Format submission data for email
  const formattedData = Object.entries(submissionData)
    .filter(([key]) => key !== "User" && key !== "Timestamp")
    .map(
      ([key, value]) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">
          ${key}:
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
          ${value || "N/A"}
        </td>
      </tr>
    `
    )
    .join("");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
      <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(to right, #3b82f6, #6366f1); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
            New Form Submission
          </h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">
            ${formTitle}
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
            <p style="margin: 0; color: #1e40af; font-weight: 600;">Submission Details</p>
            <p style="margin: 8px 0 0 0; color: #3730a3;">
              <strong>From:</strong> ${submitterName} (${submitterEmail})<br>
              <strong>Date:</strong> ${new Date(submissionData.Timestamp).toLocaleString()}
            </p>
          </div>
          
          <h2 style="color: #111827; font-size: 20px; margin-bottom: 16px;">Form Responses</h2>
          
          <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
            <tbody>
              ${formattedData}
            </tbody>
          </table>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${formResultsUrl}" 
               style="display: inline-block; padding: 12px 32px; background: linear-gradient(to right, #3b82f6, #6366f1); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              View All Responses
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px; text-align: center;">
            You received this email because someone submitted your form "${formTitle}".
          </p>
        </div>
      </div>
    </div>
  `;

  const emailText = `
New Form Submission - ${formTitle}

Submitted by: ${submitterName} (${submitterEmail})
Date: ${new Date(submissionData.Timestamp).toLocaleString()}

Form Responses:
${Object.entries(submissionData)
  .filter(([key]) => key !== "User" && key !== "Timestamp")
  .map(([key, value]) => `${key}: ${value || "N/A"}`)
  .join("\n")}

View all responses: ${formResultsUrl}

You received this email because someone submitted your form "${formTitle}".
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `New submission: ${formTitle}`,
    text: emailText,
    html: emailHtml,
  });
}

// Optional: Send a confirmation email to the submitter
export async function sendSubmissionConfirmationEmail({
  to,
  formTitle,
  submissionData,
}: {
  to: string;
  formTitle: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submissionData: Record<string, any>;
}) {
  const formattedData = Object.entries(submissionData)
    .filter(([key]) => key !== "User" && key !== "Timestamp")
    .map(
      ([key, value]) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">
          ${key}:
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
          ${value || "N/A"}
        </td>
      </tr>
    `
    )
    .join("");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
      <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(to right, #10b981, #059669); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
            Thank You!
          </h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">
            Your submission has been received
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
            Thank you for submitting <strong>"${formTitle}"</strong>. We've received your response and sent a copy to the form creator.
          </p>
          
          <h2 style="color: #111827; font-size: 20px; margin-bottom: 16px;">Your Submission</h2>
          
          <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
            <tbody>
              ${formattedData}
            </tbody>
          </table>
          
          <div style="background-color: #f3f4f6; padding: 16px; margin-top: 24px; border-radius: 6px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              <strong>Submitted on:</strong> ${new Date(submissionData.Timestamp).toLocaleString()}
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px; text-align: center;">
            Please keep this email for your records.
          </p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Confirmation: ${formTitle}`,
    html: emailHtml,
  });
}
