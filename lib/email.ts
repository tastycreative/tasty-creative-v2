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

export async function sendSheetLinkNotificationEmail({
  to,
  modelName,
  sheetName,
  sheetUrl,
  sheetType,
  userWhoLinked,
}: {
  to: string;
  modelName: string;
  sheetName: string;
  sheetUrl: string;
  sheetType: string;
  userWhoLinked: string;
}) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `New sheet link added to ${modelName} - Tasty Creative`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Sheet Link Notification</title>
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">
                  New Sheet Link Added!
                </h1>
                <p style="margin: 0; font-size: 16px; color: #6b7280;">
                  A Google Sheet has been linked to <span style="font-weight: 600; color: #ec4899;">${modelName}</span>
                </p>
              </div>
              
              <!-- Body Content -->
              <div style="padding: 48px 40px;">
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  Hello team member,
                </p>
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  <strong>${userWhoLinked}</strong> has added a new Google Sheet link to <strong>${modelName}</strong>.
                </p>
                
                <!-- Sheet Details -->
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin: 32px 0;">
                  <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #111827; font-weight: 600;">
                    Sheet Details
                  </h3>
                  <div style="space-y: 12px;">
                    <div style="margin-bottom: 12px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Sheet Name
                      </p>
                      <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 600;">
                        ${sheetName}
                      </p>
                    </div>
                    <div style="margin-bottom: 12px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Sheet Type
                      </p>
                      <p style="margin: 0; font-size: 16px; color: #6366f1; font-weight: 600;">
                        ${sheetType}
                      </p>
                    </div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Model
                      </p>
                      <p style="margin: 0; font-size: 16px; color: #ec4899; font-weight: 600;">
                        ${modelName}
                      </p>
                    </div>
                  </div>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${sheetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; transition: all 0.3s ease;">
                    View Google Sheet
                  </a>
                </div>
                
                <!-- Divider -->
                <div style="margin: 40px 0; border-top: 1px solid #e5e7eb;"></div>
                
                <!-- Additional Information -->
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">
                    <strong>Stay organized!</strong>
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                    This sheet link has been added to ${modelName}'s profile. You can access it anytime from the model's sheet links section in the POD dashboard.
                  </p>
                </div>
                
                <!-- Footer text -->
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  You're receiving this notification because you're a member of the POD team assigned to ${modelName}.
                </p>
                
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  <strong>Note:</strong> This is an automated notification from the Tasty Creative POD system.
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
                You received this notification because a sheet link was added to your assigned model.
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

export async function sendColumnAssignmentNotificationEmail({
  to,
  userName,
  taskTitle,
  taskDescription,
  columnName,
  teamName,
  movedBy,
  priority,
  taskUrl,
}: {
  to: string;
  userName: string;
  taskTitle: string;
  taskDescription?: string;
  columnName: string;
  teamName: string;
  movedBy: string;
  priority: string;
  taskUrl?: string;
}) {
  // Truncate task description if it's too long for email
  const truncatedDescription = taskDescription && taskDescription.length > 150 
    ? taskDescription.substring(0, 150) + "..." 
    : taskDescription || "No description provided";

  // Priority color mapping
  const priorityColors: Record<string, { bg: string; text: string; badge: string }> = {
    HIGH: { bg: '#fef2f2', text: '#dc2626', badge: 'High Priority' },
    MEDIUM: { bg: '#fefbf2', text: '#d97706', badge: 'Medium Priority' },
    LOW: { bg: '#f0fdf4', text: '#16a34a', badge: 'Low Priority' },
  };
  
  const priorityColor = priorityColors[priority] || priorityColors.MEDIUM;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Task moved to your column: ${taskTitle} - Tasty Creative`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Assignment Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <div style="background-color: #f9fafb; padding: 40px 20px;">
            <!-- Main Container -->
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 48px 40px; text-align: center; border-bottom: 1px solid #e0f2fe;">
                <svg
                  style="margin: 0 auto 16px; height: 48px; width: 48px; color: #0ea5e9;"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12h4m-4 4h4m-4-8h4"
                  />
                </svg>
                <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">
                  Task Assignment
                </h1>
                <p style="margin: 0; font-size: 16px; color: #6b7280;">
                  A task has been moved to your assigned column in <span style="font-weight: 600; color: #0ea5e9;">${teamName}</span>
                </p>
              </div>
              
              <!-- Body Content -->
              <div style="padding: 48px 40px;">
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  Hello <strong>${userName}</strong>,
                </p>
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  <strong>${movedBy}</strong> just moved a task to your assigned column "<strong>${columnName}</strong>"!
                </p>
                
                <!-- Task Details -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; margin: 32px 0;">
                  <!-- Priority Badge -->
                  <div style="margin-bottom: 16px;">
                    <span style="background-color: ${priorityColor.bg}; color: ${priorityColor.text}; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${priorityColor.badge}
                    </span>
                  </div>
                  
                  <!-- Task Title -->
                  <h3 style="margin: 0 0 16px 0; font-size: 20px; color: #111827; font-weight: 700; line-height: 28px;">
                    ${taskTitle}
                  </h3>
                  
                  <!-- Task Description -->
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                    ${truncatedDescription}
                  </p>
                  
                  <!-- Column Info -->
                  <div style="background-color: #dbeafe; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-top: 20px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <svg
                        style="height: 20px; width: 20px; color: #2563eb; flex-shrink: 0;"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span style="font-size: 14px; color: #1e40af; font-weight: 600;">
                        Assigned to: ${columnName}
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- CTA Button -->
                ${taskUrl ? `
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${taskUrl}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; transition: all 0.3s ease;">
                    View Task Details
                  </a>
                </div>
                ` : ''}
                
                <!-- Divider -->
                <div style="margin: 40px 0; border-top: 1px solid #e5e7eb;"></div>
                
                <!-- Additional Information -->
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">
                    <strong>Next Steps:</strong>
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                    This task has been moved to a column you're responsible for. Please review the task details and take any necessary action to move it forward in your workflow.
                  </p>
                </div>
                
                <!-- Team Info -->
                <div style="background-color: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 20px;">
                    <strong>Team:</strong> ${teamName}<br>
                    <strong>Column:</strong> ${columnName}<br>
                    <strong>Moved by:</strong> ${movedBy}
                  </p>
                </div>
                
                <!-- Footer text -->
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  You're receiving this notification because you're assigned to the "${columnName}" column in the ${teamName} team board.
                </p>
                
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  <strong>Note:</strong> This is an automated notification from the Tasty Creative task management system.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
                  Tasty Creative
                </p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  Streamlining team collaboration
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
                You received this notification because a task was moved to your assigned column.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendMentionNotificationEmail({
  to,
  mentionedUserName,
  mentionerName,
  taskTitle,
  taskDescription,
  commentContent,
  teamName,
  taskUrl,
}: {
  to: string;
  mentionedUserName: string;
  mentionerName: string;
  taskTitle: string;
  taskDescription?: string | null;
  commentContent: string;
  teamName?: string | null;
  taskUrl: string;
}) {
  // Truncate comment if it's too long for email
  const truncatedComment = commentContent.length > 200 
    ? commentContent.substring(0, 200) + "..." 
    : commentContent;

  const truncatedDescription = taskDescription && taskDescription.length > 150
    ? taskDescription.substring(0, 150) + "..."
    : taskDescription;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `You were mentioned in "${taskTitle}" - Tasty Creative`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You were mentioned</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <div style="background-color: #f9fafb; padding: 40px 20px;">
            <!-- Main Container -->
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 48px 40px; text-align: center; border-bottom: 1px solid #dbeafe;">
                <svg
                  style="margin: 0 auto 16px; height: 48px; width: 48px; color: #3b82f6;"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
                <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">
                  You Were Mentioned!
                </h1>
                <p style="margin: 0; font-size: 16px; color: #6b7280;">
                  <span style="font-weight: 600; color: #3b82f6;">${mentionerName}</span> mentioned you in a comment
                </p>
              </div>
              
              <!-- Body Content -->
              <div style="padding: 48px 40px;">
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  Hi <span style="font-weight: 600; color: #3b82f6;">${mentionedUserName}</span>,
                </p>
                
                <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  You were mentioned in a comment on the task "<strong style="color: #111827;">${taskTitle}</strong>"${teamName ? ` in team <strong style="color: #111827;">${teamName}</strong>` : ''}.
                </p>

                ${truncatedDescription ? `
                  <div style="background-color: #f3f4f6; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Task Description
                    </h3>
                    <p style="margin: 0; font-size: 16px; line-height: 24px; color: #374151;">
                      ${truncatedDescription}
                    </p>
                  </div>
                ` : ''}
                
                <!-- Comment Box -->
                <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 0 12px 12px 0; padding: 24px; margin-bottom: 32px;">
                  <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${mentionerName}'s Comment
                    </h3>
                  </div>
                  <p style="margin: 0; font-size: 16px; line-height: 24px; color: #374151; font-style: italic;">
                    "${truncatedComment}"
                  </p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a
                    href="${taskUrl}"
                    style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; font-weight: 600; font-size: 16px; padding: 16px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25); transition: all 0.2s ease;"
                  >
                    View Task & Reply
                  </a>
                </div>
                
                <div style="text-align: center; margin-top: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #9ca3af;">
                    Or copy and paste this link: <br>
                    <span style="color: #3b82f6; word-break: break-all;">${taskUrl}</span>
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
                  This notification was sent because you were mentioned in a task comment.
                </p>
                
                <div style="display: flex; justify-content: center; align-items: center; gap: 16px; flex-wrap: wrap;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    © ${new Date().getFullYear()} Tasty Creative. All rights reserved.
                  </p>
                </div>
              </div>
              
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendOTPPTRTaskNotificationEmail({
  to,
  userName,
  taskTitle,
  taskDescription,
  submissionType,
  modelName,
  priority,
  teamName,
  taskUrl,
  createdByName,
  reason,
  columnLabel
}: {
  to: string;
  userName: string;
  taskTitle: string;
  taskDescription: string;
  submissionType: string;
  modelName: string;
  priority: string;
  teamName: string;
  taskUrl: string;
  createdByName: string;
  reason: string;
  columnLabel?: string;
}) {
  // Priority color mapping
  const priorityColors: Record<string, { bg: string; text: string; badge: string }> = {
    HIGH: { bg: '#fef2f2', text: '#dc2626', badge: 'High Priority' },
    MEDIUM: { bg: '#fefbf2', text: '#d97706', badge: 'Medium Priority' },
    LOW: { bg: '#f0fdf4', text: '#16a34a', badge: 'Low Priority' },
    URGENT: { bg: '#fef2f2', text: '#dc2626', badge: 'Urgent Priority' },
  };

  const priorityColor = priorityColors[priority.toUpperCase()] || priorityColors.MEDIUM;
  const truncatedDescription = taskDescription && taskDescription.length > 150 
    ? taskDescription.substring(0, 150) + "..." 
    : taskDescription || "No description provided";

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `New ${submissionType} Content Task - ${modelName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New ${submissionType} Task Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <div style="background-color: #f9fafb; padding: 40px 20px;">
            <!-- Main Container -->
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 48px 40px; text-align: center; border-bottom: 1px solid #e0f2fe;">
                <div style="background-color: #0ea5e9; width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                  <svg
                    style="height: 40px; width: 40px; color: #ffffff;"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">
                  New ${submissionType} Task
                </h1>
                <p style="margin: 0; font-size: 16px; color: #6b7280;">
                  A new content task has been created in <span style="font-weight: 600; color: #0ea5e9;">${teamName}</span>
                </p>
              </div>
              
              <!-- Body Content -->
              <div style="padding: 48px 40px;">
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  Hello <strong>${userName}</strong>,
                </p>
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  <strong>${createdByName}</strong> just created a new ${submissionType} content task for <strong>${modelName}</strong>!
                </p>
                
                <!-- Task Details -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; margin: 32px 0;">
                  <!-- Priority Badge -->
                  <div style="margin-bottom: 16px;">
                    <span style="background-color: ${priorityColor.bg}; color: ${priorityColor.text}; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${priorityColor.badge}
                    </span>
                  </div>
                  
                  <!-- Task Title -->
                  <h3 style="margin: 0 0 16px 0; font-size: 20px; color: #111827; font-weight: 700; line-height: 28px;">
                    ${taskTitle}
                  </h3>
                  
                  <!-- Task Description -->
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                    ${truncatedDescription}
                  </p>
                  
                  <!-- Reason Info -->
                  <div style="background-color: #dbeafe; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-top: 20px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <svg
                        style="height: 20px; width: 20px; color: #2563eb; flex-shrink: 0;"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span style="font-size: 14px; color: #1e40af; font-weight: 600;">
                        Notification Reason: ${reason}${columnLabel ? ` (${columnLabel} column)` : ''}
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${taskUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; transition: all 0.3s ease;">
                    View Task Details
                  </a>
                </div>
                
                <!-- Additional Information -->
                <div style="background-color: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 20px;">
                    This task was automatically created from an ${submissionType} content submission and needs your attention as part of the content processing workflow.
                  </p>
                </div>
                
                <!-- Team Info -->
                <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #0c4a6e; line-height: 20px;">
                    <strong>Team:</strong> ${teamName}<br>
                    <strong>Model:</strong> ${modelName}<br>
                    <strong>Created by:</strong> ${createdByName}
                  </p>
                </div>
                
                <!-- Footer text -->
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  You're receiving this notification because you're ${reason.toLowerCase()}${columnLabel ? ` for the "${columnLabel}" column` : ''} in the ${teamName} team.
                </p>
                
                <!-- Footer -->
                <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; line-height: 18px;">
                    © ${new Date().getFullYear()} Tasty Creative. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Email footer -->
            <div style="text-align: center; margin-top: 32px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 18px;">
                This email was sent to ${to}<br>
                You received this notification because a new content task requires your attention.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendStrikeNotificationEmail({
  to,
  userName,
  reason,
  issuedByName,
  teamName,
  notes,
  strikeCount,
  teamUrl,
}: {
  to: string;
  userName: string;
  reason: string;
  issuedByName: string;
  teamName: string;
  notes?: string | null;
  strikeCount: number;
  teamUrl: string;
}) {
  // Strike severity based on count
  const strikeConfig: Record<number, { bg: string; text: string; emoji: string; severity: string }> = {
    1: { bg: '#fef3c7', text: '#d97706', emoji: '⚠️', severity: 'First Strike - Warning' },
    2: { bg: '#fee2e2', text: '#dc2626', emoji: '🔴', severity: 'Second Strike - Serious' },
    3: { bg: '#fef2f2', text: '#991b1b', emoji: '🚨', severity: 'Third Strike - Critical' },
  };
  
  const strikeLevel = strikeConfig[strikeCount] || { 
    bg: '#fef2f2', 
    text: '#991b1b', 
    emoji: '🚨', 
    severity: `${strikeCount} Strikes - Critical` 
  };

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `⚠️ Strike Issued - ${reason} - ${teamName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Strike Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <div style="background-color: #f9fafb; padding: 40px 20px;">
            <!-- Main Container -->
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 48px 40px; text-align: center; border-bottom: 1px solid #fecaca;">
                <svg
                  style="margin: 0 auto 16px; height: 48px; width: 48px; color: #dc2626;"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">
                  Strike Issued
                </h1>
                <p style="margin: 0; font-size: 16px; color: #6b7280;">
                  You have received a strike in <span style="font-weight: 600; color: #dc2626;">${teamName}</span>
                </p>
              </div>
              
              <!-- Body Content -->
              <div style="padding: 48px 40px;">
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  Hello <strong>${userName}</strong>,
                </p>
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  This is an official notification that a strike has been issued to your account in the <strong>${teamName}</strong> team by <strong>${issuedByName}</strong>.
                </p>
                
                <!-- Strike Severity Badge -->
                <div style="background-color: ${strikeLevel.bg}; border: 2px solid ${strikeLevel.text}; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 12px;">
                    ${strikeLevel.emoji}
                  </div>
                  <h3 style="margin: 0 0 8px 0; font-size: 24px; color: ${strikeLevel.text}; font-weight: 800;">
                    ${strikeLevel.severity}
                  </h3>
                  <p style="margin: 0; font-size: 14px; color: ${strikeLevel.text}; font-weight: 600;">
                    Total Active Strikes: ${strikeCount}
                  </p>
                </div>
                
                <!-- Strike Details -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; margin: 32px 0;">
                  <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #111827; font-weight: 700;">
                    Strike Details
                  </h3>
                  
                  <!-- Reason -->
                  <div style="margin-bottom: 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Violation Reason
                    </p>
                    <p style="margin: 0; font-size: 16px; color: #dc2626; font-weight: 700;">
                      ${reason}
                    </p>
                  </div>
                  
                  ${notes ? `
                  <!-- Notes -->
                  <div style="margin-bottom: 20px; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Additional Notes
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 20px;">
                      ${notes}
                    </p>
                  </div>
                  ` : ''}
                  
                  <!-- Issued By -->
                  <div style="margin-bottom: 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Issued By
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600;">
                      ${issuedByName}
                    </p>
                  </div>
                  
                  <!-- Team -->
                  <div>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Team
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600;">
                      ${teamName}
                    </p>
                  </div>
                </div>
                
                <!-- Important Notice -->
                <div style="background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 24px; margin: 32px 0;">
                  <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #991b1b; font-weight: 700;">
                    ⚠️ Important Notice
                  </h3>
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #7f1d1d; line-height: 20px;">
                    Strikes are issued for violations of team policies and standards. Accumulating multiple strikes may result in:
                  </p>
                  <ul style="margin: 0; padding-left: 20px; color: #7f1d1d; font-size: 14px; line-height: 24px;">
                    <li>Temporary suspension from certain team activities</li>
                    <li>Reduced privileges or access</li>
                    <li>Removal from the team</li>
                  </ul>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${teamUrl}" style="display: inline-block; padding: 14px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; transition: all 0.3s ease;">
                    View Team Board
                  </a>
                </div>
                
                <!-- Divider -->
                <div style="margin: 40px 0; border-top: 1px solid #e5e7eb;"></div>
                
                <!-- Additional Information -->
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">
                    <strong>What should I do next?</strong>
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                    Please review the violation reason carefully and ensure you understand the team policies. If you believe this strike was issued in error, contact your team administrator to discuss the matter. Moving forward, please ensure compliance with all team standards to avoid additional strikes.
                  </p>
                </div>
                
                <!-- Footer text -->
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  You're receiving this notification because a strike was issued to your account. This is an official record and will be tracked in the team's strike system.
                </p>
                
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  <strong>Note:</strong> This strike is specific to the ${teamName} team. For questions or appeals, please contact the team administrator.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
                  Tasty Creative
                </p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  Maintaining team standards and accountability
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
                You received this notification because a strike was issued to your account.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendTaskAssignmentNotificationEmail({
  to,
  assigneeName,
  taskTitle,
  taskDescription,
  assignedBy,
  priority,
  teamName,
  taskUrl,
  dueDate,
}: {
  to: string;
  assigneeName: string;
  taskTitle: string;
  taskDescription?: string | null;
  assignedBy: string;
  priority: string;
  teamName: string;
  taskUrl: string;
  dueDate?: string | null;
}) {
  // Get priority styling
  const priorityConfig: Record<string, { bg: string; text: string; badge: string; emoji: string }> = {
    LOW: { bg: '#f0f9ff', text: '#0369a1', badge: 'Low Priority', emoji: '🟢' },
    MEDIUM: { bg: '#fef3c7', text: '#d97706', badge: 'Medium Priority', emoji: '🟡' },
    HIGH: { bg: '#fee2e2', text: '#dc2626', badge: 'High Priority', emoji: '🔴' },
    URGENT: { bg: '#fef2f2', text: '#991b1b', badge: 'Urgent Priority', emoji: '🚨' },
  };
  
  const priorityColor = priorityConfig[priority] || priorityConfig.MEDIUM;
  
  // Truncate description if too long
  const truncatedDescription = taskDescription && taskDescription.length > 300 
    ? taskDescription.substring(0, 300) + "..." 
    : taskDescription || "No description provided";

  // Format due date
  const dueDateDisplay = dueDate 
    ? new Date(dueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Task assigned to you: ${taskTitle} - ${teamName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Assignment Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <div style="background-color: #f9fafb; padding: 40px 20px;">
            <!-- Main Container -->
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%); padding: 48px 40px; text-align: center; border-bottom: 1px solid #c4b5fd;">
                <svg
                  style="margin: 0 auto 16px; height: 48px; width: 48px; color: #7c3aed;"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">
                  Task Assigned!
                </h1>
                <p style="margin: 0; font-size: 16px; color: #6b7280;">
                  You have been assigned a new task in <span style="font-weight: 600; color: #7c3aed;">${teamName}</span>
                </p>
              </div>
              
              <!-- Body Content -->
              <div style="padding: 48px 40px;">
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  Hello <strong>${assigneeName}</strong>,
                </p>
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                  <strong>${assignedBy}</strong> has assigned you a new task that requires your attention.
                </p>
                
                <!-- Task Details -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; margin: 32px 0;">
                  <!-- Priority Badge -->
                  <div style="margin-bottom: 16px;">
                    <span style="background-color: ${priorityColor.bg}; color: ${priorityColor.text}; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;">
                      ${priorityColor.emoji} ${priorityColor.badge}
                    </span>
                  </div>
                  
                  <!-- Task Title -->
                  <h3 style="margin: 0 0 16px 0; font-size: 20px; color: #111827; font-weight: 700; line-height: 28px;">
                    ${taskTitle}
                  </h3>
                  
                  <!-- Task Description -->
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                    ${truncatedDescription}
                  </p>
                  
                  <!-- Task Meta Info -->
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                      <!-- Team -->
                      <div>
                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Team</p>
                        <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600;">${teamName}</p>
                      </div>
                      
                      <!-- Assigned By -->
                      <div>
                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Assigned By</p>
                        <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600;">${assignedBy}</p>
                      </div>
                      
                      ${dueDateDisplay ? `
                      <!-- Due Date -->
                      <div>
                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Due Date</p>
                        <p style="margin: 0; font-size: 14px; color: #dc2626; font-weight: 600;">${dueDateDisplay}</p>
                      </div>
                      ` : ''}
                    </div>
                  </div>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${taskUrl}" style="display: inline-block; padding: 14px 32px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; transition: all 0.3s ease;">
                    View Task Details
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
                    Click the button above to view the task details, update its status, add comments, or ask questions. You can collaborate with your team members directly on the task.
                  </p>
                </div>
                
                <!-- Footer text -->
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  You're receiving this notification because you were assigned to this task. You can manage your notification preferences in your account settings.
                </p>
                
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                  <strong>Note:</strong> You can update the task status, add comments, and collaborate with your team members by clicking the link above.
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
                You received this notification because you were assigned to a task.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
