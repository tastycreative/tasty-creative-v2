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
export async function sendCommentNotificationEmail({
  to,
  postOwnerName,
  commenterName,
  postTitle,
  commentContent,
  postUrl,
}: {
  to: string;
  postOwnerName: string;
  commenterName: string;
  postTitle: string;
  commentContent: string;
  postUrl: string;
}) {
  // Truncate comment if it's too long for email
  const truncatedComment = commentContent.length > 200 
    ? commentContent.substring(0, 200) + "..." 
    : commentContent;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `New comment on your post: ${postTitle} - Tasty Creative`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Comment Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <div style="background-color: #f9fafb; padding: 40px 20px;">
            <!-- Main Container -->
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 48px 40px; text-align: center; border-bottom: 1px solid #fce7f3;">
                <svg
                  style="margin: 0 auto 16px; height: 48px; width: 48px; color: #ec4899;"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">
                  New Comment!
                </h1>
                <p style="margin: 0; font-size: 16px; color: #6b7280;">
                  Someone commented on your post at <span style="font-weight: 600; color: #ec4899;">Tasty Creative</span>
                </p>
              </div>
              
              <!-- Body Content -->
              <div style="padding: 48px 40px;">
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  Hello <strong>${postOwnerName}</strong>,
                </p>
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  <strong>${commenterName}</strong> just left a comment on your post!
                </p>
                
                <!-- Post Title -->
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin: 32px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    Your Post
                  </p>
                  <h3 style="margin: 0; font-size: 18px; color: #111827; font-weight: 600; line-height: 24px;">
                    ${postTitle}
                  </h3>
                </div>
                
                <!-- Comment Content -->
                <div style="background-color: #fef7ff; border: 1px solid #f3e8ff; border-radius: 8px; padding: 24px; margin: 32px 0;">
                  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      <span style="color: white; font-size: 12px; font-weight: bold; line-height: 1; text-align: center;">
                        ${commenterName.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span style="font-size: 14px; color: #6b7280; font-weight: 600;">
                      ${commenterName} commented:
                    </span>
                  </div>
                  <p style="margin: 0; font-size: 14px; color: #374151; line-height: 20px; font-style: italic;">
                    "${truncatedComment}"
                  </p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${postUrl}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; transition: all 0.3s ease;">
                    View Comment & Reply
                  </a>
                </div>
                
                <!-- Divider -->
                <div style="margin: 40px 0; border-top: 1px solid #e5e7eb;"></div>
                
                <!-- Additional Information -->
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">
                    <strong>Stay engaged!</strong>
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                    Click the button above to view the full comment and join the conversation. You can reply directly to keep the discussion going!
                  </p>
                </div>
                
                <!-- Footer text -->
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  You're receiving this notification because someone commented on your post. You can manage your notification preferences in your account settings.
                </p>
                
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  <strong>Note:</strong> This is an automated notification from the Tasty Creative forum system.
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
                This email was sent to ${to}<br>
                You received this notification because someone commented on your forum post.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

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
          <title>Role Elevation Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <div style="background-color: #f9fafb; padding: 40px 20px;">
            <!-- Main Container -->
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 48px 40px; text-align: center; border-bottom: 1px solid #fce7f3;">
                <svg
                  className="mx-auto h-12 w-12 text-pink-600"
                  style="margin: 0 auto 16px; height: 48px; width: 48px; color: #ec4899;"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">
                  Congratulations!
                </h1>
                <p style="margin: 0; font-size: 16px; color: #6b7280;">
                  Your role has been elevated on <span style="font-weight: 600; color: #ec4899;">Tasty Creative</span>
                </p>
              </div>
              
              <!-- Body Content -->
              <div style="padding: 48px 40px;">
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  Hello <strong>${userName}</strong>,
                </p>
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  Great news! Your account permissions have been updated, and you now have enhanced access to our platform.
                </p>
                
                <!-- Role Change Section -->
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin: 32px 0;">
                  <div style="text-align: center;">
                    <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Role Update
                    </p>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap;">
                      <div style="background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 20px; min-width: 100px;">
                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #991b1b; font-weight: 600;">Previous</p>
                        <p style="margin: 0; font-size: 16px; color: #dc2626; font-weight: 700;">${oldRoleDisplay}</p>
                      </div>
                      <div style="color: #6b7280;">→</div>
                      <div style="background-color: #d1fae5; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 20px; min-width: 100px;">
                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #166534; font-weight: 600;">New Role</p>
                        <p style="margin: 0; font-size: 16px; color: #16a34a; font-weight: 700;">${newRoleDisplay}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  ${roleDescription}
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; transition: all 0.3s ease;">
                    Access Your Account
                  </a>
                </div>
                
                <!-- Divider -->
                <div style="margin: 40px 0; border-top: 1px solid #e5e7eb;"></div>
                
                <!-- Additional Information -->
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">
                    <strong>What's next?</strong>
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                    Log in to your account to start exploring your new permissions and features. Your session will automatically update to reflect these changes.
                  </p>
                </div>
                
                <!-- Footer text -->
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  This role change was made by an administrator. If you have any questions or believe this was done in error, please contact our support team immediately.
                </p>
                
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  <strong>Note:</strong> If you're currently logged in, your session will automatically refresh to apply these new permissions.
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
