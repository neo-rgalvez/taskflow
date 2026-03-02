import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TaskFlow — Project Management for Freelancers",
    template: "%s | TaskFlow",
  },
  description:
    "Track projects, log time, send invoices. Built for freelancers who juggle multiple clients.",
  openGraph: {
    title: "TaskFlow — Project Management for Freelancers",
    description:
      "Track projects, log time, send invoices. Built for freelancers who juggle multiple clients.",
    siteName: "TaskFlow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskFlow — Project Management for Freelancers",
    description:
      "Track projects, log time, send invoices. Built for freelancers who juggle multiple clients.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="antialiased font-sans bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
