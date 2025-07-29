/**
 * Document Creation Functions for Appwrite
 * 
 * These functions create documents in each collection using the Appwrite SDK.
 * Each function is modular and can be imported for use in API routes or server-side logic.
 */

import { ID, Databases } from 'appwrite';

/**
 * Create a new flight document in Appwrite
 * @param {Databases} databases - Appwrite Databases instance
 * @param {object} flightData - Flight data to be created
 * @returns {Promise<object>} Created flight document
 */
export async function createFlight(databases, flightData) {
  // Set default values for required fields if not provided
  const flight = {
    airline_id: flightData.airline_id || "airline_12345",
    flight_number: flightData.flight_number || "UA2025",
    departure_location_id: flightData.departure_location_id || "loc_nyc",
    arrival_location_id: flightData.arrival_location_id || "loc_london",
    date: flightData.date || new Date().toISOString().split('T')[0],
    time: flightData.time || "14:30",
    price: flightData.price || 499.99,
    created_at: new Date().toISOString(),
    passenger_name: flightData.passenger_name || "John Doe",
    tracking_number: flightData.tracking_number || `TRK-${Math.floor(Math.random() * 1000000)}`,
    trip: flightData.trip || "one-way",
    tour_type: flightData.tour_type || "business",
    passenger_count: flightData.passenger_count || 1,
    class: flightData.class || "economy",
    currency: flightData.currency || "USD"
  };

  return await databases.createDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    process.env.NEXT_PUBLIC_COLLECTION_FLIGHTS,
    ID.unique(),
    flight
  );
}

/**
 * Create a new airline document in Appwrite
 * @param {Databases} databases - Appwrite Databases instance
 * @param {object} airlineData - Airline data to be created
 * @returns {Promise<object>} Created airline document
 */
export async function createAirline(databases, airlineData) {
  // Set default values for required fields if not provided
  const airline = {
    name: airlineData.name || "Dano Airways",
    logo_url: airlineData.logo_url || "https://storage.appwrite.io/airline_logos/ua_logo.png"
  };

  return await databases.createDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    process.env.NEXT_PUBLIC_COLLECTION_AIRLINES,
    ID.unique(),
    airline
  );
}

/**
 * Create a new booking document in Appwrite
 * @param {Databases} databases - Appwrite Databases instance
 * @param {object} bookingData - Booking data to be created
 * @returns {Promise<object>} Created booking document
 */
export async function createBooking(databases, bookingData) {
  // Set default values for required fields if not provided
  const booking = {
    user_id: bookingData.user_id || "user_12345",
    flight_id: bookingData.flight_id || "flight_67890",
    passenger_name: bookingData.passenger_name || "Jane Smith",
    paid: bookingData.paid !== undefined ? bookingData.paid : false,
    ticket_url: bookingData.ticket_url || "https://storage.appwrite.io/tickets/ticket_1234.pdf",
    created_at: new Date().toISOString(),
    status: bookingData.status || "Pending"
  };

  return await databases.createDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    process.env.NEXT_PUBLIC_COLLECTION_BOOKINGS,
    ID.unique(),
    booking
  );
}

/**
 * Create a new crypto wallet document in Appwrite
 * @param {Databases} databases - Appwrite Databases instance
 * @param {object} walletData - Wallet data to be created
 * @returns {Promise<object>} Created wallet document
 */
export async function createCryptoWallet(databases, walletData) {
  // Set default values for required fields if not provided
  const wallet = {
    user_email: walletData.user_email || "user@example.com",
    wallet_address: walletData.wallet_address || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    qr_code_url: walletData.qr_code_url || "https://storage.appwrite.io/qr_codes/wallet_qr_12345.png",
    created_at: new Date().toISOString(),
    network: walletData.network || "Ethereum",
    name: walletData.name || "Main ETH Wallet"
  };

  return await databases.createDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    process.env.NEXT_PUBLIC_COLLECTION_CRYPTO_WALLETS,
    ID.unique(),
    wallet
  );
}

