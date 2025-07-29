"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export function useSession() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      try {
        console.log('useSession: Getting session...');
        console.log('useSession: All cookies:', document.cookie);
        
        // Try to get Supabase session first
        const { data: supabaseSession } = await supabase.auth.getSession();
        console.log('useSession: Supabase session', { 
          hasSession: !!supabaseSession?.session,
          userId: supabaseSession?.session?.user?.id 
        });
        
        if (supabaseSession?.session && mounted) {
          console.log('useSession: Using Supabase session');
          setSession(supabaseSession.session);
          return;
        }

        // Fallback to cookie-based session for your custom auth
        const allCookies = document.cookie.split('; ');
        console.log('useSession: All cookies split:', allCookies);
        
        const userCookie = allCookies.find(row => row.startsWith('user='));
        console.log('useSession: User cookie found', !!userCookie, userCookie);
        
        if (userCookie && mounted) {
          try {
            const cookieValue = userCookie.split('=')[1];
            console.log('useSession: Cookie value before decode:', cookieValue);
            
            const decodedValue = decodeURIComponent(cookieValue);
            console.log('useSession: Cookie value after decode:', decodedValue);
            
            const userObj = JSON.parse(decodedValue);
            console.log('useSession: Parsed cookie user', userObj);
            
            // Create a session-like object for compatibility
            const cookieSession = {
              user: {
                id: userObj.id,
                email: userObj.email,
                user_metadata: { role: userObj.role }
              }
            };
            console.log('useSession: Using cookie session', cookieSession);
            setSession(cookieSession);
          } catch (cookieError) {
            console.error('Error parsing user cookie:', cookieError);
          }
        } else {
          console.log('useSession: No session found - no cookie and no Supabase session');
        }
      } catch (error) {
        console.error('Error getting session:', error);
      }
    }

    getSession();

    // Listen for Supabase auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSession(session);
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  return session;
}
