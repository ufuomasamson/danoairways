import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    console.log('Admin Chats API: Fetching all users with chats');

    // Get all unique users who have sent messages (focusing on user_auth_id field)
    const { data: chatUsers, error } = await supabase
      .from('chats')
      .select('user_auth_id, user_id, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin Chats API: Error fetching chat users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Admin Chats API: Raw chat data:', chatUsers?.length || 0, 'records');

    if (!chatUsers || chatUsers.length === 0) {
      console.log('Admin Chats API: No chat records found');
      return NextResponse.json({ users: [] });
    }

    // Get unique user IDs from both fields (user_auth_id and user_id for compatibility)
    const allUserIds = chatUsers.map(chat => chat.user_auth_id || chat.user_id).filter(Boolean);
    const uniqueUserIds = Array.from(new Set(allUserIds));
    
    console.log('Admin Chats API: Found unique user IDs:', uniqueUserIds.length);
    console.log('Admin Chats API: User IDs:', uniqueUserIds);

    // Create simplified user list with message counts
    const usersWithChatInfo = uniqueUserIds.map((userId) => {
      const userMessages = chatUsers.filter(chat => 
        (chat.user_auth_id === userId) || (chat.user_id === userId)
      );
      
      return {
        user_auth_id: userId,
        email: `user-${userId.slice(0, 8)}`, // Simplified email for now
        message_count: userMessages.length,
        last_message_at: userMessages[0]?.created_at
      };
    });

    // Sort by message count (most active first)
    usersWithChatInfo.sort((a, b) => b.message_count - a.message_count);

    console.log('Admin Chats API: Returning users with chat info:', usersWithChatInfo.length);
    return NextResponse.json({ users: usersWithChatInfo });
  } catch (error) {
    console.error('Admin Chats API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
