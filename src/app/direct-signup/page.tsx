"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DirectSignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setDebugInfo(null);

    try {
      // Step 1: Use the Supabase REST API directly
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vftrdqfciqacxanhzvvz.supabase.co';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdHJkcWZjaXFhY3hhbmh6dnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzczNTAsImV4cCI6MjA2OTM1MzM1MH0.x3k3-_FQEPKGSOTREDrzGFoRknVXsnzGvsWA9j133-s';
      
      console.log("Signing up with direct REST API call");
      
      // Basic signup with minimal data
      const signupResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          email,
          password,
          data: {
            full_name: fullName
          }
        })
      });
      
      const signupData = await signupResponse.json();
      
      setDebugInfo({
        signupStatus: signupResponse.status,
        signupData
      });
      
      if (!signupResponse.ok) {
        throw new Error(signupData.error_description || signupData.error || "Signup failed");
      }
      
      setSuccess("Account created successfully! You can now log in.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account (Direct Method)
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Try our simplified signup process
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="full-name" className="sr-only">
                Full Name
              </label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </div>
          
          <div className="flex justify-between text-sm mt-4">
            <a href="/signup" className="text-blue-600 hover:text-blue-800">
              Try standard signup
            </a>
            <a href="/login" className="text-blue-600 hover:text-blue-800">
              Back to login
            </a>
          </div>
        </form>
        
        {/* Debug information */}
        {debugInfo && (
          <div className="mt-8 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-500">Debug Information</h3>
            <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-auto max-h-60">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-gray-500 mb-1">Troubleshooting</p>
          <div className="flex flex-col space-y-2">
            <a 
              href="/debug" 
              className="text-xs text-blue-600 hover:text-blue-800"
              target="_blank"
            >
              Open Supabase Debug Page
            </a>
            <a 
              href="/api/fix-database" 
              className="text-xs text-blue-600 hover:text-blue-800"
              target="_blank"
            >
              Fix Database Schema
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
