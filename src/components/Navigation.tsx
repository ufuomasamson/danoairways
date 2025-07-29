'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrencyStore } from '@/lib/currencyManager';

type NavigationProps = {
  user: { email?: string; id: string } | null;
  userRole: string | null;
  currencies: { code: string; symbol: string }[];
};

export default function Navigation({ user, userRole, currencies }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { currency, setCurrency } = useCurrencyStore();

  const handleSignOut = async () => {
    try {
      // Call logout API to clear cookie and sign out from Supabase
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) {
        console.error("Logout failed:", await response.text());
      }
      // Force page reload to update UI
      window.location.href = "/";
    } catch (error) {
      console.error("Error during sign out:", error);
      router.push('/');
    }
    setMobileMenuOpen(false);
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    // TODO: Persist currency preference for user in MySQL
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#18176b]">
      <div className="flex items-center justify-between px-4 sm:px-8 py-4">
        <Link href="/" className="text-xl sm:text-2xl font-bold text-white tracking-tight">Dano Airways</Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6 lg:gap-8 items-center text-sm lg:text-base font-medium">
        <Link href="/" className="text-white hover:text-[#cd7e0f] transition">Home</Link>
        <Link href="/about" className="text-white hover:text-[#cd7e0f] transition">About Us</Link>
        <Link href="/search" className="text-white hover:text-[#cd7e0f] transition">Flights</Link>
        <Link href="/track" className="text-white hover:text-[#cd7e0f] transition">Track Flight</Link>
        <Link href="/contact" className="text-white hover:text-[#cd7e0f] transition">Contact</Link>
        
        {/* Currency Switcher - Always visible */}
        <select 
          onChange={(e) => handleCurrencyChange(e.target.value)} 
          value={currency} 
          className="bg-[#18176b] text-white px-2 lg:px-3 py-1 rounded border border-white/20 hover:border-white/40 transition text-xs lg:text-sm"
        >
          <option value="USD">$ USD</option>
          <option value="EUR">€ EUR</option>
          <option value="GBP">£ GBP</option>
        </select>
        
        {user ? (
            <div className="flex items-center gap-3 lg:gap-4">
              {userRole === 'admin' && (
                <Link href="/admin/dashboard" className="text-white hover:text-[#cd7e0f] transition text-sm lg:text-base">
                Admin Dashboard
              </Link>
            )}
              <span className="text-white text-xs lg:text-sm hidden lg:block">
              Welcome, {user.email}
            </span>
            <button
              onClick={handleSignOut}
                className="px-3 lg:px-4 py-1 lg:py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs lg:text-sm"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
              <Link href="/login" className="px-3 lg:px-4 py-1 lg:py-2 bg-[#cd7e0f] text-white rounded hover:bg-[#cd7e0f]/90 transition text-xs lg:text-sm">Login</Link>
              <Link href="/signup" className="px-3 lg:px-4 py-1 lg:py-2 border border-white text-white rounded hover:bg-white hover:text-[#18176b] transition text-xs lg:text-sm">Sign Up</Link>
          </div>
        )}
      </div>

        {/* Mobile menu button */}
      <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:text-[#cd7e0f] transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#18176b] border-t border-white/20">
          <div className="px-4 py-4 space-y-4">
            <div className="flex flex-col space-y-3">
              <Link href="/" className="text-white hover:text-[#cd7e0f] transition py-2">Home</Link>
              <Link href="/about" className="text-white hover:text-[#cd7e0f] transition py-2">About Us</Link>
              <Link href="/search" className="text-white hover:text-[#cd7e0f] transition py-2">Flights</Link>
              <Link href="/track" className="text-white hover:text-[#cd7e0f] transition py-2">Track Flight</Link>
              <Link href="/contact" className="text-white hover:text-[#cd7e0f] transition py-2">Contact</Link>
            </div>
            
            {/* Currency Switcher - Always visible in mobile */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <span className="text-white text-sm">Currency:</span>
              <select 
                onChange={(e) => handleCurrencyChange(e.target.value)} 
                value={currency} 
                className="bg-[#18176b] text-white px-3 py-1 rounded border border-white/20 hover:border-white/40 transition text-sm"
              >
                <option value="EUR">€ EUR</option>
                <option value="USD">$ USD</option>
                <option value="GBP">£ GBP</option>
              </select>
            </div>
            
            {user ? (
              <div className="space-y-3 pt-4 border-t border-white/20">
                {userRole === 'admin' && (
                  <Link href="/admin/dashboard" className="text-white hover:text-[#cd7e0f] transition py-2 block">
                    Admin Dashboard
                  </Link>
                )}
                <div className="text-white text-sm py-2">
                  Welcome, {user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 pt-4 border-t border-white/20">
                <Link href="/login" className="px-4 py-2 bg-[#cd7e0f] text-white rounded hover:bg-[#cd7e0f]/90 transition text-center text-sm">Login</Link>
                <Link href="/signup" className="px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-[#18176b] transition text-center text-sm">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 