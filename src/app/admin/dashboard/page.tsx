"use client";
import { useEffect, useState, useRef } from 'react';
import { useCurrencyStore } from '@/lib/currencyManager';
import { useRouter } from 'next/navigation';
import { downloadTicket } from '@/lib/downloadTicket';

import MetricsCard from '@/components/MetricsCard';
import AdminLiveChatPage from '../live-chat/page';

export default function AdminDashboard() {
  // --- Basic state for admin dashboard ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState('dashboard');
  const [stats, setStats] = useState({
    totalFlights: 0,
    totalAirlines: 0,
    totalLocations: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalFlightValue: 0,
    totalUsers: 0,
    totalWallets: 0,
    totalPaymentIntegrations: 0,
    users: [] as any[],
  });
  
  // --- Location and Flight related state ---
  const [locations, setLocations] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [flightToDelete, setFlightToDelete] = useState<number | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteFlightLoading, setDeleteFlightLoading] = useState(false);
  const [deleteFlightError, setDeleteFlightError] = useState('');
  
  // --- Payment related state ---
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [paymentActionError, setPaymentActionError] = useState('');
  const [paymentActionSuccess, setPaymentActionSuccess] = useState('');
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [showTicket, setShowTicket] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  
  // --- Location management state ---
  const [locationForm, setLocationForm] = useState({ city: '', country: '', error: '', success: '', submitting: false });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editLocation, setEditLocation] = useState<any>(null);

  // --- Create Flight State and Logic ---
  const [createFlight, setCreateFlight] = useState({
    passengerName: "",
    flightNumber: "",
    airlineId: "",
    departureId: "",
    arrivalId: "",
    date: "",
    time: "",
    price: "",
    currency: "USD",
    trip: "One-way",
    tourType: "Economy",
    passengerClass: "1 Passenger, Economy",
    error: "",
    success: "",
    submitting: false
  });

  // --- Crypto wallet state ---
  const [cryptoWallets, setCryptoWallets] = useState<any[]>([]);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [newWallet, setNewWallet] = useState({ name: '', address: '', network: '' });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [walletSuccess, setWalletSuccess] = useState('');
  
  // --- Airlines management state ---
  const [airlines, setAirlines] = useState<any[]>([]);
  const [showAirlineForm, setShowAirlineForm] = useState(false);
  const [editingAirlineId, setEditingAirlineId] = useState<string | null>(null);
  const [airlineFormData, setAirlineFormData] = useState({
    name: "",
    logo_url: ""
  });
  const [airlineLogoFile, setAirlineLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [airlineError, setAirlineError] = useState("");
  const [airlineSuccess, setAirlineSuccess] = useState("");
  const [airlineUploading, setAirlineUploading] = useState(false);

  // --- Payment Gateway Configuration state ---
  const [showPaymentConfig, setShowPaymentConfig] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'flutterwave' | 'paystack' | null>(null);
  const [paymentConfigLoading, setPaymentConfigLoading] = useState(false);
  const [paymentConfigError, setPaymentConfigError] = useState('');
  const [paymentConfigSuccess, setPaymentConfigSuccess] = useState('');
  
  // --- Bank Details state ---
  const [bankDetails, setBankDetails] = useState<string>('');
  const [bankDetailsLoading, setBankDetailsLoading] = useState(false);
  const [bankDetailsSaving, setBankDetailsSaving] = useState(false);
  const [bankDetailsMessage, setBankDetailsMessage] = useState('');
  const [bankDetailsError, setBankDetailsError] = useState('');
  
  // Flutterwave state
  const [flutterwaveKeys, setFlutterwaveKeys] = useState({
    test_public: '',
    test_secret: '',
    test_encryption: '',
    live_public: '',
    live_secret: '',
    live_encryption: ''
  });
  
  // Paystack state
  const [paystackKeys, setPaystackKeys] = useState({
    test_public: '',
    test_secret: '',
    live_public: '',
    live_secret: ''
  });
  
  const router = useRouter();
  const { formatPrice } = useCurrencyStore();

  const fetchCryptoWallets = async () => {
    try {
      const res = await fetch('/api/crypto-wallets');
      const data = await res.json();
      setCryptoWallets(Array.isArray(data) ? data : []);
    } catch (e) {
      setCryptoWallets([]);
    }
  };

  const fetchBankDetails = async () => {
    setBankDetailsLoading(true);
    try {
      const response = await fetch('/api/admin/bank-details');
      const data = await response.json();
      
      if (data.success && data.data) {
        setBankDetails(data.data.details || '');
      }
    } catch (err) {
      console.error('Error fetching bank details:', err);
      setBankDetailsError('Failed to load bank details');
    } finally {
      setBankDetailsLoading(false);
    }
  };
  
  const fetchAirlines = async () => {
    try {
      const res = await fetch('/api/airlines');
      const data = await res.json();
      setAirlines(data || []);
    } catch (err) {
      setAirlineError('Failed to fetch airlines');
    }
  };

  const handleCreateFlight = async (e: any) => {
    e.preventDefault();
    setCreateFlight(f => ({...f, error: "", success: "", submitting: true}));
    // Generate tracking number
    const trackingNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
    try {
      const res = await fetch('/api/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flight_number: createFlight.flightNumber,
          airline_id: createFlight.airlineId,
          departure_location_id: createFlight.departureId,
          arrival_location_id: createFlight.arrivalId,
          date: createFlight.date,
          time: createFlight.time,
          price: parseFloat(Number(createFlight.price).toFixed(2)),
          currency: createFlight.currency || 'USD', // Send the currency field
          tracking_number: trackingNumber,
          ticket_url: null,
          trip: createFlight.trip,
          tour_type: createFlight.tourType,
          passenger_class: createFlight.passengerClass,
          passenger_name: createFlight.passengerName
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create flight');
      }
      // Update flight stats and refresh flight list
      fetchDashboardStats();
      
      // Reset form with success message
      setCreateFlight(f => ({
        ...f,
        success: 'Flight created successfully!',
        error: '',
        submitting: false,
        passengerName: '',
        flightNumber: '',
        airlineId: '',
        departureId: '',
        arrivalId: '',
        date: '',
        time: '',
        price: '',
        currency: 'USD',
        trip: 'One-way',
        tourType: 'Economy',
        passengerClass: '1 Passenger, Economy'
      }));
      
      // Re-fetch airlines and locations to keep dropdown options fresh
      fetchAirlines();
    } catch (err: any) {
      setCreateFlight(f => ({...f, error: err.message || 'An error occurred', submitting: false}));
    }
  };

  useEffect(() => {
    // Read user info from cookie
    const cookie = document.cookie.split('; ').find(row => row.startsWith('user='));
    if (!cookie) {
      router.replace('/login');
      return;
    }
    try {
      const userObj = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
      setUser(userObj);
      if (userObj.role !== 'admin') {
        router.replace('/search');
        return;
      }
      setIsAdmin(true);
    } catch {
      router.replace('/login');
      return;
    }
    fetchDashboardStats();
    fetchCryptoWallets();
    fetchAirlines();
    if (selectedPage === 'bankDetails') {
      fetchBankDetails();
    }
    setLoading(false);
    // eslint-disable-next-line
  }, [router]);
  
  // Watch for changes in the selected page and fetch data accordingly
  useEffect(() => {
    if (selectedPage === 'approvePayments') {
      fetchPendingPayments();
    } else if (selectedPage === 'bankDetails') {
      fetchBankDetails();
    }
  }, [selectedPage]);

  const handleAddWallet = async (e: any) => {
    e.preventDefault();
    setWalletLoading(true);
    setWalletError('');
    setWalletSuccess('');
    if (!newWallet.name || !newWallet.address || !newWallet.network || !qrFile) {
      setWalletError('All fields are required.');
      setWalletLoading(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', newWallet.name);
      formData.append('address', newWallet.address);
      formData.append('network', newWallet.network);
      formData.append('qr_code', qrFile);
      const res = await fetch('/api/crypto-wallets', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      setWalletSuccess('Wallet added successfully!');
      setNewWallet({ name: '', address: '', network: '' });
      setQrFile(null);
      setShowWalletModal(false);
      
      // Refresh both crypto wallets and dashboard stats
      fetchCryptoWallets();
      fetchDashboardStats();
    } catch (err: any) {
      setWalletError(err.message || 'Failed to add wallet');
    }
    setWalletLoading(false);
  };

  // Payment Gateway Configuration Functions
  const openPaymentConfig = (gateway: 'flutterwave' | 'paystack') => {
    setSelectedGateway(gateway);
    setShowPaymentConfig(true);
    fetchPaymentGatewayKeys(gateway);
  };

  const closePaymentConfig = () => {
    setShowPaymentConfig(false);
    setSelectedGateway(null);
    setPaymentConfigError('');
    setPaymentConfigSuccess('');
  };

  const fetchPaymentGatewayKeys = async (gateway: 'flutterwave' | 'paystack') => {
    setPaymentConfigLoading(true);
    try {
      const res = await fetch('/api/save-api-keys?gateway=' + gateway);
      const data = await res.json();
      
      if (data.success && data.keys) {
        if (gateway === 'flutterwave') {
          setFlutterwaveKeys({
            test_public: data.keys.test_public || '',
            test_secret: data.keys.test_secret || '',
            test_encryption: data.keys.test_encryption || '',
            live_public: data.keys.live_public || '',
            live_secret: data.keys.live_secret || '',
            live_encryption: data.keys.live_encryption || ''
          });
        } else if (gateway === 'paystack') {
          setPaystackKeys({
            test_public: data.keys.test_public || '',
            test_secret: data.keys.test_secret || '',
            live_public: data.keys.live_public || '',
            live_secret: data.keys.live_secret || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching payment gateway keys:', error);
    }
    setPaymentConfigLoading(false);
  };

  const savePaymentGatewayKeys = async () => {
    if (!selectedGateway) return;
    
    setPaymentConfigLoading(true);
    setPaymentConfigError('');
    setPaymentConfigSuccess('');

    try {
      const keysToSave = selectedGateway === 'flutterwave' 
        ? Object.entries(flutterwaveKeys).map(([type, api_key]) => ({
            name: 'flutterwave',
            type,
            api_key
          })).filter(key => key.api_key)
        : Object.entries(paystackKeys).map(([type, api_key]) => ({
            name: 'paystack', 
            type,
            api_key
          })).filter(key => key.api_key);

      const res = await fetch('/api/save-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keys: keysToSave }),
      });

      const result = await res.json();
      
      if (result.success) {
        setPaymentConfigSuccess(`${selectedGateway} API keys saved successfully!`);
      } else {
        setPaymentConfigError(result.error || 'Failed to save API keys');
      }
    } catch (error) {
      setPaymentConfigError('Failed to save API keys');
    }
    setPaymentConfigLoading(false);
  };

  const handleSaveBankDetails = async () => {
    // Validate required fields
    if (!bankDetails.trim()) {
      setBankDetailsError('Please enter bank details');
      return;
    }

    setBankDetailsSaving(true);
    setBankDetailsError('');
    setBankDetailsMessage('');

    try {
      const response = await fetch('/api/admin/bank-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          details: bankDetails
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBankDetailsMessage('Bank details saved successfully!');
      } else {
        setBankDetailsError(data.error || 'Failed to save bank details');
      }
    } catch (err) {
      console.error('Error saving bank details:', err);
      setBankDetailsError('Failed to save bank details');
    } finally {
      setBankDetailsSaving(false);
    }
  };

  // Function to fetch pending payments
  const fetchPendingPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await fetch('/api/payments?status=pending');
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      setPayments([]);
    }
    setPaymentsLoading(false);
  };

  // Handle flight deletion
  const handleDeleteFlight = async (flightId: number) => {
    setFlightToDelete(flightId);
    setShowDeleteConfirmation(true);
  };

  // Confirm and execute flight deletion
  const confirmDeleteFlight = async () => {
    if (!flightToDelete) return;
    
    setDeleteFlightLoading(true);
    setDeleteFlightError('');
    
    try {
      const res = await fetch(`/api/flights?id=${flightToDelete}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete flight');
      }
      
      // Success! Update the flight list
      fetchDashboardStats();
      setShowDeleteConfirmation(false);
      setFlightToDelete(null);
    } catch (error) {
      setDeleteFlightError(error instanceof Error ? error.message : 'Failed to delete flight');
    } finally {
      setDeleteFlightLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Fetch stats from custom API routes
      const flightsRes = await fetch('/api/flights');
      const airlinesRes = await fetch('/api/airlines');
      const locationsRes = await fetch('/api/locations');
      const usersRes = await fetch('/api/users');
      const paymentsRes = await fetch('/api/payments?status=approved');
      const bookingsRes = await fetch('/api/bookings');
      const walletsRes = await fetch('/api/crypto-wallets');
      const paymentGatewaysRes = await fetch('/api/save-api-keys?gateway=paystack');
      const flutterwaveGatewaysRes = await fetch('/api/save-api-keys?gateway=flutterwave');

      const flights = await flightsRes.json();
      const airlines = await airlinesRes.json();
      const locations = await locationsRes.json();
      const users = await usersRes.json();
      const payments = await paymentsRes.json();
      const bookings = await bookingsRes.json();
      const wallets = await walletsRes.json();
      const paystackData = await paymentGatewaysRes.json();
      const flutterwaveData = await flutterwaveGatewaysRes.json();

      console.log('Dashboard Stats Debug:', {
        bookings: { count: Array.isArray(bookings) ? bookings.length : 0, data: bookings },
        wallets: { count: Array.isArray(wallets) ? wallets.length : 0, data: wallets }
      });

      const safeFlights = flights || [];
      const safeUsers = users || [];
      const safePayments = Array.isArray(payments) ? payments : [];
      const safeBookings = Array.isArray(bookings) ? bookings : [];
      const safeWallets = Array.isArray(wallets) ? wallets : [];

      // Count payment integrations (how many gateways have configured keys)
      let paymentIntegrations = 0;
      if (paystackData.success && paystackData.keys && Object.keys(paystackData.keys).length > 0) {
        paymentIntegrations++;
      }
      if (flutterwaveData.success && flutterwaveData.keys && Object.keys(flutterwaveData.keys).length > 0) {
        paymentIntegrations++;
      }

      // Calculate total revenue from approved payments
      const totalRevenue = safePayments.reduce((sum: number, p: any) => {
        let amount = 0;
        if (typeof p.amount === 'number') {
          amount = p.amount;
        } else if (typeof p.amount === 'string') {
          amount = parseFloat(p.amount.trim());
        }

        // Convert NGN payments back to USD for display (approximate rate: 1500 NGN = 1 USD)
        if (p.currency === 'NGN' && p.payment_method === 'paystack') {
          amount = amount / 1500; // Convert NGN to USD
        }

        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      const totalFlightValue = safeFlights.reduce((sum: number, f: any) => {
        let price = f.price;
        if (price == null || price === '') return sum;
        // Consistently parse the price to a number with 2 decimal places
        const num = parseFloat(parseFloat(String(price)).toFixed(2));
        return sum + (isNaN(num) ? 0 : num);
      }, 0);

      // Calculate today's unpaid flight value (flights created today that haven't been booked/paid)
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      
      const todaysFlights = safeFlights.filter((f: any) => {
        if (!f.created_at) return false;
        const flightDate = new Date(f.created_at).toISOString().split('T')[0];
        return flightDate === today;
      });

      const todaysFlightValue = todaysFlights.reduce((sum: number, f: any) => {
        let price = f.price;
        if (price == null || price === '') return sum;
        const num = parseFloat(parseFloat(String(price)).toFixed(2));
        return sum + (isNaN(num) ? 0 : num);
      }, 0);

      // Calculate how much of today's flights have been paid for
      const todaysRevenue = safePayments.filter((p: any) => {
        if (!p.created_at) return false;
        const paymentDate = new Date(p.created_at).toISOString().split('T')[0];
        return paymentDate === today;
      }).reduce((sum: number, p: any) => {
        let amount = 0;
        if (typeof p.amount === 'number') {
          amount = p.amount;
        } else if (typeof p.amount === 'string') {
          amount = parseFloat(p.amount.trim());
        }

        // Convert NGN payments back to USD for display
        if (p.currency === 'NGN' && p.payment_method === 'paystack') {
          amount = amount / 1500;
        }

        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      // Calculate total unpaid flight value (all flights that haven't been booked or paid for)
      const unpaidFlightValue = safeFlights.reduce((sum: number, flight: any) => {
        // Check if this flight has a paid booking
        const hasPaidBooking = safeBookings.some((booking: any) => 
          booking.flight_id === flight.id && booking.paid === true
        );
        
        if (!hasPaidBooking) {
          // Flight is not paid for, add its value
          let price = flight.price;
          if (price == null || price === '') return sum;
          const num = parseFloat(parseFloat(String(price)).toFixed(2));
          return sum + (isNaN(num) ? 0 : num);
        }
        
        return sum;
      }, 0);
      
      console.log('Admin Dashboard Debug:', {
        totalFlightValue,
        totalRevenue,
        unpaidFlightValue,
        flightCount: safeFlights.length,
        paidBookingsCount: safeBookings.filter((b: any) => b.paid === true).length,
        totalBookingsCount: safeBookings.length
      });

      setFlights(safeFlights);
      setAirlines(airlines || []);
      setLocations(locations || []);
      
      setStats({
        totalFlights: safeFlights.length,
        totalAirlines: airlines.length || 0,
        totalLocations: locations.length || 0,
        totalBookings: safeBookings.length,
        totalRevenue: totalRevenue,
        totalFlightValue: unpaidFlightValue, // Show total unpaid flight value
        totalUsers: safeUsers.length,
        totalWallets: safeWallets.length,
        totalPaymentIntegrations: paymentIntegrations,
        users: safeUsers,
      });

      // Update the crypto wallets state as well
      setCryptoWallets(safeWallets);

      // Set flights and locations for other components to use
      setFlights(safeFlights);
      setLocations(Array.isArray(locations) ? locations : []);

      console.log('Final stats:', {
        totalBookings: safeBookings.length,
        totalWallets: safeWallets.length
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLocationFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocationForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocationForm(f => ({ ...f, error: '', success: '', submitting: true }));
    
    try {
      const method = editLocation ? 'PUT' : 'POST';
      const endpoint = editLocation ? `/api/locations/${editLocation.id}` : '/api/locations';
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: locationForm.city,
          country: locationForm.country
        })
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      setLocationForm(f => ({ 
        ...f, 
        success: `Location ${editLocation ? 'updated' : 'added'} successfully!`,
        error: '',
        submitting: false
      }));
      
      // Refresh locations list
      const locationsRes = await fetch('/api/locations');
      const locations = await locationsRes.json();
      setLocations(Array.isArray(locations) ? locations : []);
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        setShowLocationModal(false);
        setEditLocation(null);
        setLocationForm({ city: '', country: '', error: '', success: '', submitting: false });
      }, 1500);
      
    } catch (err: any) {
      setLocationForm(f => ({ 
        ...f, 
        error: err.message || `Failed to ${editLocation ? 'update' : 'add'} location`,
        submitting: false 
      }));
    }
  };

  const handleDeleteLocation = async (id: any) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    try {
      const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      
      // Refresh locations list
      const locationsRes = await fetch('/api/locations');
      const locations = await locationsRes.json();
      setLocations(Array.isArray(locations) ? locations : []);
    } catch (err: any) {
      alert(err.message || 'Failed to delete location');
    }
  };

  const handleDeleteWallet = async (id: any) => {
    if (!window.confirm('Are you sure you want to delete this crypto wallet?')) return;
    try {
      const res = await fetch(`/api/crypto-wallets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      
      // Refresh wallets list
      fetchCryptoWallets();
    } catch (err: any) {
      alert(err.message || 'Failed to delete wallet');
    }
  };

  const handleApprovePayment = async (id: any) => {
    if (!id) {
      console.error('Payment ID is undefined');
      setPaymentActionError('Payment ID is missing');
      return;
    }
    
    setPaymentActionLoading(true);
    setPaymentActionError('');
    setPaymentActionSuccess('');
    
    try {
      // Convert to string if it's a number to avoid potential API routing issues
      const paymentIdStr = id.toString();
      console.log('Approving payment ID:', paymentIdStr, 'Original type:', typeof id);
      
      const res = await fetch(`/api/payments/${paymentIdStr}/approve`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Approval error response:', errorText);
        throw new Error(errorText || 'Failed to approve payment');
      }
      
      setPaymentActionSuccess('Payment approved successfully!');
      
      // Fetch booking details for ticket generation
      if (selectedPayment && selectedPayment.booking_id) {
        try {
          console.log('Fetching booking details for ID:', selectedPayment.booking_id);
          const bookingRes = await fetch(`/api/bookings/${selectedPayment.booking_id}`);
          
          if (bookingRes.ok) {
            const booking = await bookingRes.json();
            console.log('Booking details retrieved:', booking);
            
            // Ensure the flight data is valid and has currency
            if (booking && booking.flight) {
              console.log('Flight currency:', booking.flight.currency);
              setTicketDetails(booking);
              setShowTicket(true);
            } else {
              console.error('Invalid booking data structure:', booking);
              setPaymentActionError('Invalid booking data structure');
            }
          } else {
            const errorText = await bookingRes.text();
            console.error('Failed to fetch booking details:', errorText);
            setPaymentActionError(`Failed to fetch booking details: ${errorText}`);
          }
        } catch (bookingErr) {
          console.error('Error fetching booking:', bookingErr);
          setPaymentActionError(`Error fetching booking: ${bookingErr instanceof Error ? bookingErr.message : String(bookingErr)}`);
        }
      }
      
      // Refresh payments
      try {
        const paymentsRes = await fetch('/api/payments?status=pending');
        const paymentsData = await paymentsRes.json();
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      } catch (refreshErr) {
        console.error('Error refreshing payments list:', refreshErr);
      }
      
      // Don't close modal immediately so user can see ticket
      setTimeout(() => {
        if (!showTicket) {
          setShowPaymentModal(false);
        }
      }, 1500);
    } catch (err: any) {
      console.error('Payment approval error:', err);
      setPaymentActionError(err.message || 'Failed to approve payment');
    }
    
    setPaymentActionLoading(false);
  };

  const handleRejectPayment = async (id: any) => {
    if (!id) {
      console.error('Payment ID is undefined');
      setPaymentActionError('Payment ID is missing');
      return;
    }
    
    setPaymentActionLoading(true);
    setPaymentActionError('');
    setPaymentActionSuccess('');
    
    try {
      // Convert to string if it's a number to avoid potential API routing issues
      const paymentIdStr = id.toString();
      console.log('Rejecting payment ID:', paymentIdStr, 'Original type:', typeof id);
      
      const res = await fetch(`/api/payments/${paymentIdStr}/reject`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Rejection error response:', errorText);
        throw new Error(errorText || 'Failed to reject payment');
      }
      
      setPaymentActionSuccess('Payment rejected successfully!');
      
      // Refresh payments
      try {
        const paymentsRes = await fetch('/api/payments?status=pending');
        const paymentsData = await paymentsRes.json();
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      } catch (refreshErr) {
        console.error('Error refreshing payments list:', refreshErr);
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowPaymentModal(false);
      }, 1500);
    } catch (err: any) {
      console.error('Payment rejection error:', err);
      setPaymentActionError(err.message || 'Failed to reject payment');
    }
    
    setPaymentActionLoading(false);
  };

  const handleSubmitAirline = async (e: React.FormEvent) => {
    e.preventDefault();
    setAirlineError("");
    setAirlineSuccess("");
    setAirlineUploading(true);
    
    if (!airlineFormData.name.trim()) {
      setAirlineError("Airline name is required");
      setAirlineUploading(false);
      return;
    }
    
    try {
      const method = editingAirlineId ? 'PUT' : 'POST';
      const url = editingAirlineId ? `/api/airlines/${editingAirlineId}` : '/api/airlines';
      const form = new FormData();
      
      form.append('name', airlineFormData.name);
      if (airlineLogoFile) form.append('logo', airlineLogoFile);
      if (airlineFormData.logo_url && !airlineLogoFile) form.append('logo_url', airlineFormData.logo_url);
      
      const res = await fetch(url, {
        method,
        body: form,
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save airline');
      }
      
      setAirlineSuccess(editingAirlineId ? 'Airline updated successfully!' : 'Airline created successfully!');
      setAirlineFormData({ name: "", logo_url: "" });
      setAirlineLogoFile(null);
      setEditingAirlineId(null);
      setShowAirlineForm(false);
      
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchAirlines();
      setTimeout(() => setAirlineSuccess(""), 3000);
    } catch (err: any) {
      setAirlineError(err.message || "An error occurred");
    }
    
    setAirlineUploading(false);
  };

  const handleEditAirline = (airline: any) => {
    setAirlineFormData({ name: airline.name, logo_url: airline.logo_url || "" });
    setAirlineLogoFile(null);
    setEditingAirlineId(airline.id);
    setShowAirlineForm(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAirline = async (id: string) => {
    if (!confirm("Are you sure you want to delete this airline?")) return;
    
    try {
      const res = await fetch(`/api/airlines/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete airline');
      }
      setAirlineSuccess("Airline deleted successfully!");
      fetchAirlines();
      setTimeout(() => setAirlineSuccess(""), 3000);
    } catch (err: any) {
      setAirlineError(err.message || "An error occurred");
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white shadow-xl rounded-xl">
          <h1 className="text-2xl font-bold text-[#4f1032] mb-4">Loading Admin Dashboard...</h1>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#cd7e0f] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#18176b] font-sans overflow-x-hidden">
      <div className="flex h-full grow flex-row">
        {/* Sidebar */}
        <aside className="flex flex-col w-64 min-h-screen bg-[#030338] p-4 justify-between border-r-4 border-gradient-to-b from-[#cd7e0f] via-[#d18a27] to-[#cd7e0f] shadow-lg relative before:absolute before:inset-y-0 before:right-0 before:w-1 before:bg-gradient-to-b before:from-[#cd7e0f] before:via-[#d18a27] before:to-[#cd7e0f] before:shadow-[0_0_10px_rgba(205,126,15,0.5)]">
          <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-[#cd7e0f] via-[#d18a27] to-[#cd7e0f] shadow-[0_0_10px_rgba(205,126,15,0.5)]"></div>
          <div className="flex flex-col gap-4">
            <h1 className="text-white text-xl font-medium">Admin Dashboard</h1>
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedPage('dashboard')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 ${selectedPage === 'dashboard' ? 'bg-[#cd7e0f] text-white' : 'text-white hover:bg-[#442743]'}`}
              >
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setSelectedPage('createFlight')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 ${selectedPage === 'createFlight' ? 'bg-[#cd7e0f] text-white' : 'text-white hover:bg-[#442743]'}`}
              >
                <span>Create Flight</span>
              </button>
              <button
                onClick={() => setSelectedPage('createdFlights')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 ${selectedPage === 'createdFlights' ? 'bg-[#cd7e0f] text-white' : 'text-white hover:bg-[#442743]'}`}
              >
                <span>Created Flights</span>
              </button>
              <button
                onClick={() => setSelectedPage('approvePayments')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 ${selectedPage === 'approvePayments' ? 'bg-[#cd7e0f] text-white' : 'text-white hover:bg-[#442743]'}`}
              >
                <span>Approve Payments</span>
              </button>
              <button
                onClick={() => setSelectedPage('cryptoWallets')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 ${selectedPage === 'cryptoWallets' ? 'bg-[#cd7e0f] text-white' : 'text-white hover:bg-[#442743]'}`}
              >
                <span>Crypto Wallets</span>
              </button>
              <button
                onClick={() => setSelectedPage('bankDetails')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 ${selectedPage === 'bankDetails' ? 'bg-[#cd7e0f] text-white' : 'text-white hover:bg-[#442743]'}`}
              >
                <span>Bank Details</span>
              </button>
              <button
                onClick={() => setSelectedPage('integrations')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 ${selectedPage === 'integrations' ? 'bg-[#cd7e0f] text-white' : 'text-white hover:bg-[#442743]'}`}
              >
                <span>Integrations</span>
              </button>
              <button
                onClick={() => setSelectedPage('locations')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 ${selectedPage === 'locations' ? 'bg-[#cd7e0f] text-white' : 'text-white hover:bg-[#442743]'}`}
              >
                <span>Locations</span>
              </button>
              <button
                onClick={() => setSelectedPage('airlines')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 ${selectedPage === 'airlines' ? 'bg-[#cd7e0f] text-white' : 'text-white hover:bg-[#442743]'}`}
              >
                <span>Manage Airlines</span>
              </button>
              <button
                onClick={() => setSelectedPage('liveChat')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 ${selectedPage === 'liveChat' ? 'bg-[#cd7e0f] text-white' : 'text-white hover:bg-[#442743]'}`}
              >
                <span>💬</span> Live Chat
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-3 rounded-lg flex items-center gap-2 text-white hover:bg-[#442743] mt-8"
              >
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex flex-col flex-1 max-w-[960px] mx-auto bg-gradient-to-br from-[#18176b] to-[#1a1870] shadow-xl ml-2 rounded-l-xl">
          {selectedPage === 'dashboard' && (
            <div className="flex flex-col">
              <div className="flex flex-wrap justify-between gap-3 p-4">
                <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">Dashboard</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
                <MetricsCard
                  title="Total Flights"
                  value={stats.totalFlights}
                  icon="✈️"
                  color="from-blue-500 to-blue-700"
                  delay={0}
                />
                <MetricsCard
                  title="Total Airlines"
                  value={stats.totalAirlines}
                  icon="🏢"
                  color="from-purple-500 to-purple-700"
                  delay={100}
                />
                <MetricsCard
                  title="Total Locations"
                  value={stats.totalLocations}
                  icon="🗺️"
                  color="from-green-500 to-green-700"
                  delay={200}
                />
                <MetricsCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon="👥"
                  color="from-cyan-500 to-blue-600"
                  delay={100}
                />
                <MetricsCard
                  title="Total Bookings"
                  value={stats.totalBookings}
                  icon="📋"
                  color="from-indigo-500 to-indigo-700"
                  delay={200}
                />
                <MetricsCard
                  title="Total Wallets"
                  value={stats.totalWallets}
                  icon="💰"
                  color="from-yellow-500 to-orange-600"
                  delay={300}
                />
                <MetricsCard
                  title="Payment Integrations"
                  value={stats.totalPaymentIntegrations}
                  icon="💳"
                  color="from-pink-500 to-red-600"
                  delay={400}
                />
                <MetricsCard
                  title="Total Revenue"
                  value={stats.totalRevenue}
                  icon="💸"
                  color="from-emerald-500 to-green-600"
                  delay={500}
                  formatValue={(value) => `$${Number(value).toFixed(2)}`}
                />
                <MetricsCard
                  title="Unpaid Flight Value"
                  value={stats.totalFlightValue}
                  icon="💡"
                  color="from-amber-500 to-yellow-600"
                  delay={600}
                  formatValue={(value) => `$${Number(value).toFixed(2)}`}
                />
              </div>
            </div>
          )}
          {selectedPage === 'liveChat' && (
            <div className="flex-1 bg-white rounded-lg overflow-hidden">
              <AdminLiveChatPage />
            </div>
          )}
          
          {selectedPage === 'createdFlights' && (
            <div className="p-8">
              <h2 className="text-white text-2xl font-bold mb-6">Created Flights</h2>
              {flights.length === 0 ? (
                <div className="text-gray-300 text-lg">No flights found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-[#030338] rounded-lg">
                    <thead>
                      <tr className="text-white text-left">
                        <th className="py-2 px-4">Flight #</th>
                        <th className="py-2 px-4">Airline</th>
                        <th className="py-2 px-4">Departure</th>
                        <th className="py-2 px-4">Arrival</th>
                        <th className="py-2 px-4">Price</th>
                        <th className="py-2 px-4">Status</th>
                        <th className="py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flights.map((flight: any) => (
                        <tr
                          key={flight.id}
                          className="border-b border-[#18176b] text-white hover:bg-[#cd7e0f]/20 transition"
                        >
                          <td 
                            className="py-2 px-4 cursor-pointer"
                            onClick={() => {
                              setSelectedFlight(flight);
                              setShowFlightModal(true);
                            }}
                          >{flight.flight_number || flight.id}</td>
                          <td 
                            className="py-2 px-4 cursor-pointer"
                            onClick={() => {
                              setSelectedFlight(flight);
                              setShowFlightModal(true);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {airlines.find(a => a.id === flight.airline_id)?.logo_url ? (
                                <img 
                                  src={airlines.find(a => a.id === flight.airline_id)?.logo_url} 
                                  alt="Airline logo" 
                                  className="h-6 w-6 object-contain"
                                />
                              ) : null}
                              <span>{airlines.find(a => a.id === flight.airline_id)?.name || flight.airline_name || flight.airline_id}</span>
                            </div>
                          </td>
                          <td 
                            className="py-2 px-4 cursor-pointer"
                            onClick={() => {
                              setSelectedFlight(flight);
                              setShowFlightModal(true);
                            }}
                          >{flight.departure_country || (flight.departure_location?.city ? `${flight.departure_location.city}, ${flight.departure_location.country}` : '-')}</td>
                          <td 
                            className="py-2 px-4 cursor-pointer"
                            onClick={() => {
                              setSelectedFlight(flight);
                              setShowFlightModal(true);
                            }}
                          >{flight.arrival_country || (flight.arrival_location?.city ? `${flight.arrival_location.city}, ${flight.arrival_location.country}` : '-')}</td>
                          <td 
                            className="py-2 px-4 cursor-pointer"
                            onClick={() => {
                              setSelectedFlight(flight);
                              setShowFlightModal(true);
                            }}
                          >${Number(flight.price).toFixed(2)}</td>
                          <td 
                            className="py-2 px-4 cursor-pointer"
                            onClick={() => {
                              setSelectedFlight(flight);
                              setShowFlightModal(true);
                            }}
                          >{flight.status || '-'}</td>
                          <td className="py-2 px-4">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFlight(flight.id);
                              }}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {selectedPage === 'createFlight' && (
            <div className="p-8">
              <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-[#4f1032] mb-6">Create New Flight</h2>
                <form onSubmit={handleCreateFlight} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Passenger Name *</label>
                      <input type="text" value={createFlight.passengerName} onChange={e => setCreateFlight(f => ({...f, passengerName: e.target.value}))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Flight Number *</label>
                      <input type="text" value={createFlight.flightNumber} onChange={e => setCreateFlight(f => ({...f, flightNumber: e.target.value}))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Airline *</label>
                      <select 
                        value={createFlight.airlineId} 
                        onChange={e => setCreateFlight(f => ({...f, airlineId: e.target.value}))} 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" 
                        required
                      >
                        <option value="">Select Airline</option>
                        {airlines.sort((a, b) => a.name.localeCompare(b.name)).map(airline => (
                          <option key={airline.id} value={airline.id}>
                            {airline.name}
                          </option>
                        ))}
                      </select>
                      {createFlight.airlineId && (
                        <div className="mt-2">
                          {airlines.find(a => a.id === createFlight.airlineId)?.logo_url ? (
                            <img 
                              src={airlines.find(a => a.id === createFlight.airlineId)?.logo_url} 
                              alt="Airline logo" 
                              className="h-8 object-contain"
                            />
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Departure Location *</label>
                      <select value={createFlight.departureId} onChange={e => setCreateFlight(f => ({...f, departureId: e.target.value}))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" required>
                        <option value="">Select Departure Location</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.city}, {l.country}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Location *</label>
                      <select value={createFlight.arrivalId} onChange={e => setCreateFlight(f => ({...f, arrivalId: e.target.value}))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" required>
                        <option value="">Select Arrival Location</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.city}, {l.country}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                      <input type="date" value={createFlight.date} onChange={e => setCreateFlight(f => ({...f, date: e.target.value}))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                      <input type="time" value={createFlight.time} onChange={e => setCreateFlight(f => ({...f, time: e.target.value}))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                      <input type="number" min="0" step="0.01" value={createFlight.price} onChange={e => setCreateFlight(f => ({...f, price: e.target.value}))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency *</label>
                      <select value={createFlight.currency} onChange={e => setCreateFlight(f => ({...f, currency: e.target.value}))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" required>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                        <option value="JPY">JPY</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trip</label>
                      <select value={createFlight.trip} onChange={e => setCreateFlight(f => ({...f, trip: e.target.value}))} className="w-full p-3 border rounded text-gray-900">
                        <option>One-way</option>
                        <option>Round-Trip</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tour type</label>
                      <select value={createFlight.tourType} onChange={e => setCreateFlight(f => ({...f, tourType: e.target.value}))} className="w-full p-3 border rounded text-gray-900">
                        <option>Economy</option>
                        <option>Business</option>
                        <option>First Class</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Passenger/ Class</label>
                      <select value={createFlight.passengerClass} onChange={e => setCreateFlight(f => ({...f, passengerClass: e.target.value}))} className="w-full p-3 border rounded text-gray-900">
                        <option>1 Passenger, Economy</option>
                        <option>2 Passengers, Economy</option>
                        <option>1 Passenger, Business</option>
                      </select>
                    </div>
                  </div>
                  {/* Selected airline details */}
                  {createFlight.airlineId && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <p className="font-medium text-gray-700 mb-2">Selected Airline:</p>
                      <div className="flex items-center gap-3">
                        {airlines.find(a => a.id === createFlight.airlineId)?.logo_url ? (
                          <img 
                            src={airlines.find(a => a.id === createFlight.airlineId)?.logo_url}
                            alt="Airline logo"
                            className="w-12 h-12 object-contain rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="text-[#4f1032] font-semibold">
                            {airlines.find(a => a.id === createFlight.airlineId)?.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                
                  {createFlight.error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{createFlight.error}</div>}
                  {createFlight.success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{createFlight.success}</div>}
                  <div className="flex gap-4 pt-6">
                    <button type="submit" className="flex-1 bg-[#cd7e0f] text-white py-3 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={createFlight.submitting}>
                      {createFlight.submitting ? "Creating Flight..." : "Create Flight"}
                    </button>
                    <button type="button" onClick={() => setSelectedPage('dashboard')} className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {selectedPage === 'approvePayments' && (
            <div className="p-8">
              <h2 className="text-white text-2xl font-bold mb-6">Approve Payments</h2>
              {paymentsLoading ? (
                <div className="text-gray-300 text-lg">Loading payments...</div>
              ) : payments.length === 0 ? (
                <div className="text-gray-300 text-lg">No pending payments found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-[#030338] rounded-lg">
                    <thead>
                      <tr className="text-white text-left">
                        <th className="py-2 px-4">Payment ID</th>
                        <th className="py-2 px-4">Booking ID</th>
                        <th className="py-2 px-4">Amount</th>
                        <th className="py-2 px-4">Wallet</th>
                        <th className="py-2 px-4">Proof</th>
                        <th className="py-2 px-4">Status</th>
                        <th className="py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment: any) => (
                        <tr key={payment.id || payment.payment_id} className="border-b border-[#18176b] text-white">
                          <td className="py-2 px-4">{payment.id || payment.payment_id}</td>
                          <td className="py-2 px-4">{payment.booking_id}</td>
                          <td className="py-2 px-4">${Number(payment.amount).toFixed(2)}</td>
                          <td className="py-2 px-4">{payment.wallet_name || payment.wallet_id}</td>
                          <td className="py-2 px-4">
                            {payment.proof_url ? (
                              <a href={payment.proof_url} target="_blank" rel="noopener noreferrer" className="underline text-[#cd7e0f]">View</a>
                            ) : '-'}
                          </td>
                          <td className="py-2 px-4">{payment.status}</td>
                          <td className="py-2 px-4">
                            <button
                              className="bg-[#cd7e0f] text-white px-3 py-1 rounded hover:bg-[#cd7e0f]/90 mr-2"
                              onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedPayment(payment); 
                                setShowPaymentModal(true); 
                              }}
                            >Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {selectedPage === 'cryptoWallets' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-2xl font-bold">Crypto Wallets</h2>
                <button
                  className="bg-[#cd7e0f] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition"
                  onClick={() => setShowWalletModal(true)}
                >Add Wallet</button>
              </div>
              <div className="space-y-4">
                {cryptoWallets.length === 0 ? (
                  <div className="text-gray-300 text-lg">No wallets found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cryptoWallets.map(wallet => (
                      <div key={wallet.id} className="bg-[#030338] rounded-lg p-6 flex flex-col gap-2 relative">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-[#cd7e0f] text-lg">{wallet.name}</span>
                          <button
                            onClick={() => handleDeleteWallet(wallet.id)}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition"
                            title="Delete wallet"
                          >
                            Delete
                          </button>
                        </div>
                        <span className="text-white text-sm">Network: {wallet.network}</span>
                        <span className="text-white text-sm break-all">Address: {wallet.address || wallet.wallet_address}</span>
                        {wallet.qr_code_url && (
                          <img src={wallet.qr_code_url} alt="QR Code" className="w-20 h-20 object-contain mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {selectedPage === 'integrations' && (
            <div className="p-8">
              <h2 className="text-white text-2xl font-bold mb-6">Integrations</h2>
              <div className="bg-[#030338] rounded-lg p-6 mb-6">
                <p className="text-white text-base mb-2">Connect your admin dashboard to external services for payments, notifications, and more.</p>
                <ul className="space-y-4">
                  {/* Payment Gateways */}
                  <li className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#cd7e0f]">Flutterwave Payments</span>
                      <span className="ml-2 text-xs text-gray-300">(Payment Gateway)</span>
                    </div>
                    <button 
                      onClick={() => openPaymentConfig('flutterwave')}
                      className="bg-[#cd7e0f] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition"
                    >
                      Configure
                    </button>
                  </li>
                  <li className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#cd7e0f]">Paystack Payments</span>
                      <span className="ml-2 text-xs text-gray-300">(Payment Gateway)</span>
                    </div>
                    <button 
                      onClick={() => openPaymentConfig('paystack')}
                      className="bg-[#cd7e0f] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition"
                    >
                      Configure
                    </button>
                  </li>
                  <li className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#cd7e0f]">Stripe Payments</span>
                      <span className="ml-2 text-xs text-gray-300">(Payment Gateway - Coming Soon)</span>
                    </div>
                    <button className="bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold cursor-not-allowed" disabled>Connect</button>
                  </li>
                  <li className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#cd7e0f]">Twilio SMS</span>
                      <span className="ml-2 text-xs text-gray-300">(Notifications - Coming Soon)</span>
                    </div>
                    <button className="bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold cursor-not-allowed" disabled>Connect</button>
                  </li>
                  <li className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#cd7e0f]">SendGrid Email</span>
                      <span className="ml-2 text-xs text-gray-300">(Email Service - Coming Soon)</span>
                    </div>
                    <button className="bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold cursor-not-allowed" disabled>Connect</button>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-[#4f1032] font-bold text-lg mb-2">Payment Gateway Configuration</h3>
                <ul className="list-disc pl-6 text-gray-700 text-sm space-y-2">
                  <li><strong>Flutterwave:</strong> Click "Configure" to set up your Flutterwave API keys for card, bank transfer, and mobile money payments.</li>
                  <li><strong>Paystack:</strong> Click "Configure" to set up your Paystack API keys for card and bank payments.</li>
                  <li>Both test and live API keys can be configured for different environments.</li>
                  <li>Users will see a payment method selection modal when making payments.</li>
                  <li>Payment verification is handled automatically after successful transactions.</li>
                </ul>
              </div>
            </div>
          )}
          
          {selectedPage === 'locations' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-2xl font-bold">Manage Locations</h2>
                <button
                  className="bg-[#cd7e0f] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition"
                  onClick={() => { setEditLocation(null); setLocationForm({ city: '', country: '', error: '', success: '', submitting: false }); setShowLocationModal(true); }}
                >Add Location</button>
              </div>
              <div className="space-y-4">
                {locations.length === 0 ? (
                  <div className="text-gray-300 text-lg">No locations found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-[#030338] rounded-lg">
                      <thead>
                        <tr className="text-white text-left">
                          <th className="py-2 px-4">City</th>
                          <th className="py-2 px-4">Country</th>
                          <th className="py-2 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locations.map((loc: any) => (
                          <tr key={loc.id} className="border-b border-[#18176b] text-white">
                            <td className="py-2 px-4">{loc.city}</td>
                            <td className="py-2 px-4">{loc.country}</td>
                            <td className="py-2 px-4 flex gap-2">
                              <button
                                className="bg-[#cd7e0f] text-white px-3 py-1 rounded hover:bg-[#cd7e0f]/90"
                                onClick={() => { setEditLocation(loc); setLocationForm({ city: loc.city, country: loc.country, error: '', success: '', submitting: false }); setShowLocationModal(true); }}
                              >Edit</button>
                              <button
                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                onClick={() => handleDeleteLocation(loc.id)}
                              >Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {selectedPage === 'airlines' && (
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-2xl font-bold">Manage Airlines</h2>
                <button
                  onClick={() => {
                    setShowAirlineForm(!showAirlineForm);
                    setEditingAirlineId(null);
                    setAirlineFormData({ name: "", logo_url: "" });
                    setAirlineLogoFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="bg-[#cd7e0f] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition"
                >
                  {showAirlineForm ? "Cancel" : "Add Airline"}
                </button>
              </div>

              {/* Add/Edit Form */}
              {showAirlineForm && (
                <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
                  <h2 className="text-2xl font-bold text-[#4f1032] mb-6">
                    {editingAirlineId ? "Edit Airline" : "Add New Airline"}
                  </h2>
                  
                  <form onSubmit={handleSubmitAirline} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Airline Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter airline name"
                          value={airlineFormData.name}
                          onChange={e => setAirlineFormData({ ...airlineFormData, name: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Airline Logo
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                          onChange={e => {
                            setAirlineLogoFile(e.target.files?.[0] || null);
                            // Clear logo_url if file is selected
                            if (e.target.files?.[0]) setAirlineFormData(f => ({ ...f, logo_url: "" }));
                          }}
                        />
                        <p className="text-sm text-gray-500 mt-1">Upload an image for the airline logo, or paste a direct image URL below.</p>
                        <input
                          type="text"
                          placeholder="Paste logo image URL (optional)"
                          value={airlineFormData.logo_url}
                          onChange={e => setAirlineFormData({ ...airlineFormData, logo_url: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900"
                          disabled={!!airlineLogoFile}
                        />
                      </div>
                    </div>

                    {airlineError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {airlineError}
                      </div>
                    )}

                    {airlineSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                        {airlineSuccess}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="bg-[#cd7e0f] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition disabled:opacity-50"
                        disabled={airlineUploading}
                      >
                        {airlineUploading ? "Processing..." : (editingAirlineId ? "Update Airline" : "Add Airline")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAirlineForm(false);
                          setEditingAirlineId(null);
                          setAirlineFormData({ name: "", logo_url: "" });
                          setAirlineLogoFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Airlines List */}
              <div className="bg-white rounded-lg shadow-xl p-8">
                <h2 className="text-2xl font-bold text-[#4f1032] mb-6">All Airlines</h2>
                
                {airlines.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-600">No airlines found. Add your first airline to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {airlines.map((airline) => (
                      <div key={airline.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {airline.logo_url ? (
                              <img src={airline.logo_url} alt={airline.name} className="w-12 h-12 object-contain rounded" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                            )}
                            <h3 className="font-semibold text-lg">{airline.name}</h3>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditAirline(airline)}
                            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAirline(airline.id)}
                            className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedPage === 'bankDetails' && (
            <div className="p-8">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 text-blue-600">🏦</div>
                      <h1 className="text-2xl font-bold text-gray-900">Bank Details Management</h1>
                    </div>
                    <p className="text-gray-600 mt-2">
                      Configure bank account details that will be shown to customers when they select bank transfer payment option.
                    </p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Error/Success Messages */}
                    {bankDetailsError && (
                      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <span>⚠️</span>
                        <span>{bankDetailsError}</span>
                      </div>
                    )}

                    {bankDetailsMessage && (
                      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        <span>✅</span>
                        <span>{bankDetailsMessage}</span>
                      </div>
                    )}

                    {/* Bank Details Text Area */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Account Details
                      </label>
                      <p className="text-sm text-gray-500 mb-4">
                        Enter the complete bank details exactly as you want customers to see them. Include all necessary information such as bank name, account name, account number, routing number, etc.
                      </p>
                      <textarea
                        value={bankDetails}
                        onChange={(e) => {
                          setBankDetails(e.target.value);
                          setBankDetailsMessage('');
                          setBankDetailsError('');
                        }}
                        placeholder="Bank Name: First National Bank&#10;Account Name: Mazo Airways Inc.&#10;Account Number: 1234567890&#10;Routing Number: 021000021&#10;&#10;Additional Instructions:&#10;Please include your booking ID in the transfer description"
                        rows={12}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        This text will be displayed exactly as entered to customers choosing bank transfer payment.
                      </p>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Customer Preview:</h3>
                      <div className="bg-white border border-gray-200 rounded p-4 text-sm font-mono whitespace-pre-line min-h-[120px]">
                        {bankDetails || "No bank details configured yet..."}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <button
                        onClick={handleSaveBankDetails}
                        disabled={bankDetailsSaving || !bankDetails.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span>💾</span>
                        {bankDetailsSaving ? 'Saving...' : 'Save Bank Details'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Payment Details Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl relative overflow-y-auto max-h-[90vh]">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              onClick={() => {
                setShowPaymentModal(false);
                setShowTicket(false);
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-[#4f1032] mb-4">Payment Details</h2>
            
            {/* Payment Info Section */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Payment ID:</span>
                <span className="text-gray-900">{selectedPayment.id || selectedPayment.payment_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Booking ID:</span>
                <span className="text-gray-900">{selectedPayment.booking_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Amount:</span>
                <span className="text-gray-900">${Number(selectedPayment.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Wallet:</span>
                <span className="text-gray-900">{selectedPayment.wallet_name || selectedPayment.wallet_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Status:</span>
                <span className={`${
                  selectedPayment.status === 'approved' ? 'text-green-600' : 
                  selectedPayment.status === 'rejected' ? 'text-red-600' : 
                  'text-yellow-600'
                } font-medium`}>
                  {selectedPayment.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Created At:</span>
                <span className="text-gray-900">{selectedPayment.created_at || '-'}</span>
              </div>
            </div>

            {/* Payment Proof Section */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Proof of Payment:</h3>
              {selectedPayment.proof_url ? (
                <div className="border rounded-lg p-2">
                  <img 
                    src={selectedPayment.proof_url} 
                    alt="Payment Proof" 
                    className="w-full h-auto max-h-80 object-contain rounded"
                  />
                  <div className="mt-2 flex justify-end">
                    <a 
                      href={selectedPayment.proof_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#cd7e0f] text-sm hover:underline"
                    >
                      Open in new tab
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border rounded-lg p-4 text-center text-gray-500">
                  No payment proof uploaded
                </div>
              )}
            </div>

            {/* Action Feedback Messages */}
            {paymentActionError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-2">{paymentActionError}</div>}
            {paymentActionSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded mb-2">{paymentActionSuccess}</div>}

            {/* Ticket Section (Only shows after approval) */}
            {showTicket && ticketDetails && (
              <div className="mt-4 mb-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold text-green-700">Booking Approved Successfully!</span>
                  </div>
                  <p className="text-green-600">The flight ticket is now ready for download.</p>
                </div>
                
                <div ref={ticketRef} id="ticket" className="border rounded-lg p-4 mb-4 bg-white">
                  <h3 className="text-lg font-bold mb-2 text-[#4f1032]">Flight Ticket</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Passenger</p>
                      <p className="font-medium">{ticketDetails.passenger_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Flight</p>
                      <p className="font-medium">{ticketDetails.flight?.flight_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="font-medium">{ticketDetails.flight?.departure?.city || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">To</p>
                      <p className="font-medium">{ticketDetails.flight?.arrival?.city || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{ticketDetails.flight?.date || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">{ticketDetails.flight?.time || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium">
                        {ticketDetails.flight?.price 
                          ? `${ticketDetails.flight.price} ${ticketDetails.flight.currency || 'USD'}`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium text-green-600">{ticketDetails.status || 'Confirmed'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Booking ID</p>
                      <p className="font-medium">{ticketDetails.id}</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => downloadTicket(ticketRef)}
                  className="w-full bg-[#4f1032] text-white py-2 rounded-lg font-semibold hover:bg-[#4f1032]/90 transition mb-4"
                >
                  Download Ticket
                </button>
              </div>
            )}

            {/* Action Buttons (hide after approval if ticket is showing) */}
            {(!showTicket || !ticketDetails) && (
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  className="flex-1 bg-[#cd7e0f] text-white py-2 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={paymentActionLoading || selectedPayment.status === 'approved'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const paymentId = selectedPayment.id || selectedPayment.payment_id;
                    if (paymentId) handleApprovePayment(paymentId);
                    else alert("Cannot find payment ID!");
                  }}
                >
                  {paymentActionLoading ? 'Approving...' : 
                   selectedPayment.status === 'approved' ? 'Approved' : 'Approve'}
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={paymentActionLoading || selectedPayment.status === 'rejected'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const paymentId = selectedPayment.id || selectedPayment.payment_id;
                    if (paymentId) handleRejectPayment(paymentId);
                    else alert("Cannot find payment ID!");
                  }}
                >
                  {paymentActionLoading ? 'Rejecting...' : 
                   selectedPayment.status === 'rejected' ? 'Rejected' : 'Reject'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manage Locations Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative flex flex-col">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-[#cd7e0f] text-3xl font-bold focus:outline-none"
              onClick={() => { setShowLocationModal(false); setEditLocation(null); setLocationForm({ city: '', country: '', error: '', success: '', submitting: false }); }}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-[#4f1032] mb-6 text-center">{editLocation ? 'Edit Location' : 'Add Location'}</h2>
            <form onSubmit={handleLocationSubmit} className="space-y-5 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input type="text" name="city" value={locationForm.city} onChange={handleLocationFormChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <input type="text" name="country" value={locationForm.country} onChange={handleLocationFormChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" required />
              </div>
              {locationForm.error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">{locationForm.error}</div>}
              {locationForm.success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg">{locationForm.success}</div>}
              <div className="flex gap-4 pt-2">
                <button type="submit" className="flex-1 bg-[#cd7e0f] text-white py-3 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={locationForm.submitting}>
                  {locationForm.submitting ? (editLocation ? 'Updating...' : 'Adding...') : (editLocation ? 'Update Location' : 'Add Location')}
                </button>
                <button type="button" className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition" onClick={() => { setShowLocationModal(false); setEditLocation(null); setLocationForm({ city: '', country: '', error: '', success: '', submitting: false }); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crypto Wallets Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative flex flex-col">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-[#cd7e0f] text-3xl font-bold focus:outline-none"
              onClick={() => setShowWalletModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-[#4f1032] mb-6 text-center">Add Crypto Wallet</h2>
            <form onSubmit={handleAddWallet} className="space-y-5 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Wallet Name</label>
                  <input type="text" value={newWallet.name} onChange={e => setNewWallet({ ...newWallet, name: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Wallet Address</label>
                  <input type="text" value={newWallet.address} onChange={e => setNewWallet({ ...newWallet, address: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Network</label>
                  <input type="text" value={newWallet.network} onChange={e => setNewWallet({ ...newWallet, network: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">QR Code</label>
                  <input type="file" accept="image/*" onChange={e => setQrFile(e.target.files?.[0] || null)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition" required />
                </div>
              </div>
              {walletError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">{walletError}</div>}
              {walletSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg">{walletSuccess}</div>}
              <div className="flex gap-4 pt-2">
                <button type="submit" className="flex-1 bg-[#cd7e0f] text-white py-3 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={walletLoading}>
                  {walletLoading ? 'Adding...' : 'Add Wallet'}
                </button>
                <button type="button" className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition" onClick={() => setShowWalletModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
            <h3 className="font-semibold text-lg mb-4 text-[#4f1032]">Existing Wallets</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cryptoWallets.length === 0 ? (
                <div className="text-gray-500">No wallets added yet.</div>
              ) : (
                cryptoWallets.map(wallet => (
                  <div key={wallet.id} className="border rounded-lg p-3 flex flex-col bg-gray-50">
                    <span className="font-bold text-[#4f1032]">{wallet.name}</span>
                    <span className="text-xs text-gray-600">Network: {wallet.network}</span>
                    <span className="text-xs text-gray-600 break-all">Address: {wallet.address || wallet.wallet_address}</span>
                    {wallet.qr_code_url && (
                      <img src={wallet.qr_code_url} alt="QR Code" className="w-16 h-16 object-contain mt-1" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Flight Details Modal */}
      {showFlightModal && selectedFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowFlightModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-[#4f1032] mb-4">Flight Details</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Flight Number:</span>
                <span className="text-gray-900">{selectedFlight.flight_number || selectedFlight.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Airline:</span>
                <div className="flex items-center gap-2">
                  {airlines.find(a => a.id === selectedFlight.airline_id)?.logo_url ? (
                    <img 
                      src={airlines.find(a => a.id === selectedFlight.airline_id)?.logo_url} 
                      alt="Airline logo" 
                      className="h-6 w-6 object-contain"
                    />
                  ) : null}
                  <span className="text-gray-900">{airlines.find(a => a.id === selectedFlight.airline_id)?.name || selectedFlight.airline_name || selectedFlight.airline_id}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Departure:</span>
                <span className="text-gray-900">{selectedFlight.departure_country || (selectedFlight.departure_location?.city ? `${selectedFlight.departure_location.city}, ${selectedFlight.departure_location.country}` : '-')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Arrival:</span>
                <span className="text-gray-900">{selectedFlight.arrival_country || (selectedFlight.arrival_location?.city ? `${selectedFlight.arrival_location.city}, ${selectedFlight.arrival_location.country}` : '-')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Date:</span>
                <span className="text-gray-900">{selectedFlight.date || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Time:</span>
                <span className="text-gray-900">{selectedFlight.time || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Price:</span>
                <span className="text-gray-900">{formatPrice(selectedFlight.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Status:</span>
                <span className="text-gray-900">{selectedFlight.status || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Tracking Number:</span>
                <span className="text-gray-900">{selectedFlight.tracking_number || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Passenger Name:</span>
                <span className="text-gray-900">{selectedFlight.passenger_name || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flight Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Flight Deletion</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this flight? This action cannot be undone.
            </p>
            
            {deleteFlightError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {deleteFlightError}
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                onClick={confirmDeleteFlight}
                disabled={deleteFlightLoading}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleteFlightLoading ? 'Deleting...' : 'Delete Flight'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setFlightToDelete(null);
                  setDeleteFlightError('');
                }}
                disabled={deleteFlightLoading}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Configuration Panel */}
      {showPaymentConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#18176b]">
                  Configure {selectedGateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'} API Keys
                </h2>
                <button
                  onClick={closePaymentConfig}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {paymentConfigLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#18176b] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading configuration...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Error/Success Messages */}
                  {paymentConfigError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">{paymentConfigError}</p>
                    </div>
                  )}
                  
                  {paymentConfigSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800">{paymentConfigSuccess}</p>
                    </div>
                  )}

                  {selectedGateway === 'flutterwave' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Test Environment */}
                      <div className="space-y-4">
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                          <h3 className="text-lg font-semibold text-blue-800">Test Environment</h3>
                          <p className="text-blue-600 text-sm">Use these keys for testing and development</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Test Public Key</label>
                            <input
                              type="text"
                              value={flutterwaveKeys.test_public}
                              onChange={(e) => setFlutterwaveKeys(prev => ({ ...prev, test_public: e.target.value }))}
                              placeholder="FLWPUBK_TEST-..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Test Secret Key</label>
                            <input
                              type="password"
                              value={flutterwaveKeys.test_secret}
                              onChange={(e) => setFlutterwaveKeys(prev => ({ ...prev, test_secret: e.target.value }))}
                              placeholder="FLWSECK_TEST-..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Test Encryption Key</label>
                            <input
                              type="password"
                              value={flutterwaveKeys.test_encryption}
                              onChange={(e) => setFlutterwaveKeys(prev => ({ ...prev, test_encryption: e.target.value }))}
                              placeholder="FLWSECK_TEST..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Live Environment */}
                      <div className="space-y-4">
                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                          <h3 className="text-lg font-semibold text-green-800">Live Environment</h3>
                          <p className="text-green-600 text-sm">Use these keys for production payments</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Live Public Key</label>
                            <input
                              type="text"
                              value={flutterwaveKeys.live_public}
                              onChange={(e) => setFlutterwaveKeys(prev => ({ ...prev, live_public: e.target.value }))}
                              placeholder="FLWPUBK-..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Live Secret Key</label>
                            <input
                              type="password"
                              value={flutterwaveKeys.live_secret}
                              onChange={(e) => setFlutterwaveKeys(prev => ({ ...prev, live_secret: e.target.value }))}
                              placeholder="FLWSECK-..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Live Encryption Key</label>
                            <input
                              type="password"
                              value={flutterwaveKeys.live_encryption}
                              onChange={(e) => setFlutterwaveKeys(prev => ({ ...prev, live_encryption: e.target.value }))}
                              placeholder="FLWSECK..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedGateway === 'paystack' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Test Environment */}
                      <div className="space-y-4">
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                          <h3 className="text-lg font-semibold text-blue-800">Test Environment</h3>
                          <p className="text-blue-600 text-sm">Use these keys for testing and development</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Test Public Key</label>
                            <input
                              type="text"
                              value={paystackKeys.test_public}
                              onChange={(e) => setPaystackKeys(prev => ({ ...prev, test_public: e.target.value }))}
                              placeholder="pk_test_..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Test Secret Key</label>
                            <input
                              type="password"
                              value={paystackKeys.test_secret}
                              onChange={(e) => setPaystackKeys(prev => ({ ...prev, test_secret: e.target.value }))}
                              placeholder="sk_test_..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Live Environment */}
                      <div className="space-y-4">
                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                          <h3 className="text-lg font-semibold text-green-800">Live Environment</h3>
                          <p className="text-green-600 text-sm">Use these keys for production payments</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Live Public Key</label>
                            <input
                              type="text"
                              value={paystackKeys.live_public}
                              onChange={(e) => setPaystackKeys(prev => ({ ...prev, live_public: e.target.value }))}
                              placeholder="pk_live_..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Live Secret Key</label>
                            <input
                              type="password"
                              value={paystackKeys.live_secret}
                              onChange={(e) => setPaystackKeys(prev => ({ ...prev, live_secret: e.target.value }))}
                              placeholder="sk_live_..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex justify-end pt-6 border-t border-gray-200">
                    <div className="flex gap-3">
                      <button
                        onClick={closePaymentConfig}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={savePaymentGatewayKeys}
                        disabled={paymentConfigLoading}
                        className="px-6 py-2 bg-[#18176b] text-white rounded-lg hover:bg-[#18176b]/90 transition disabled:bg-gray-400"
                      >
                        {paymentConfigLoading ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this flight? This action cannot be undone.
            </p>
            {deleteFlightError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm">{deleteFlightError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={confirmDeleteFlight}
                disabled={deleteFlightLoading}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400"
              >
                {deleteFlightLoading ? 'Deleting...' : 'Delete Flight'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setFlightToDelete(null);
                  setDeleteFlightError('');
                }}
                disabled={deleteFlightLoading}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
