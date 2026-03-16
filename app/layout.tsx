import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";


export const metadata: Metadata = {
  title: 'Lead Pipeline',
  description: 'CSV cleaning Tool',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
