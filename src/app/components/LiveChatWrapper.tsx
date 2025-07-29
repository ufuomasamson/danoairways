"use client";
import { useSession } from '../hooks/useSession';
import LiveChat from './LiveChat';

export default function LiveChatWrapper() {
  const session = useSession();
  
  // Debug logging
  console.log('LiveChatWrapper: Session data', {
    hasSession: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    userMetadata: session?.user?.user_metadata,
    role: session?.user?.user_metadata?.role
  });
  
  // TEMPORARY: Always show chat for debugging
  console.log('LiveChatWrapper: Showing chat for debugging purposes');
  return <LiveChat />;
  
  // Original logic (commented out for debugging):
  // const userRole = session?.user?.user_metadata?.role;
  // if (!session) {
  //   console.log('LiveChatWrapper: No session found, hiding chat');
  //   return null;
  // }
  // if (userRole === 'admin') {
  //   console.log('LiveChatWrapper: Admin user detected, hiding chat');
  //   return null;
  // }
  // console.log('LiveChatWrapper: Showing chat for user role:', userRole);
  // return <LiveChat />;
}