/**
 * Create a new currency document in Appwrite
 * @param {Databases} databases - Appwrite Databases instance
 * @param {object} currencyData - Currency data to be created
 * @returns {Promise<object>} Created currency document
 */
export async function createCurrency(databases, currencyData) {
  // Set default values for required fields if not provided
  const currency = {
    code: currencyData.code || "USD",
    name: currencyData.name || "US Dollars",
    symbol: currencyData.symbol || "$"
  };

  return await databases.createDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    process.env.NEXT_PUBLIC_COLLECTION_CURRENCIES,
    ID.unique(),
    currency
  );
}

/**
 * Create a new location document in Appwrite
 * @param {Databases} databases - Appwrite Databases instance
 * @param {object} locationData - Location data to be created
 * @returns {Promise<object>} Created location document
 */
export async function createLocation(databases, locationData) {
  // Set default values for required fields if not provided
  const location = {
    city: locationData.city || "New York",
    country: locationData.country || "United States"
  };

  return await databases.createDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    process.env.NEXT_PUBLIC_COLLECTION_LOCATIONS,
    ID.unique(),
    location
  );
}

/**
 * Create a new payment gateway document in Appwrite
 * @param {Databases} databases - Appwrite Databases instance
 * @param {object} gatewayData - Payment gateway data to be created
 * @returns {Promise<object>} Created payment gateway document
 */
export async function createPaymentGateway(databases, gatewayData) {
  // Set default values for required fields if not provided
  const gateway = {
    name: gatewayData.name || "Flutterwave",
    api_key: gatewayData.api_key || "FLWSECK_TEST-1234567890abcdef-X",
    enabled: gatewayData.enabled !== undefined ? gatewayData.enabled : true
  };

  return await databases.createDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    process.env.NEXT_PUBLIC_COLLECTION_PAYMENT_GATEWAYS,
    ID.unique(),
    gateway
  );
}

/**
 * Create a new payment document in Appwrite
 * @param {Databases} databases - Appwrite Databases instance
 * @param {object} paymentData - Payment data to be created
 * @returns {Promise<object>} Created payment document
 */
export async function createPayment(databases, paymentData) {
  // Set default values for required fields if not provided
  const payment = {
    booking_id: paymentData.booking_id || "booking_12345",
    wallet_id: paymentData.wallet_id || "wallet_67890",
    amount: paymentData.amount || 499.99,
    proof_url: paymentData.proof_url || "https://storage.appwrite.io/payment_proofs/tx_12345.png",
    status: paymentData.status || "pending",
    created_at: new Date().toISOString()
  };

  return await databases.createDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    process.env.NEXT_PUBLIC_COLLECTION_PAYMENTS,
    ID.unique(),
    payment
  );
}

/**
 * Create a new user preferences document in Appwrite
 * @param {Databases} databases - Appwrite Databases instance
 * @param {object} preferencesData - User preferences data to be created
 * @returns {Promise<object>} Created user preferences document
 */
export async function createUserPreferences(databases, preferencesData) {
  // Set default values for required fields if not provided
  const preferences = {
    user_email: preferencesData.user_email || "user@example.com",
    currency_id: preferencesData.currency_id || "currency_usd",
    notifications_enabled: preferencesData.notifications_enabled !== undefined ? preferencesData.notifications_enabled : true
  };

  return await databases.createDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    process.env.NEXT_PUBLIC_COLLECTION_USER_PREFERENCES,
    ID.unique(),
    preferences
  );
}

/**
 * Create a new user document in Appwrite
 * @param {Databases} databases - Appwrite Databases instance
 * @param {object} userData - User data to be created
 * @returns {Promise<object>} Created user document
 */
export async function createUser(databases, userData) {
  // Set default values for required fields if not provided
  const user = {
    email: userData.email || "user@example.com",
    password_hash: userData.password_hash || "hashed_password_value", // In practice, this should be properly hashed
    full_name: userData.full_name || "John Doe",
    role: userData.role || "user",
    created_at: new Date().toISOString()
  };

  return await databases.createDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    process.env.NEXT_PUBLIC_COLLECTION_USERS,
    ID.unique(),
    user
  );
}
