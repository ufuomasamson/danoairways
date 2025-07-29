import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import LiveChatWrapper from './components/LiveChatWrapper';
// Using Supabase auth with cookie-based persistence for server components
import { cookies } from 'next/headers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Dano Airways - Book Your Next Adventure',
  description: 'Book flights, track your journey, and manage your travel with ease',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user info from cookie for login persistence
  let user = null;
  let userRole = null;
  let currencies = [
    { code: "USD", symbol: "$" },
    { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" }
  ];

  const cookieStore = await cookies();
  const cookie = cookieStore.get('user');
  if (cookie) {
    try {
      user = JSON.parse(cookie.value);
      userRole = user.role;
      console.log("Found user in cookie:", user.email, "with role:", userRole);
    } catch (err) {
      console.error("Failed to parse user cookie:", err);
      user = null;
      userRole = null;
    }
  } else {
    console.log("No user cookie found");
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation user={user} userRole={userRole} currencies={currencies} />
        {children}
        <LiveChatWrapper />
      </body>
    </html>
  );
}