import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Tasty Creative - Understand your rights and responsibilities when using our platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-rose-50/50 dark:from-gray-900 dark:via-gray-800/70 dark:to-gray-900/80">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-xl border border-pink-200/50 dark:border-pink-500/30 p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Terms of Service
          </h1>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  By accessing and using Tasty Creative ("the Service"), you accept and agree to be bound by 
                  the terms and provision of this agreement. If you do not agree to abide by the above, 
                  please do not use this service.
                </p>
                <p>
                  These Terms of Service govern your use of the Tasty Creative platform, including all content, 
                  services, and products available at or through the service.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Description of Service
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Tasty Creative is a comprehensive platform that provides:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Project and task management tools</li>
                  <li>Team collaboration features</li>
                  <li>Voice generation and audio services</li>
                  <li>Content creation and management tools</li>
                  <li>Analytics and reporting capabilities</li>
                  <li>Integration with third-party services</li>
                </ul>
                <p>
                  We reserve the right to modify, update, or discontinue any aspect of the service at any time.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. User Accounts and Registration
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  To access certain features of the Service, you must register for an account. When you register:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You must provide accurate, current, and complete information</li>
                  <li>You must maintain and update your information to keep it accurate</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You must notify us immediately of any unauthorized use of your account</li>
                </ul>
                <p>
                  We reserve the right to refuse service, terminate accounts, or cancel orders at our sole discretion.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Acceptable Use Policy
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>You agree not to use the Service to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violate any applicable laws, regulations, or third-party rights</li>
                  <li>Upload, transmit, or distribute harmful, offensive, or illegal content</li>
                  <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                  <li>Attempt to gain unauthorized access to any portion of the Service</li>
                  <li>Use the Service for any commercial purpose without our written consent</li>
                  <li>Impersonate any person or entity or falsely state your affiliation</li>
                  <li>Distribute spam, malware, or other malicious content</li>
                  <li>Reverse engineer, decompile, or attempt to extract source code</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Content and Intellectual Property
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200">
                  Your Content
                </h3>
                <p>
                  You retain ownership of any intellectual property rights that you hold in content that you 
                  submit to the Service. By submitting content, you grant us a worldwide, non-exclusive, 
                  royalty-free license to use, reproduce, modify, and distribute your content solely for 
                  the purpose of providing the Service.
                </p>

                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mt-6">
                  Our Content
                </h3>
                <p>
                  The Service and its original content, features, and functionality are owned by Tasty Creative 
                  and are protected by international copyright, trademark, patent, trade secret, and other 
                  intellectual property laws.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Third-Party Services and Integrations
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Our Service may integrate with or rely on third-party services, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Google Services (authentication, cloud storage, APIs)</li>
                  <li>ElevenLabs (voice generation services)</li>
                  <li>Payment processors</li>
                  <li>Analytics and monitoring tools</li>
                </ul>
                <p>
                  Your use of these third-party services is subject to their respective terms of service and 
                  privacy policies. We are not responsible for the availability, content, or practices of 
                  third-party services.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Privacy and Data Protection
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Your privacy is important to us. Our Privacy Policy explains how we collect, use, and 
                  protect your information when you use the Service. By using the Service, you agree to 
                  the collection and use of information in accordance with our Privacy Policy.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Payment Terms and Billing
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  If you purchase paid services:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You agree to pay all applicable fees as described on the Service</li>
                  <li>Payments are processed by third-party payment processors</li>
                  <li>You are responsible for all taxes associated with your purchases</li>
                  <li>Refunds may be available as described in our refund policy</li>
                  <li>We reserve the right to change pricing with reasonable notice</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Service Availability and Maintenance
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  We strive to maintain high service availability, but we do not guarantee that the Service 
                  will be available at all times. We may:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Perform scheduled maintenance with reasonable notice</li>
                  <li>Experience unplanned downtime due to technical issues</li>
                  <li>Temporarily suspend service for security or legal reasons</li>
                  <li>Update or modify the Service without prior notice</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Limitation of Liability
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  To the maximum extent permitted by applicable law, Tasty Creative shall not be liable for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Any loss of profits, revenues, data, or use</li>
                  <li>Any damages resulting from third-party services or integrations</li>
                  <li>Any damages exceeding the amount you paid for the Service in the past 12 months</li>
                </ul>
                <p>
                  The Service is provided "as is" and "as available" without warranties of any kind.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                11. Indemnification
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  You agree to indemnify, defend, and hold harmless Tasty Creative and its affiliates from 
                  any claims, damages, or expenses arising from:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your use of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any third-party rights</li>
                  <li>Any content you submit to the Service</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                12. Termination
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Either party may terminate this agreement at any time:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You may stop using the Service and delete your account at any time</li>
                  <li>We may terminate or suspend your access for violations of these Terms</li>
                  <li>We may terminate the Service with reasonable notice</li>
                  <li>Upon termination, your access to the Service will cease immediately</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                13. Governing Law and Dispute Resolution
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of California, United States, 
                  without regard to its conflict of law provisions. Any disputes arising from these Terms or 
                  the Service shall be resolved through binding arbitration.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                14. Changes to Terms
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  We reserve the right to modify these Terms at any time. We will notify users of any material 
                  changes via email or through the Service. Your continued use of the Service after such 
                  modifications constitutes acceptance of the updated Terms.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                15. Contact Information
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <p><strong>Email:</strong> tasty4459@gmail.com</p>
                  <p><strong>Address:</strong> Tasty Creative, United States, LA</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                16. Severability
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  If any provision of these Terms is held to be invalid or unenforceable, the remaining 
                  provisions will remain in full force and effect.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}