-- Supabase Schema for Dano Airways Application

-- Enable Row Level Security (RLS) for all tables
-- This is a Supabase security feature

-- Flights Table
CREATE TABLE flights (
  id SERIAL PRIMARY KEY,
  airline_id INTEGER NOT NULL REFERENCES airlines(id) ON DELETE CASCADE,
  flight_number VARCHAR(32) NOT NULL,
  departure_location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  arrival_location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time VARCHAR(16) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  passenger_name VARCHAR(128),
  tracking_number VARCHAR(32),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;

-- Create policy for flights - public read, admin write
CREATE POLICY "Flights are viewable by everyone" ON flights
  FOR SELECT USING (true);
  
CREATE POLICY "Flights are editable by admins" ON flights
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Locations Table
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  city VARCHAR(64) NOT NULL,
  country VARCHAR(64) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policy for locations
CREATE POLICY "Locations are viewable by everyone" ON locations
  FOR SELECT USING (true);
  
CREATE POLICY "Locations are editable by admins" ON locations
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Airlines Table
CREATE TABLE airlines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  logo_url VARCHAR(256),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE airlines ENABLE ROW LEVEL SECURITY;

-- Create policy for airlines
CREATE POLICY "Airlines are viewable by everyone" ON airlines
  FOR SELECT USING (true);
  
CREATE POLICY "Airlines are editable by admins" ON airlines
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Profiles Table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(128),
  role VARCHAR(32) DEFAULT 'user',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
  
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create trigger to create profile when user signs up
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE create_profile_for_user();

-- Bookings Table
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id INTEGER NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  passenger_name VARCHAR(128) NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  ticket_url VARCHAR(256),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for bookings
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Admins can manage all bookings" ON bookings
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Currencies Table
CREATE TABLE currencies (
  id SERIAL PRIMARY KEY,
  code VARCHAR(8) NOT NULL,
  name VARCHAR(32) NOT NULL,
  symbol VARCHAR(8) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Create policy for currencies - public read, admin write
CREATE POLICY "Currencies are viewable by everyone" ON currencies
  FOR SELECT USING (true);
  
CREATE POLICY "Currencies are editable by admins" ON currencies
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Payment Gateways Table
CREATE TABLE payment_gateways (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  api_key VARCHAR(128),
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;

-- Create policy for payment gateways - admin only
CREATE POLICY "Payment gateways are viewable by admins" ON payment_gateways
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );
  
CREATE POLICY "Payment gateways are editable by admins" ON payment_gateways
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- User Preferences Table
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  currency_id INTEGER REFERENCES currencies(id) ON DELETE SET NULL,
  notifications_enabled BOOLEAN DEFAULT TRUE
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for user preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Admins can view all preferences" ON user_preferences
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Crypto Wallets Table
CREATE TABLE crypto_wallets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(128) NOT NULL,
  qr_code_url VARCHAR(256),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;

-- Create policy for crypto wallets
CREATE POLICY "Users can view their own wallets" ON crypto_wallets
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own wallets" ON crypto_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own wallets" ON crypto_wallets
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Admins can view all wallets" ON crypto_wallets
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Payments Table (new table for payment tracking)
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency_code VARCHAR(8) NOT NULL,
  payment_gateway VARCHAR(64),
  status VARCHAR(32) DEFAULT 'pending',
  transaction_id VARCHAR(128),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy for payments
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Admins can manage all payments" ON payments
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Bank Details Table (for bank transfer payments)
CREATE TABLE bank_details (
  id SERIAL PRIMARY KEY,
  details TEXT NOT NULL, -- Complete bank details as formatted text
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE bank_details ENABLE ROW LEVEL SECURITY;

-- Create policy for bank details
CREATE POLICY "Bank details are viewable by everyone" ON bank_details
  FOR SELECT USING (true);
  
CREATE POLICY "Bank details are editable by admins" ON bank_details
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );
