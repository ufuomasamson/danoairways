# Payment System Guide

This document provides a comprehensive guide to the payment system in the Dano Airways application after migration to Supabase.

## 1. Payment Flow Overview

### Payment Process
1. User books a flight
2. User selects a payment method (credit card, crypto wallet, etc.)
3. For crypto payments:
   - User selects a wallet and uploads proof of payment
   - Admin reviews and approves the payment
   - Booking status is updated to "confirmed"
4. For card payments:
   - User is redirected to payment provider
   - Payment is processed in real-time
   - Booking status is automatically updated upon successful payment

## 2. Database Schema

### Payments Table
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'USD',
  payment_method VARCHAR(64),
  status VARCHAR(32) DEFAULT 'pending',
  transaction_id VARCHAR(128),
  payment_proof_url TEXT,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id INTEGER NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  passenger_name VARCHAR(128) NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  ticket_url VARCHAR(256),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending',
  payment_intent_id TEXT,
  payment_method TEXT,
  amount DECIMAL(10, 2)
);
```

## 3. API Endpoints

### POST /api/payments
Creates a new payment record with proof of payment.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `booking_id` (required): ID of the booking being paid for
  - `amount` (required): Payment amount
  - `currency`: Currency code (default: "USD")
  - `payment_method` (required): Method of payment (e.g., "crypto", "card")
  - `user_id` (required): ID of the user making the payment
  - `user_email`: Email of the user making the payment
  - `payment_proof`: File containing proof of payment

**Response:**
- 200 OK: Payment record created successfully
- 400 Bad Request: Missing required fields
- 500 Internal Server Error: Failed to create payment record

### GET /api/payments
Retrieves payment records with optional filtering.

**Request:**
- Method: GET
- Query Parameters:
  - `booking_id`: Filter by booking ID
  - `status`: Filter by payment status
  - `user_id`: Filter by user ID
  - `page`: Page number for pagination (default: 1)
  - `limit`: Number of records per page (default: 20)

**Response:**
- 200 OK: Array of payment records
- 500 Internal Server Error: Failed to retrieve payments

### PATCH /api/payments
Updates a payment status (admin only).

**Request:**
- Method: PATCH
- Body:
  - `payment_id` (required): ID of the payment to update

**Response:**
- 200 OK: Payment status updated successfully
- 400 Bad Request: Missing payment_id
- 404 Not Found: Payment not found
- 500 Internal Server Error: Failed to update payment status

## 4. File Storage

Payment proof files are stored in the Supabase storage bucket:
- Bucket: "unit-bucket"
- Folder: "payment_proofs"

## 5. Security

- Row Level Security (RLS) policies ensure users can only view their own payments
- Admin users can view and manage all payments
- File uploads are secured through Supabase storage permissions

## 6. Debugging Common Issues

### Payment Proof Upload Failing
- Check that the storage bucket exists and is properly configured
- Ensure the form is sending the file with the correct field name (`payment_proof`)
- Verify all required fields are being sent in the request

### Bad Request (400) Errors
- Check the console for debugging information
- Ensure all required fields are included:
  - `booking_id`
  - `amount`
  - `payment_method`
  - `user_id`

### Permission Errors
- Verify the user is authenticated
- Check that RLS policies are properly set up
- Make sure the server is using the service role client when needed

## 7. Testing the Payment System

1. Create a user account and log in
2. Book a flight
3. Upload a payment proof
4. Verify the payment is created in the database with "pending" status
5. As an admin, approve the payment
6. Verify the booking status changes to "confirmed"
