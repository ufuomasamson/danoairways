import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || searchParams.get('user_auth_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Chat API GET: Fetching messages for user', userId);

    // Try both user_id and user_auth_id fields to handle migration
    const { data: messages1, error: error1 } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!error1 && messages1?.length > 0) {
      console.log('Chat API: Found messages using user_id field', messages1.length);
      return NextResponse.json({ messages: messages1 });
    }

    // Try with user_auth_id field
    const { data: messages2, error: error2 } = await supabase
      .from('chats')
      .select('*')
      .eq('user_auth_id', userId)
      .order('created_at', { ascending: true });

    if (error2) {
      console.error('Chat API: Error fetching messages:', { error1, error2 });
      return NextResponse.json({ error: error2.message }, { status: 500 });
    }

    console.log('Chat API: Found messages using user_auth_id field', messages2?.length || 0);
    return NextResponse.json({ messages: messages2 || [] });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { user_id, user_auth_id, sender_role, message } = body;

    const userId = user_auth_id || user_id; // Support both formats

    if (!userId || !sender_role || !message) {
      console.error('Chat API POST: Missing required fields', { userId, sender_role, message: !!message });
      return NextResponse.json({ 
        error: 'user_id (or user_auth_id), sender_role, and message are required' 
      }, { status: 400 });
    }

    console.log('Chat API POST: Inserting message', { userId, sender_role, messageLength: message.length });

    // Ensure user exists in public.users table
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userId)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create them
      console.log('Chat API: Creating user in public.users table');
      const { error: createUserError } = await supabase
        .from('users')
        .insert({
          auth_id: userId,
          email: 'user@example.com', // Default email, can be updated later
          role: 'user'
        });

      if (createUserError) {
        console.error('Chat API: Error creating user:', createUserError);
      }
    }

    // Insert message using the new table structure
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_auth_id: userId, // Use the new field name
        sender_role,
        message: message.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Chat API: Error inserting message:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Chat API: Message inserted successfully', data);
    return NextResponse.json({ message: data });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
