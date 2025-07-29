"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Check for different payment gateway parameters
        const tx_ref = searchParams.get('tx_ref');
        const transaction_id = searchParams.get('transaction_id');
        const status = searchParams.get('status');
        const reference = searchParams.get('reference'); // Paystack reference
        const trxref = searchParams.get('trxref'); // Paystack transaction reference

        // Determine payment gateway and verification endpoint
        let verifyEndpoint = '/api/payment/verify';
        let verifyPayload: any = {};

        if (reference || trxref) {
          // Paystack payment
          verifyEndpoint = '/api/payment/paystack/verify';
          verifyPayload = { 
            reference: reference || trxref,
            trxref: trxref || reference
          };
        } else if (tx_ref) {
          // Flutterwave payment
          verifyEndpoint = '/api/payment/verify';
          verifyPayload = { 
            tx_ref,
            transaction_id: transaction_id || null
          };
        } else {
          setError('No transaction reference found');
          setVerificationStatus('error');
          return;
        }

        // Verify payment with our backend
        const response = await fetch(verifyEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verifyPayload),
        });

        const result = await response.json();

        if (result.success) {
          setPaymentDetails(result.data);
          setVerificationStatus('success');
        } else {
          // Provide more helpful error messages
          let errorMessage = result.error || 'Payment verification failed';
          
          if (errorMessage.includes('Payment gateway not configured')) {
            errorMessage = 'Payment system is not configured. Please contact support.';
          } else if (errorMessage.includes('Payment gateway secret key not configured')) {
            errorMessage = 'Payment system needs configuration. Please contact support.';
          } else if (errorMessage.includes('Booking not found')) {
            errorMessage = 'Booking not found. Please contact support with your transaction reference.';
          }
          
          setError(errorMessage);
          setVerificationStatus('error');
        }
      } catch (err: any) {
        setError(err.message || 'Payment verification failed');
        setVerificationStatus('error');
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#18176b] mx-auto mb-4"></div>
          <p className="text-[#18176b] font-semibold">Verifying Payment...</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h1>
              <p className="text-gray-600 mb-6">{error}</p>
            </div>
            
            <div className="space-y-4">
              <Link
                href="/track"
                className="inline-block bg-[#18176b] text-white px-6 py-3 rounded-lg hover:bg-[#18176b]/90 transition"
              >
                Back to Flight Tracking
              </Link>
              <Link
                href="/"
                className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition ml-4"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">Your Dano Airways flight has been confirmed</p>
          </div>

          {paymentDetails && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Transaction Reference</p>
                  <p className="text-gray-900 font-mono">{paymentDetails.transaction_ref}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="text-gray-900">{paymentDetails.currency} {paymentDetails.amount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-green-600 font-semibold">{paymentDetails.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Booking ID</p>
                  <p className="text-gray-900">{paymentDetails.booking_id}</p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center space-y-4">
            <p className="text-gray-600">
              You will receive a confirmation email with your flight details shortly.
            </p>
            
            <div className="space-y-4">
              <Link
                href="/track"
                className="inline-block bg-[#18176b] text-white px-6 py-3 rounded-lg hover:bg-[#18176b]/90 transition"
              >
                Track Your Flight
              </Link>
              <Link
                href="/"
                className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition ml-4"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 