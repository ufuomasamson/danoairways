import { NextResponse } from 'next/server';
import { supabase } from '@/supabaseClient';

export async function POST(request: Request) {
  try {
    const { bookingId, userId, amount, currency = 'USD' } = await request.json();

    if (!bookingId || !userId || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    // Get booking details from Supabase
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, flights(*)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found'
      }, { status: 404 });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Get Flutterwave API keys
    const { data: apiKeys, error: keysError } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('name', 'flutterwave');

    if (keysError || !apiKeys || apiKeys.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Payment gateway not configured'
      }, { status: 500 });
    }

    const testPublicKey = apiKeys.find(k => k.type === 'test_public')?.api_key;
    const testSecretKey = apiKeys.find(k => k.type === 'test_secret')?.api_key;

    if (!testPublicKey || !testSecretKey) {
      return NextResponse.json({
        success: false,
        error: 'Payment gateway keys not configured'
      }, { status: 500 });
    }

    // Generate unique transaction reference
    const txRef = `FLIGHT_${bookingId}_${userId}_${Date.now()}`;

    // Prepare payment data with explicit currency enforcement
    const paymentData = {
      tx_ref: txRef,
      amount: amount,
      currency: currency.toUpperCase(), // Ensure currency is uppercase
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success`,
      customer: {
        email: user.email,
        name: user.full_name || `${user.first_name} ${user.last_name}`,
        phone_number: user.phone || ''
      },
      customizations: {
        title: 'Dano Airways Payment',
        description: `Payment for flight ${booking.flights?.flight_number || 'N/A'}`,
        logo: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`
      },
      meta: {
        booking_id: bookingId,
        user_id: userId,
        flight_id: booking.flight_id,
        currency: currency.toUpperCase() // Add currency to meta for extra enforcement
      },
      // Additional parameters to force currency
      payment_options: 'card,banktransfer,ussd'
      // Removed country parameter to avoid NGN default
    };

    // Debug: Log payment data
    console.log('Payment data being sent to Flutterwave:', JSON.stringify(paymentData, null, 2));

    // Make request to Flutterwave API
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    // Debug: Log Flutterwave response
    console.log('Flutterwave API response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('Flutterwave API error:', result);
      return NextResponse.json({
        success: false,
        error: result.message || 'Payment initiation failed'
      }, { status: 500 });
    }

    // Update booking with transaction reference
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'pending',
        transaction_ref: txRef,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        payment_url: result.data.link,
        tx_ref: txRef,
        status: result.status
      }
    });

  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
} 