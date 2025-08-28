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
    subject: "Verify your email address - Tasty Creative",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <div style="background-color: #f9fafb; padding: 40px 20px;">
            <!-- Main Container -->
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 48px 40px; text-align: center; border-bottom: 1px solid #fce7f3;">
                <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">
                  Verify Your Email
                </h1>
                <p style="margin: 0; font-size: 16px; color: #6b7280;">
                  Welcome to <span style="font-weight: 600; color: #ec4899;">Tasty Creative</span>
                </p>
              </div>
              
              <!-- Body Content -->
              <div style="padding: 48px 40px;">
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  Thanks for signing up! Please verify your email address to get started with your account.
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; transition: all 0.3s ease;">
                    Verify Email Address
                  </a>
                </div>
                
                <!-- Divider -->
                <div style="margin: 40px 0; border-top: 1px solid #e5e7eb;"></div>
                
                <!-- Alternative link -->
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">
                    Or copy and paste this link into your browser:
                  </p>
                  <p style="margin: 0; font-size: 14px; word-break: break-all;">
                    <a href="${verificationUrl}" style="color: #ec4899; text-decoration: none;">
                      ${verificationUrl}
                    </a>
                  </p>
                </div>
                
                <!-- Footer text -->
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  If you didn't create an account with Tasty Creative, you can safely ignore this email.
                </p>
                
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  <strong>Note:</strong> This verification link will expire in 24 hours for security reasons.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
                  Tasty Creative
                </p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  Creating amazing content experiences
                </p>
                
                <!-- Social links placeholder -->
                <div style="margin-top: 20px;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    © ${new Date().getFullYear()} Tasty Creative. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Email footer -->
            <div style="text-align: center; margin-top: 32px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 18px;">
                This email was sent to ${email}<br>
                You received this email because you signed up for Tasty Creative.
              </p>
            </div>
          </div>
        </body>
      </html>
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
export async function sendRoleElevationEmail({
  to,
  userName,
  oldRole,
  newRole,
}: {
  to: string;
  userName: string;
  oldRole: string;
  newRole: string;
}) {
  const roleDisplayNames: Record<string, string> = {
    GUEST: "Guest",
    USER: "User",
    MODERATOR: "Moderator", 
    ADMIN: "Administrator",
    SWD: "SWD Team Member"
  }

  const roleDescriptions: Record<string, string> = {
    USER: "You now have access to all basic features and can fully participate in the platform.",
    MODERATOR: "You can now help moderate content and assist other users on the platform.",
    ADMIN: "You now have administrative privileges to manage users and platform settings.",
    SWD: "You now have access to SWD-specific tools and content management features."
  }

  const oldRoleDisplay = roleDisplayNames[oldRole] || oldRole
  const newRoleDisplay = roleDisplayNames[newRole] || newRole
  const roleDescription = roleDescriptions[newRole] || "You now have elevated access to additional features."

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Your role has been elevated to ${newRoleDisplay} - Tasty Creative`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Role Elevation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <div style="background-color: #f9fafb; padding: 40px 20px;">
            <!-- Main Container -->
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 48px 40px; text-align: center; border-bottom: 1px solid #bfdbfe;">
                <div style="background-color: #3b82f6; width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                  <svg style="width: 32px; height: 32px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">
                  Congratulations!
                </h1>
                <p style="margin: 0; font-size: 18px; color: #374151; font-weight: 500;">
                  Your role has been elevated
                </p>
              </div>
              
              <!-- Body Content -->
              <div style="padding: 48px 40px;">
                <p style="margin: 0 0 24px 0; font-size: 18px; line-height: 28px; color: #111827; font-weight: 600;">
                  Hello ${userName},
                </p>
                
                <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  Great news! Your account role on <strong style="color: #ec4899;">Tasty Creative</strong> has been updated.
                </p>
                
                <!-- Role Change Card -->
                <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #0284c7; border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap;">
                    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 20px;">
                      <p style="margin: 0; font-size: 14px; color: #991b1b; font-weight: 600;">Previous Role</p>
                      <p style="margin: 4px 0 0 0; font-size: 16px; color: #dc2626; font-weight: 700;">${oldRoleDisplay}</p>
                    </div>
                    
                    <svg style="width: 24px; height: 24px; color: #0284c7;" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                    
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 20px;">
                      <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 600;">New Role</p>
                      <p style="margin: 4px 0 0 0; font-size: 16px; color: #16a34a; font-weight: 700;">${newRoleDisplay}</p>
                    </div>
                  </div>
                </div>
                
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  ${roleDescription}
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Access Your Account
                  </a>
                </div>
                
                <!-- Divider -->
                <div style="margin: 40px 0; border-top: 1px solid #e5e7eb;"></div>
                
                <!-- Additional Info -->
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">
                    <strong>What's next?</strong>
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                    Log in to your account to explore your new permissions and features. If you have any questions about your new role, feel free to contact our support team.
                  </p>
                </div>
                
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  This change was made by an administrator. If you believe this was done in error, please contact support immediately.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
                  Tasty Creative
                </p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  Creating amazing content experiences
                </p>
                
                <div style="margin-top: 20px;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    © ${new Date().getFullYear()} Tasty Creative. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Email footer -->
            <div style="text-align: center; margin-top: 32px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 18px;">
                This email was sent to ${to}<br>
                You received this notification because your account role was updated.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

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
