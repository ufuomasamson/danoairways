"use client";
import { useState, useEffect } from "react";
// ...existing code...
import jsPDF from "jspdf";
import Image from "next/image";
import PaymentMethodModal from "@/components/PaymentMethodModal";
import InlinePaymentModal from "@/components/InlinePaymentModal";

import { useCurrencyStore } from "@/lib/currencyManager";

export default function HomePage() {
  const [trackingNumber] = useState("");
  const [flight, setFlight] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInlinePaymentModal, setShowInlinePaymentModal] = useState(false);
  const [selectedFlightForPayment, setSelectedFlightForPayment] = useState<any>(null);
  const { formatPrice } = useCurrencyStore();

  const [flights, setFlights] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [airlines, setAirlines] = useState<any[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Payment handling functions
  const handlePaymentMethodSelect = async (method: string, gateway?: string) => {
    setShowPaymentModal(false);
    setPayLoading(true);
    setError("");

    try {
      // Get user from cookie
      const userCookie = document.cookie.split('; ').find(row => row.startsWith('user='));
      let userObj = null;
      if (userCookie) {
        userObj = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
        // Set user email for payment processing
        setUserEmail(userObj.email || '');
      }

      if (!userObj || !userObj.id) {
        setError("User information not found. Please log in again.");
        setPayLoading(false);
        return;
      }

      if (method === 'crypto') {
        // Handle crypto payment (existing flow)
        // This will show the crypto wallet selection and proof upload
        setError("Crypto payment functionality will be shown here. Please use card payment for now.");
        setPayLoading(false);
        return;
      }

      if (method === 'card' && gateway) {
        // Get current selected currency from store
        const { currency, getAmount } = useCurrencyStore.getState();
        
        if (gateway === 'flutterwave') {
          // Use Flutterwave payment with selected currency
          const amountInSelectedCurrency = getAmount(flight.price, currency);
          
          const response = await fetch('/api/payment/initiate-v2', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bookingId: booking.id,
              userId: userObj.id,
              amount: amountInSelectedCurrency,
              currency: currency
            }),
          });

          const result = await response.json();
          
          if (result.success && result.data) {
            // Redirect to Flutterwave payment page
            window.location.href = result.data.payment_url;
          } else {
            setError(result.error || 'Failed to initiate Flutterwave payment');
          }
        } else if (gateway === 'paystack') {
          // Use inline payment modal instead of redirect
          setSelectedFlightForPayment(flight);
          setShowInlinePaymentModal(true);
        }
      }
    } catch (err: any) {
      setError(`Payment initialization failed: ${err.message}`);
    } finally {
      setPayLoading(false);
    }
  };

  // Handle inline payment success
  const handlePaymentSuccess = (reference: string) => {
    console.log('Payment successful with reference:', reference);
    setError('Payment completed successfully! Your booking is confirmed.');
    setShowInlinePaymentModal(false);
    setSelectedFlightForPayment(null);
    // Optionally refresh booking data
  };

  // Handle inline payment error
  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    setError(`Payment failed: ${error}`);
    setShowInlinePaymentModal(false);
    setSelectedFlightForPayment(null);
  };

  useEffect(() => {
    async function fetchAll() {
      try {
        const [flightsRes, locationsRes, airlinesRes] = await Promise.all([
          fetch("/api/flights"),
          fetch("/api/locations"),
          fetch("/api/airlines"),
        ]);
        const flightsData = await flightsRes.json();
        const locationsData = await locationsRes.json();
        const airlinesData = await airlinesRes.json();
        setFlights(flightsData);
        setLocations(locationsData);
        setAirlines(airlinesData);
      } catch (err) {
        console.error("API fetch error:", err);
      }
    }
    fetchAll();
  }, []);

  // Autocomplete logic for FROM
  useEffect(() => {
    if (from.length < 3) {
      setFromSuggestions([]);
      return;
    }
    const match = locations.filter(loc =>
      loc.city.toLowerCase().includes(from.toLowerCase()) ||
      loc.country.toLowerCase().includes(from.toLowerCase())
    );
    setFromSuggestions(match);
  }, [from, locations]);

  // Autocomplete logic for TO
  useEffect(() => {
    if (to.length < 3) {
      setToSuggestions([]);
      return;
    }
    const match = locations.filter(loc =>
      loc.city.toLowerCase().includes(to.toLowerCase()) ||
      loc.country.toLowerCase().includes(to.toLowerCase())
    );
    setToSuggestions(match);
  }, [to, locations]);

  // Search flights
  const handleSearchFlights = () => {
    setSearchLoading(true);
    setSearchResults([]);
    setTimeout(() => {
      const fromValue = from.trim().toLowerCase();
      const toValue = to.trim().toLowerCase();
      console.log('Flights:', flights);
      console.log('Search FROM:', fromValue, 'TO:', toValue);
      const filtered = flights.filter(flight => {
        const depLoc = locations.find(loc => loc.id === flight.departure_location_id);
        const arrLoc = locations.find(loc => loc.id === flight.arrival_location_id);
        const depCity = depLoc?.city?.toLowerCase() || "";
        const depCountry = depLoc?.country?.toLowerCase() || "";
        const arrCity = arrLoc?.city?.toLowerCase() || "";
        const arrCountry = arrLoc?.country?.toLowerCase() || "";
        const depMatch = fromValue ? (depCity.includes(fromValue) || depCountry.includes(fromValue)) : true;
        const arrMatch = toValue ? (arrCity.includes(toValue) || arrCountry.includes(toValue)) : true;
        return depMatch && arrMatch;
      }).map(flight => {
        // Attach location objects for display
        return {
          ...flight,
          departure: locations.find(loc => loc.id === flight.departure_location_id),
          arrival: locations.find(loc => loc.id === flight.arrival_location_id)
        };
      });
      console.log('Filtered Results:', filtered);
      setSearchResults(filtered);
      setSearchLoading(false);
    }, 800); // Simulate loading
  };

  // Note: handleTrack function is defined but not used in the current UI
  // It's kept for future implementation

  const handleMarkAsPaidAndGenerateTicket = async () => {
    if (!booking || !flight) return;
    // TODO: Mark booking as paid in MySQL
    // TODO: Generate PDF ticket and upload to your own storage solution
    // TODO: Save ticket URL in MySQL
    // TODO: Refresh booking from MySQL
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex flex-col lg:flex-row items-center justify-center px-2 sm:px-4 md:px-8 overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full z-0">
          {/* Mobile Video - Hidden on desktop */}
          <video
            className="block md:hidden w-full h-full object-cover"
            src="/images/mobile_bg.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              zIndex: -1
            }}
          />
          {/* Desktop Video - Hidden on mobile */}
          <video
            className="hidden md:block w-full h-full object-cover"
            src="/images/Backgound-video.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              zIndex: -1
            }}
          />
        </div>
        <div className="absolute inset-0 bg-blue-900/60 z-10"></div>
        <div className="relative z-20 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between h-full px-2 sm:px-4 md:px-8">
          {/* Centered Hero Text */}
          <div className="w-full flex flex-col justify-center items-center py-8 sm:py-12 lg:py-20 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-white">A Lifetime Of Discounts? It's Genius.</h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 max-w-xl text-white">Get rewarded for your travels unlock savings of 10% or more with free Dano Airways account.</p>
          </div>
        </div>
      </section>

      {/* Floating Flight Booking Form */}
      <section className="relative -mt-12 sm:-mt-16 lg:-mt-20 z-30 mb-12 sm:mb-16 lg:mb-20 px-2 sm:px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-2xl p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#18176b] mb-2">DANO AIRWAYS</h2>
            </div>
            {/* Flight Booking Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">FROM</label>
                <input type="text" value={from} onChange={e => setFrom(e.target.value)} placeholder="Departure City" className="w-full p-3 border rounded text-gray-900" autoComplete="off" />
                {fromSuggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 bg-white border rounded shadow z-10 mt-1 max-h-40 overflow-y-auto">
                    {fromSuggestions.map(loc => (
                      <li key={loc.id} className="px-3 py-2 cursor-pointer hover:bg-gray-100" onClick={() => { setFrom(loc.city); setFromSuggestions([]); }}>{loc.city}, {loc.country}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">TO</label>
                <input type="text" value={to} onChange={e => setTo(e.target.value)} placeholder="Arrival City" className="w-full p-3 border rounded text-gray-900" autoComplete="off" />
                {toSuggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 bg-white border rounded shadow z-10 mt-1 max-h-40 overflow-y-auto">
                    {toSuggestions.map(loc => (
                      <li key={loc.id} className="px-3 py-2 cursor-pointer hover:bg-gray-100" onClick={() => { setTo(loc.city); setToSuggestions([]); }}>{loc.city}, {loc.country}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Depart</label>
                <input type="date" className="w-full p-3 border rounded text-gray-900" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trip</label>
                <select className="w-full p-3 border rounded text-gray-900">
                  <option>One-way</option>
                  <option>Round-Trip</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tour type</label>
                <select className="w-full p-3 border rounded text-gray-900">
                  <option>Economy</option>
                  <option>Business</option>
                  <option>First Class</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passenger/ Class</label>
                <select className="w-full p-3 border rounded text-gray-900">
                  <option>1 Passenger, Economy</option>
                  <option>2 Passengers, Economy</option>
                  <option>1 Passenger, Business</option>
                </select>
              </div>
            </div>
            <button className="w-full bg-[#cd7e0f] text-white py-3 sm:py-4 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition text-sm sm:text-lg" onClick={handleSearchFlights}>
              {searchLoading ? "Searching For Flight..." : "Search Flights"}
            </button>
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4 text-[#18176b]">Available Flights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map(flight => (
              <div key={flight.id} className="bg-gray-50 rounded-lg shadow p-6">
                <div className="font-bold text-xl mb-2">{flight.airline?.name || "Airline"}</div>
                <div className="mb-1">Flight No: <span className="font-mono">{flight.flight_number}</span></div>
                <div className="mb-1">From: {flight.departure?.city}, {flight.departure?.country}</div>
                <div className="mb-1">To: {flight.arrival?.city}, {flight.arrival?.country}</div>
                <div className="mb-1">Date: {flight.date} | Time: {flight.time}</div>
                <div className="mb-2 font-semibold text-[#cd7e0f]">{formatPrice(flight.price)}</div>
                <button className="bg-[#cd7e0f] text-white px-4 py-2 rounded hover:bg-[#cd7e0f]/90 mt-2" onClick={() => setFlight(flight)}>Book Now</button>
              </div>
            ))}
          </div>
        </div>
      )}
          </div>
        </div>
      </section>

      {/* Quick Services */}
      <section className="py-8 sm:py-12 bg-white px-2 sm:px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-lg font-semibold text-[#18176b] mb-2">International Flight</h3>
              <p className="text-gray-600">Call FlyGlobe Inc via +447587623610 for booking assistance</p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-lg font-semibold text-[#18176b] mb-2">Check Refund</h3>
              <p className="text-gray-600">Contact contact@flyglobe.online for check refund status</p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-lg font-semibold text-[#18176b] mb-2">Offer Deals</h3>
              <p className="text-gray-600">FlyGlobe Inc Offer Deals Best Price Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Offer Deals */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#18176b] mb-6 sm:mb-8">Offer Deals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: New York */}
            <div className="bg-white rounded-lg shadow flex flex-col overflow-hidden">
              <div className="h-36 w-full bg-gray-200">
                <img src="/images/new-york.jpeg" alt="New York" className="w-full h-full object-cover object-center rounded-t-lg" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-end">
                <h3 className="font-semibold text-[#18176b] mb-2">New York to California</h3>
                <p className="text-gray-600 mb-2">09 Jun 2022 - 16 Jun 2022</p>
                <p className="text-gray-600 mb-2">Economy from</p>
                <p className="text-2xl font-bold text-[#cd7e0f]">{formatPrice(290)}</p>
              </div>
            </div>
            {/* Card 2: Paris */}
            <div className="bg-white rounded-lg shadow flex flex-col overflow-hidden">
              <div className="h-36 w-full bg-gray-200">
                <img src="/images/paris.jpeg" alt="Paris" className="w-full h-full object-cover object-center rounded-t-lg" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-end">
                <h3 className="font-semibold text-[#18176b] mb-2">Paris to London</h3>
                <p className="text-gray-600 mb-2">09 Jun 2022 - 16 Jun 2022</p>
                <p className="text-gray-600 mb-2">Economy from</p>
                <p className="text-2xl font-bold text-[#cd7e0f]">{formatPrice(420)}</p>
              </div>
            </div>
            {/* Card 3: Tokyo */}
            <div className="bg-white rounded-lg shadow flex flex-col overflow-hidden">
              <div className="h-36 w-full bg-gray-200">
                <img src="/images/tokyo.jpeg" alt="Tokyo" className="w-full h-full object-cover object-center rounded-t-lg" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-end">
                <h3 className="font-semibold text-[#18176b] mb-2">Tokyo to Seoul</h3>
                <p className="text-gray-600 mb-2">09 Jun 2022 - 16 Jun 2022</p>
                <p className="text-gray-600 mb-2">Economy from</p>
                <p className="text-2xl font-bold text-[#cd7e0f]">{formatPrice(350)}</p>
              </div>
            </div>
            {/* Card 4: Dubai to Maldives */}
            <div className="bg-white rounded-lg shadow flex flex-col overflow-hidden">
              <div className="h-36 w-full bg-gray-200">
                <img src="/images/dubai-city.jpeg" alt="Maldives" className="w-full h-full object-cover object-center rounded-t-lg" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-end">
                <h3 className="font-semibold text-[#18176b] mb-2">Dubai to Maldives</h3>
                <p className="text-gray-600 mb-2">09 Jun 2022 - 16 Jun 2022</p>
                <p className="text-gray-600 mb-2">Economy from</p>
                <p className="text-2xl font-bold text-[#cd7e0f]">{formatPrice(980)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Great Destination Section */}
      <section
        className="relative bg-cover bg-center"
        style={{ backgroundImage: "url('/images/great.jpeg')" }}
      >
        <div
          className="absolute inset-0 bg-[#18176b]"
          style={{
            maskImage: 'linear-gradient(to right, black 60%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 60%, transparent 100%)',
          }}
        ></div>
        <div className="relative grid grid-cols-1 md:grid-cols-2">
          <div className="p-8 md:p-12 text-white flex flex-col justify-center">
            <h2 className="text-4xl font-bold mb-6">Your Great Destination</h2>
            <p className="text-lg mb-8">Get rewarded for your travels with Dano Inc  unlock instant savings of 10% or more with a free +447587623610 account</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="flex items-center gap-4">
                <svg className="w-10 h-10 text-[#d18a27]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.121-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.121-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M12 14a4 4 0 100-8 4 4 0 000 8z"></path></svg>
                <div>
                  <div className="text-3xl font-bold">5830+</div>
                  <div className="text-md">Happy Customers</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <svg className="w-10 h-10 text-[#d18a27]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.938 6.124a9 9 0 1111.125 0M12 21a9 9 0 110-18 9 9 0 010 18z"></path></svg>
                <div>
                  <div className="text-3xl font-bold">100%</div>
                  <div className="text-md">Client Satisfied</div>
                </div>
              </div>
            </div>
            <p className="mb-6">Discover the latest offers & news and start planning.</p>
            <a href="/contact" className="bg-[#d18a27] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#d18a27]/90 transition text-lg text-center w-full sm:w-auto">
              Contact Us
            </a>
          </div>
          <div></div>
        </div>
      </section>

      {/* Flynext Package Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold text-[#cd7e0f]">Flynext Package</h3>
            <h2 className="text-3xl font-bold text-[#18176b]">Your Great Destination</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <img src="/images/dubai-dxb.PNG" alt="Dubai" className="w-full h-48 object-cover"/>
              <div className="p-4">
                <p className="text-sm text-gray-500">09 Jun 2023 - 16 Jun 2023</p>
                <h4 className="font-bold text-lg text-[#18176b]">Dubai (DXB)</h4>
                <p className="text-gray-600">To</p>
                <h4 className="font-bold text-lg text-[#18176b]">New York (USA)</h4>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-gray-600">Economy from</p>
                  <p className="text-xl font-bold text-[#cd7e0f]">{formatPrice(195)}</p>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <img src="/images/switzerland-swl.PNG" alt="Switzerland" className="w-full h-48 object-cover"/>
              <div className="p-4">
                <p className="text-sm text-gray-500">09 Jun 2022 - 16 Jun 2022</p>
                <h4 className="font-bold text-lg text-[#18176b]">Switzerland (SWL)</h4>
                <p className="text-gray-600">To</p>
                <h4 className="font-bold text-lg text-[#18176b]">New York (USA)</h4>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-gray-600">Business Class</p>
                  <p className="text-xl font-bold text-[#cd7e0f]">{formatPrice(800)}</p>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <img src="/images/denmark-dek.PNG" alt="Denmark" className="w-full h-48 object-cover"/>
              <div className="p-4">
                <p className="text-sm text-gray-500">09 Jun 2024 - 16 Jun 2024</p>
                <h4 className="font-bold text-lg text-[#18176b]">Denmark (DEK)</h4>
                <p className="text-gray-600">To</p>
                <h4 className="font-bold text-lg text-[#18176b]">New York (USA)</h4>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-gray-600">Economy from</p>
                  <p className="text-xl font-bold text-[#cd7e0f]">{formatPrice(350)}</p>
                </div>
              </div>
            </div>
            {/* Card 4 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <img src="/images/jakarta-dxb.PNG" alt="Jakarta" className="w-full h-48 object-cover"/>
              <div className="p-4">
                <p className="text-sm text-gray-500">09 Jun 2025 - 16 Jun 2025</p>
                <h4 className="font-bold text-lg text-[#18176b]">Jakarta (DXB)</h4>
                <p className="text-gray-600">To</p>
                <h4 className="font-bold text-lg text-[#18176b]">Miami (USA)</h4>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-gray-600">Business Class</p>
                  <p className="text-xl font-bold text-[#cd7e0f]">{formatPrice(220)}</p>
                </div>
              </div>
            </div>
            {/* Card 5 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <img src="/images/turkish-swk.PNG" alt="Turkey" className="w-full h-48 object-cover"/>
              <div className="p-4">
                <p className="text-sm text-gray-500">09 Jun 2024 - 16 Jun 2024</p>
                <h4 className="font-bold text-lg text-[#18176b]">Turkey (TUR)</h4>
                <p className="text-gray-600">To</p>
                <h4 className="font-bold text-lg text-[#18176b]">California (USA)</h4>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-gray-600">Business Class</p>
                  <p className="text-xl font-bold text-[#cd7e0f]">{formatPrice(2430)}</p>
                </div>
              </div>
            </div>
            {/* Card 6 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <img src="/images/australia-stl.PNG" alt="Australia" className="w-full h-48 object-cover"/>
              <div className="p-4">
                <p className="text-sm text-gray-500">09 Jun 2024 - 16 Jun 2024</p>
                <h4 className="font-bold text-lg text-[#18176b]">Australia (AUS)</h4>
                <p className="text-gray-600">To</p>
                <h4 className="font-bold text-lg text-[#18176b]">Florida (USA)</h4>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-gray-600">Business Class</p>
                  <p className="text-xl font-bold text-[#cd7e0f]">{formatPrice(2220)}</p>
                </div>
              </div>
            </div>
            {/* Card 7 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <img src="/images/canada-cda.PNG" alt="Canada" className="w-full h-48 object-cover"/>
              <div className="p-4">
                <p className="text-sm text-gray-500">09 Jun 2024 - 16 Jun 2024</p>
                <h4 className="font-bold text-lg text-[#18176b]">Canada (CA)</h4>
                <p className="text-gray-600">To</p>
                <h4 className="font-bold text-lg text-[#18176b]">Florida (USA)</h4>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-gray-600">Business Class</p>
                  <p className="text-xl font-bold text-[#cd7e0f]">{formatPrice(820)}</p>
                </div>
              </div>
            </div>
            {/* Card 8 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <img src="/images/greece-gcc.PNG" alt="Greece" className="w-full h-48 object-cover"/>
              <div className="p-4">
                <p className="text-sm text-gray-500">09 Jun 2024 - 16 Jun 2024</p>
                <h4 className="font-bold text-lg text-[#18176b]">Greece (GR)</h4>
                <p className="text-gray-600">To</p>
                <h4 className="font-bold text-lg text-[#18176b]">Florida (USA)</h4>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-gray-600">Business Class</p>
                  <p className="text-xl font-bold text-[#cd7e0f]">{formatPrice(820)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News Update Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#18176b] mb-8">Latest News Update</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Main Story */}
            <div className="lg:col-span-2 rounded-lg overflow-hidden shadow-lg">
              <img src="/images/usa.jpeg" alt="Airplane wing in the sky" className="w-full h-64 object-cover"/>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-2">Emely Watson • February 19, 2022</p>
                <h3 className="text-2xl font-bold text-[#18176b] mb-4">The US is a Large Country and Climate Varies by Region</h3>
                <p className="text-gray-700">Discover the diverse climates of the United States, from the sunny beaches of California to the snowy mountains of Colorado. Plan your trip accordingly to make the most of your travels.</p>
              </div>
            </div>
            {/* Side Stories */}
            <div className="space-y-8">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img src="/images/happy.png" alt="Airplane flying over clouds" className="w-full h-40 object-cover"/>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Emely Watson • February 19, 2022</p>
                  <h3 className="font-semibold text-[#18176b]">Happy International Country Flight Attendant Day</h3>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img src="/images/bestlow.jpg" alt="View from airplane window" className="w-full h-40 object-cover"/>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Emely Watson • February 19, 2022</p>
                  <h3 className="font-semibold text-[#18176b]">But There are Dozen of Low-cost Airlines Including</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#18176b] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Explore</h3>
              <ul className="space-y-2">
                <li><a href="/about" className="hover:text-[#cd7e0f]">About us</a></li>
                <li><a href="/contact" className="hover:text-[#cd7e0f]">Contact Us</a></li>
                <li><a href="/login" className="hover:text-[#cd7e0f]">Login</a></li>
                <li><a href="/signup" className="hover:text-[#cd7e0f]">Signup</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-[#cd7e0f]">Privacy</a></li>
                <li><a href="#" className="hover:text-[#cd7e0f]">Terms and Conditions</a></li>
                <li><a href="#" className="hover:text-[#cd7e0f]">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacts</h3>
              <p className="mb-2">102 Woodland Ave, 92922 TX CA United States</p>
              <p className="mb-2">+447587623610</p>
              <p>contact@flyglobe.online</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
              <div className="flex">
                <input type="email" placeholder="Enter your email" className="flex-1 p-2 rounded-l text-gray-900" />
                <button className="bg-[#cd7e0f] px-4 py-2 rounded-r hover:bg-[#cd7e0f]/90">Subscribe</button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-600 mt-8 pt-8 text-center">
            <p>Copyright © 2022. All Rights Reserved By FlyGlobe Inc</p>
          </div>
        </div>
      </footer>

      {/* Flight Tracking Result */}
      {flight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-[#18176b]">Flight Details</h2>
            <div className="flex items-center gap-4 mb-4">
              {/* Airline logo lookup by airline_id */}
              {(() => {
                const airlineObj = airlines.find(a => a.id === flight.airline_id);
                if (airlineObj?.logo_url) {
                  return <img src={airlineObj.logo_url} alt={airlineObj.name} className="w-16 h-16 object-contain rounded" />;
                }
                return <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded">Logo</div>;
              })()}
              <div>
                <div className="font-semibold text-lg">{(() => {
                  const airlineObj = airlines.find(a => a.id === flight.airline_id);
                  return airlineObj?.name || "Airline";
                })()}</div>
                <div>Flight No: <span className="font-mono">{flight.flight_number}</span></div>
              </div>
            </div>
            <div className="mb-2">Route: {flight.departure?.city}, {flight.departure?.country} → {flight.arrival?.city}, {flight.arrival?.country}</div>
            <div className="mb-2">Date: {flight.date} | Time: {flight.time}</div>
            <div className="mb-4 font-semibold text-[#cd7e0f]">{formatPrice(flight.price)}</div>
            {/* Book This Flight button logic */}
            {booking ? (
              booking.paid ? (
                <a
                  href={booking.ticket_url || "#"}
                  className="bg-[#cd7e0f] text-white px-4 py-2 rounded hover:bg-[#cd7e0f]/90 inline-block"
                  download
                >
                  Download Ticket
                </a>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    className="bg-[#cd7e0f] text-white px-4 py-2 rounded hover:bg-[#cd7e0f]/90"
                    onClick={handleMarkAsPaidAndGenerateTicket}
                  >
                    Mark as Paid & Generate Ticket
                  </button>
                  <button
                    className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2 ${payLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={payLoading}
                    onClick={() => setShowPaymentModal(true)}
                  >
                    {payLoading ? "Processing..." : "Pay for Flight"}
                  </button>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  className="bg-[#cd7e0f] text-white px-4 py-2 rounded hover:bg-[#cd7e0f]/90"
                  onClick={async () => {
                    setError("");
                    // TODO: Replace with your own authentication logic
                    const userEmail = window.localStorage.getItem("user_email");
                    if (!userEmail) {
                      setError("You must sign up or log in before you can book this flight.");
                      return;
                    }
                    // Create booking in MySQL (should be done via API route)
                    try {
                      // Example: POST to /api/bookings with booking data
                      const response = await fetch("/api/bookings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          flight_id: flight.id,
                          passenger_name: userEmail,
                          paid: false,
                          created_at: new Date().toISOString(),
                        }),
                      });
                      const bookingData = await response.json();
                      if (!response.ok) {
                        setError("Failed to create booking. Please try again.");
                        return;
                      }
                      setBooking(bookingData);
                    } catch (err) {
                      setError("Failed to create booking. Please try again.");
                    }
                  }}
                >
                  Book This Flight
                </button>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <div className="text-gray-500">Login and book this flight to pay and download your ticket.</div>
              </div>
            )}
            <button 
              onClick={() => { setFlight(null); setBooking(null); setError(""); }} 
              className="mt-4 w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectPayment={handlePaymentMethodSelect}
        booking={booking}
        flight={flight}
        loading={payLoading}
      />

      {/* Inline Payment Modal */}
      <InlinePaymentModal
        isOpen={showInlinePaymentModal}
        onClose={() => setShowInlinePaymentModal(false)}
        paymentData={{
          bookingId: booking?.id || '',
          userId: booking?.user_id || '',
          email: userEmail, // Use actual user email
          amount: selectedFlightForPayment?.price || 0,
          currency: useCurrencyStore.getState().currency,
          flightNumber: selectedFlightForPayment?.flight_number || '',
          passengerName: booking?.passenger_name || ''
        }}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
}


