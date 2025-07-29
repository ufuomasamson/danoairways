# Booking System Flow

This document outlines how the booking system works in the Dano Airways application after migration to Supabase.

## 1. Booking Flow Overview

### User Journey
1. User tracks a flight using a tracking number
2. User views flight details 
3. User clicks the "Book Flight" button
4. System checks if the user is logged in
5. System creates a booking record in Supabase
6. User is redirected to payment page
7. User completes payment
8. System updates booking status to "confirmed"
9. User receives a confirmation and ticket

## 2. Technical Implementation

### Flight Tracking
- User enters a tracking number on the tracking page
- `handleTrackFlight` function fetches flight details from Supabase
- Flight data is displayed to the user including departure, arrival, and price

### Booking Creation
- When the user clicks "Book Flight", the `handleBookFlight` function is triggered
- The function checks for an existing user session from cookies
- If no session is found, an error is displayed prompting the user to log in
- The function then checks for any existing bookings for this user and flight
- If no booking exists, a new booking is created via the `/api/bookings` endpoint

### API Endpoint: `/api/bookings`
- **GET**: Fetches bookings with optional filtering by `user_id` and/or `flight_id`
- **POST**: Creates a new booking with the following data:
  - `user_id`: UUID of the authenticated user
  - `flight_id`: ID of the flight being booked
  - `passenger_name`: Name of the passenger (from flight record or user profile)
  - `paid`: Boolean indicating payment status (default: false)
  - `created_at`: Timestamp of booking creation
  - `status`: Booking status (default: "pending")

### Security Implementation
- Row Level Security (RLS) policies ensure users can only:
  - View their own bookings
  - Create bookings for themselves
  - Update their own bookings
- Admin users have full access to all bookings through additional RLS policies
- Service role API calls bypass RLS for administrative functions

## 3. Database Schema

### Bookings Table
```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flight_id INTEGER NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
    passenger_name TEXT NOT NULL,
    paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'pending',
    payment_intent_id TEXT,
    payment_method TEXT,
    amount DECIMAL(10, 2)
);
```

### Key Fields
- `id`: Unique identifier for the booking
- `user_id`: Links to Supabase auth.users table
- `flight_id`: Links to flights table
- `passenger_name`: Name of the passenger
- `paid`: Whether payment has been completed
- `status`: Current booking status (pending, confirmed, cancelled)
- `payment_intent_id`: ID from payment processor (for payment verification)

## 4. Handling Edge Cases

### Error Handling
- Failed API calls return appropriate error messages
- Client-side validation ensures all required fields are present
- Server-side validation checks user permissions and data integrity

### Booking Status Flow
1. **Pending**: Initial state when booking is created
2. **Confirmed**: After successful payment
3. **Cancelled**: If user cancels or payment fails
4. **Completed**: After flight has departed

## 5. Testing the Booking System

To test the booking system:
1. Create a user account and log in
2. Track a flight using a valid tracking number
3. Click "Book Flight" on the flight details page
4. Verify a booking is created in the database with "pending" status
5. Complete the payment process
6. Verify the booking status changes to "confirmed"

## 6. Troubleshooting Common Issues

### "Failed to book flight" Error
- Check user authentication status
- Verify the flight exists in the database
- Ensure proper Supabase permissions are set
- Check server logs for detailed error messages

### Payment Processing Issues
- Verify payment gateway configuration
- Check payment intent creation and confirmation
- Ensure webhook endpoints are properly configured

## 7. Future Enhancements

- Implement booking expiration for unpaid bookings
- Add email notifications for booking status changes
- Create a booking management interface for users
- Implement seat selection functionality
