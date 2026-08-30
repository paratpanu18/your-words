import type { Metadata, Viewport } from "next";
import { Geist_Mono, Google_Sans } from "next/font/google";
import "./globals.css";

// Google Sans (incl. Thai subset) — the site-wide font, and the font used
// for the cloud bubble text.
const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin", "thai"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Your Words",
    template: "%s | Your Words",
  },
  description:
    "Collect words and sentences from your audience in real time. Create a room, share the code, and watch messages appear as clouds.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${googleSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-foreground">
        {children}
      </body>
    </html>
  );
}
