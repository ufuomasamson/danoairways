import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

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

    const testSecretKey = apiKeys.find(k => k.type === 'test_secret')?.api_key;
    const liveSecretKey = apiKeys.find(k => k.type === 'live_secret')?.api_key;

    // Use test key if available, otherwise use live key
    const secretKey = testSecretKey || liveSecretKey;

    if (!secretKey) {
      return NextResponse.json({
        success: false,
        error: 'Payment gateway secret key not configured. Please add test_secret or live_secret key in admin panel.'
      }, { status: 500 });
    }

    // Generate unique transaction reference
    const txRef = `FLIGHT_${bookingId}_${userId}_${Date.now()}`;

    // Flutterwave expects amounts in the base currency, not in smallest units
    // For EUR, send the amount as-is (e.g., 5643.00 for €5,643)
    let flutterwaveAmount = amount;
    
    // Ensure the amount is a number and round to 2 decimal places
    flutterwaveAmount = Math.round(flutterwaveAmount * 100) / 100;

    console.log('Amount conversion:', {
      original_amount: amount,
      currency: currency.toUpperCase(),
      flutterwave_amount: flutterwaveAmount
    });

    // Prepare payment data for v3 API with strict currency control
    const paymentData = {
      tx_ref: txRef,
      amount: flutterwaveAmount,
      currency: currency.toUpperCase(),
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
        currency: currency.toUpperCase()
      },
      // Additional parameters to enforce currency
      payment_options: 'card,banktransfer,ussd',
      payment_plan: null,
      subaccounts: null,
      split_code: null
    };

    // Debug: Log payment data
    console.log('Payment data being sent to Flutterwave v3:', JSON.stringify(paymentData, null, 2));
    console.log('Currency being sent:', currency.toUpperCase());
    console.log('Secret key being used:', secretKey ? 'Present' : 'Missing');

    // Make request to Flutterwave v3 API (more reliable for currency enforcement)
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    // Debug: Log Flutterwave response
    console.log('Flutterwave v3 API response:', JSON.stringify(result, null, 2));
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('Flutterwave v3 API error:', result);
      return NextResponse.json({
        success: false,
        error: result.message || 'Payment initiation failed'
      }, { status: 500 });
    }

    // Update booking with transaction reference and flight amount
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'pending',
        transaction_ref: txRef,
        flight_amount: amount // Set the flight amount when initiating payment (amount is already in correct currency)
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