export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen flex">{children}</div>;
}
