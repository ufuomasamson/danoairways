export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#18176b] to-[#18176b]/90 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Dano Airways</h1>
          <p className="text-xl">Your trusted partner in air travel, making journeys memorable and seamless</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Company Overview */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#18176b] mb-6">Your Journey, Our Passion</h2>
              <p className="text-lg text-gray-700 mb-4">
                Dano Airways is a leading online travel platform dedicated to making air travel simple, 
                transparent, and accessible for everyone. Founded with a vision to revolutionize the 
                way people book and manage their flights, we've been serving travelers worldwide since 2020.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Our mission is to provide a seamless experience for searching, booking, and tracking flights, 
                while ensuring your journey is smooth from start to finish. We believe in empowering travelers 
                with real-time information, secure payment processing, and easy access to all your travel needs.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-[#cd7e0f]">5,830+</div>
                  <div className="text-gray-600 text-sm">Happy Customers</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-[#cd7e0f]">100%</div>
                  <div className="text-gray-600 text-sm">Satisfaction Rate</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-[#cd7e0f]">24/7</div>
                  <div className="text-gray-600 text-sm">Support</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#18176b] to-[#cd7e0f] p-8 rounded-xl text-white shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Why Choose Dano Airways?</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#cd7e0f] rounded-full"></div>
                  </div>
                  <span>Best Price Guarantee</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#cd7e0f] rounded-full"></div>
                  </div>
                  <span>Instant Booking Confirmation</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#cd7e0f] rounded-full"></div>
                  </div>
                  <span>Real-time Flight Tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#cd7e0f] rounded-full"></div>
                  </div>
                  <span>Secure Payment Processing</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#cd7e0f] rounded-full"></div>
                  </div>
                  <span>24/7 Customer Support</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#cd7e0f] rounded-full"></div>
                  </div>
                  <span>Multiple Payment Options</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="text-[#cd7e0f] text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-[#18176b] mb-4">Our Mission</h3>
              <p className="text-gray-700">
                To provide innovative, reliable, and user-friendly flight booking solutions that empower 
                travelers to explore the world with confidence. We strive to make every journey memorable 
                by offering exceptional service, competitive prices, and cutting-edge technology.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="text-[#cd7e0f] text-4xl mb-4">🌟</div>
              <h3 className="text-2xl font-bold text-[#18176b] mb-4">Our Vision</h3>
              <p className="text-gray-700">
                To become the world's most trusted and preferred online travel platform, known for 
                exceptional customer experience, technological innovation, and commitment to making 
                travel accessible to everyone, everywhere.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-[#18176b] mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#18176b] to-[#cd7e0f] rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-white text-2xl">🤝</div>
              </div>
              <h3 className="text-xl font-bold text-[#18176b] mb-2">Trust & Transparency</h3>
              <p className="text-gray-700">We build trust through honest communication and transparent business practices.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#18176b] to-[#cd7e0f] rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-white text-2xl">�</div>
              </div>
              <h3 className="text-xl font-bold text-[#18176b] mb-2">Innovation</h3>
              <p className="text-gray-700">We constantly innovate to improve our services and exceed customer expectations.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#18176b] to-[#cd7e0f] rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-white text-2xl">❤️</div>
              </div>
              <h3 className="text-xl font-bold text-[#18176b] mb-2">Customer First</h3>
              <p className="text-gray-700">Every decision we make is centered around providing the best possible experience for our customers.</p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-[#18176b] mb-12">Our Leadership Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-[#18176b] to-[#cd7e0f] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-white">👨‍💼</span>
              </div>
              <h3 className="text-xl font-bold text-[#18176b] mb-2">John Smith</h3>
              <p className="text-[#cd7e0f] font-semibold mb-2">CEO & Founder</p>
              <p className="text-gray-600 text-sm">15+ years in travel industry</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-[#18176b] to-[#cd7e0f] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-white">👩‍💼</span>
              </div>
              <h3 className="text-xl font-bold text-[#18176b] mb-2">Sarah Johnson</h3>
              <p className="text-[#cd7e0f] font-semibold mb-2">CTO</p>
              <p className="text-gray-600 text-sm">Technology & Innovation expert</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-[#18176b] to-[#cd7e0f] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-white">👨‍💻</span>
              </div>
              <h3 className="text-xl font-bold text-[#18176b] mb-2">Mike Davis</h3>
              <p className="text-[#cd7e0f] font-semibold mb-2">Head of Operations</p>
              <p className="text-gray-600 text-sm">Customer experience specialist</p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-gradient-to-r from-[#18176b] to-[#18176b]/90 text-white p-8 rounded-xl text-center shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="mb-6">Join thousands of satisfied customers who trust Dano Airways for their travel needs.</p>
          <div className="flex gap-4 justify-center">
            <a href="/search" className="bg-[#cd7e0f] text-white px-6 py-3 rounded-lg hover:bg-[#cd7e0f]/90 transition-colors duration-300">
              Search Flights
            </a>
            <a href="/contact" className="border border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-[#18176b] transition-all duration-300">
              Contact Us
            </a>
          </div>
        </section>
      </div>
    </div>
  );
} 