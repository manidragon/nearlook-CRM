import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "Nearlook Agency ERP & CRM | IT Services & Digital Marketing",
  description: "Enterprise Agency ERP & CRM system for IT Services and Digital Marketing Agencies. Includes Lead Tracking, Client Retainers, Encrypted Credentials Vault, Kanban Task Management, Staff Workload, Invoicing, and automated WhatsApp Cloud API triggers.",
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fafbfc] text-slate-900 antialiased selection:bg-orange-500 selection:text-white">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
