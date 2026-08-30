import type { Metadata, Viewport } from "next";
import { Anuphan, DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["latin", "thai"],
});

// Google Sans is proprietary and not available on Google Fonts; DM Sans is
// the closest free typeface and is used for the cloud bubble text.
const dmSans = DM_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
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
      className={`${anuphan.variable} ${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-foreground">
        {children}
      </body>
    </html>
  );
}
