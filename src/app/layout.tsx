import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AIChatbotModal from "@/components/AIChatbotModal";
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
          <div className="flex min-h-screen">
            {/* White & Orange Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>

          {/* Global AI Executive Copilot Drawer & Floating Trigger */}
          <AIChatbotModal />
        </AuthProvider>
      </body>
    </html>
  );
}
