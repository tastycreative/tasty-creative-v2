import { EmailVerificationBanner } from "@/components/email-verification-banner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <EmailVerificationBanner />
      {children}
    </div>
  );
}
