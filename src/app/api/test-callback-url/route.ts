import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Test the URL modification logic for Paystack 3D Secure
    const mockPaystackUrl = 'https://standard.paystack.co/charge/auth/924cff408u11ke2c6d1?selected_currency=0&lang=en';
    const mockReference = 'test_ref_' + Date.now();
    
    // Apply the same logic as in the charge endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://danoairways.vercel.app';
    const callbackUrl = `${baseUrl}/payment/callback?reference=${mockReference}`;
    
    const paystackUrl = new URL(mockPaystackUrl);
    paystackUrl.searchParams.set('callback_url', callbackUrl);
    paystackUrl.searchParams.set('reference', mockReference);
    
    console.log('Original Paystack URL:', mockPaystackUrl);
    console.log('Modified Paystack URL:', paystackUrl.toString());
    console.log('Callback URL:', callbackUrl);

    return NextResponse.json({
      success: true,
      test: 'URL modification for Paystack 3D Secure',
      original: mockPaystackUrl,
      modified: paystackUrl.toString(),
      callbackUrl: callbackUrl,
      reference: mockReference,
      explanation: 'This shows how the Paystack 3D Secure URL is modified to include our callback'
    });

  } catch (error: any) {
    console.error('URL test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'URL test failed'
    }, { status: 500 });
  }
}
