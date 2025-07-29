import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { userId, fullName } = await request.json();
    
    if (!userId || !fullName) {
      return NextResponse.json({ error: "User ID and full name are required" }, { status: 400 });
    }

    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vftrdqfciqacxanhzvvz.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    console.log(`Updating metadata for user ${userId} with name ${fullName}`);
    
    // Update user metadata using admin privileges
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { 
        user_metadata: { 
          full_name: fullName,
          role: 'user'
        } 
      }
    );
    
    if (error) {
      console.error("Error updating user metadata:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // Now also update or create record in public.users table
    try {
      // Check if the users table exists before trying to insert
      const { error: usersError } = await supabaseAdmin.from('users').upsert({
        id: userId,
        full_name: fullName,
        role: 'user',
        updated_at: new Date().toISOString()
      });
      
      if (usersError) {
        console.warn("Warning: Could not update public.users table:", usersError);
        // Don't fail the request, just log the warning
      }
    } catch (tableError) {
      console.warn("Users table may not exist:", tableError);
      // Don't fail the request, just log the warning
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "User metadata updated successfully" 
    });
    
  } catch (err) {
    console.error("Error in update-user-metadata:", err);
    return NextResponse.json({ 
      error: "An unexpected error occurred",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
