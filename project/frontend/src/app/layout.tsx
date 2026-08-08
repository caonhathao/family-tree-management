import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "sonner";
import ReduxProvider from "@/components/providers/redux-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "next-themes";
import { EnvConfig } from "@/lib/env/env-config.lib";
import { cn } from "@/lib/utils";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = EnvConfig.siteUrl;

export const metadata: Metadata = {
  title: "Gia phả gia đình",
  description: "Lưu trữ, chia sẽ và tìm hiểu dòng dõi gia đình của bạn",
  openGraph: {
    title: "MYFA - Gia Phả Gia Đình",
    description: "Lưu trữ, chia sẽ và tìm hiểu dòng dõi gia đình của bạn.",
    url: siteUrl,
    siteName: "MYFA Việt Nam",
    images: [
      {
        url: `${siteUrl}/img/family-tree-logo.webp`,
        width: 1200,
        height: 630,
        alt: "Lưu trữ, chia sẽ và tìm hiểu dòng dõi gia đình của bạn.",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={"vi"}
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        plusJakartaSans.variable,
      )}
      suppressHydrationWarning
    >
      <body className={"min-h-full w-screen flex flex-col"}>
        <ThemeProvider
          attribute={"class"}
          defaultTheme={"system"}
          enableSystem
          disableTransitionOnChange
        >
          <ReduxProvider>
            <TooltipProvider>
              {children}
              <SpeedInsights />
            </TooltipProvider>
          </ReduxProvider>
        </ThemeProvider>

        <SonnerToaster richColors />
      </body>
    </html>
  );
}
