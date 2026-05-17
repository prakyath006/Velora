import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Velora — Goal Setting & Tracking Portal",
  description: "Enterprise goal setting, tracking, and performance management portal",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <TooltipProvider>
              <NextTopLoader color="#5e6ad2" showSpinner={false} shadow="0 0 10px #5e6ad2,0 0 5px #5e6ad2" />
              {children}
              <Toaster position="bottom-right" richColors />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
