# 🛫 Dano Airways

A modern, full-stack flight booking application built with Next.js, Supabase, and Paystack, Crypto payment integration.

> **🔄 Migration Update**: This project has been migrated from MySQL to Supabase. See the [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md) file for details about the migration process and troubleshooting Row Level Security (RLS) issues.

## ✨ Features

### 🎯 Core Functionality
- **Flight Search & Booking** - Search flights by route, date, passengers, and class
- **Real-time Flight Tracking** - Track flights using unique tracking numbers
- **PDF Ticket Generation** - Automatic ticket generation after successful payment
- **Multi-currency Support** - USD (default), EUR, GBP with real-time conversion

### 💳 Payment Integration
- **Paystack Payment Gateway** - Secure inline payment processing
- **Crypto Payment Support** - Cryptocurrency payment options
- **Server-side Payment Verification** - Enhanced security with transaction validation
- **Payment Status Tracking** - Real-time payment status updates
- **Automatic Booking Updates** - Database updates on successful payments

### 👨‍💼 Admin Dashboard
- **Flight Management** - CRUD operations for flights, airlines, and locations
- **Payment Configuration** - API key management for payment gateways
- **Revenue Analytics** - Real-time revenue tracking and statistics
- **User Management** - Role-based access control

### 🔐 Security Features
- **Row Level Security (RLS)** - Database-level security
- **Role-based Access Control** - Admin and user roles
- **Server-side Payment Processing** - No client-side API keys
- **Input Validation** - Comprehensive data validation

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **Payment**: Paystack API & Crypto Payments
- **State Management**: Zustand
- **Styling**: Tailwind CSS with custom design system

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Paystack account (for card payments)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/ufuomasamson/danoairways.git
cd danoairways
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Paystack Configuration (stored in database via admin dashboard)
# No environment variables needed - configure via /admin/dashboard

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Supabase Setup
1. Create a new project in Supabase
2. Set up authentication (Email/Password)
3. Import the database schema using the migration files
4. Configure Row Level Security (RLS) policies

For detailed setup instructions, refer to [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)

### 5. Verify Supabase Connection
```bash
# Start development server
npm run dev

# Visit test page
open http://localhost:3000/test-supabase
```

### 6. Payment Configuration
1. Go to `/admin/dashboard` in your app
2. Add your Paystack API keys:
   - `live_secret` (for production) ⚠️ **REQUIRED FOR LIVE PAYMENTS**
   - `live_public` (for production) ⚠️ **REQUIRED FOR LIVE PAYMENTS**
   - `test_secret` (for development)
   - `test_public` (for development)
3. Configure crypto wallet addresses for crypto payments
4. Save the configuration

**🔴 IMPORTANT**: This application is configured for LIVE payments. Make sure to:
- Add your live Paystack API keys in the admin dashboard
- Test thoroughly in development before going live
- Ensure your Paystack account is verified and can accept live payments

### 7. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts with roles
- `flights` - Flight information with tracking numbers
- `bookings` - User bookings with payment status
- `airlines` - Airline information
- `locations` - Airport/city data
- `currencies` - Multi-currency support
- `payment_gateways` - Payment configuration
- `user_preferences` - User settings

### MySQL Database Setup for cPanel
1. **Create the Database**
   - Go to MySQL Databases in cPanel
   - Create a new database named `united_airline` (or your preferred name)
   - Create a new database user with a strong password
   - Add the user to the database with ALL PRIVILEGES

2. **Import Database Structure**
   - Navigate to phpMyAdmin from cPanel
   - Select your newly created database
   - Click on the "Import" tab
   - Upload and execute the comprehensive SQL file:
     - `united_airline_complete_database.sql` - Creates all tables, relationships, and adds sample data
     
3. **Verify Database Setup**
   - Check that all tables were created successfully (should see 10 tables)
   - Verify sample data was imported correctly (locations, airlines, currencies)
   - Test the database connection with your application

## 💳 Payment Flow

### Paystack Payment Flow
1. **User selects flight** → Booking created
2. **User clicks "Pay with Paystack"** → Inline payment modal opens
3. **User enters card details** → Payment processed via Paystack API
4. **Payment completed** → Booking automatically approved
5. **Ticket generated** → Available for download immediately

### Crypto Payment Flow
1. **User selects flight** → Booking created
2. **User clicks "Pay with Crypto"** → Crypto wallet modal opens
3. **User uploads payment proof** → Booking status set to "awaiting approval"
4. **Admin approves payment** → Booking approved and ticket generated

## 🔧 API Endpoints

### Payment Endpoints
- `POST /api/payment/paystack/charge` - Process Paystack payments
- `POST /api/payment/paystack/submit-pin` - Submit PIN for card verification
- `POST /api/payment/paystack/submit-otp` - Submit OTP for card verification
- `POST /api/payments` - Submit crypto payment proof
- `GET /api/payment/paystack/check-config` - Check Paystack configuration

### Admin Endpoints
- `GET /admin/dashboard` - Admin dashboard with analytics
- `POST /admin/flights` - Flight management
- `GET /paystack-debug` - Payment configuration and testing

## 🧪 Testing

### Payment Testing (Development Only)
**Note: The application is now configured for LIVE payments. Only use test cards in development mode.**

For development testing, use Paystack test cards:
- **Visa**: 4084084084084081 
- **Mastercard**: 5200000000000007
- **Verve**: 5060000000000000005

**⚠️ PRODUCTION WARNING**: In production, all payments are processed with real money using live Paystack API keys.

### Debug Endpoints
- `http://localhost:3000/paystack-debug` - Check Paystack setup and configuration
- `http://localhost:3000/payment-test` - Test payment flow with currency conversion
- `http://localhost:3000/test-supabase` - Test database connection

## 🚀 Deployment

### Truehost cPanel Hosting

We've prepared detailed instructions for deploying this application to Truehost cPanel in the [CPANEL_DEPLOYMENT.md](./CPANEL_DEPLOYMENT.md) file.

**Quick Overview of Truehost cPanel Deployment:**

1. **Create MySQL Database** in Truehost cPanel's MySQL Database tool (note the username prefix)
2. **Import SQL Files** using phpMyAdmin with the single `united_airline_complete_database.sql` file
3. **Upload Application Files** via Truehost File Manager (compressed ZIP recommended)
4. **Configure Environment Variables** in a `.env` file with your Truehost database credentials
5. **Set Up Node.js Application** using Truehost's Setup Node.js App tool in cPanel
6. **Configure Domain and SSL** for secure access to your application

See the complete step-by-step guide specifically tailored for Truehost in [CPANEL_DEPLOYMENT.md](./CPANEL_DEPLOYMENT.md)

## 📁 Project Structure

```
flights/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin pages
│   │   ├── components/        # Shared components
│   │   └── ...
│   ├── lib/                   # Utility libraries
│   └── services/              # External services
├── supabase/                  # Database migrations
├── public/                    # Static assets
└── ...
```

## 🔒 Security Considerations

- **API Keys**: Stored securely in database, not in client code
- **RLS Policies**: Database-level security for all tables
- **Payment Verification**: Server-side validation of all payments
- **Input Validation**: Comprehensive validation on all inputs

## 🐛 Troubleshooting

### Common Issues

1. **Payment Verification Fails**
   - Check API keys in `/admin/integrations`
   - Verify Flutterwave account is active
   - Check server logs for detailed errors

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check RLS policies
   - Run database migrations

3. **Amount Conversion Issues**
   - Use debug endpoint: `/api/payment/debug-amount`
   - Check currency conversion logic
   - Verify Flutterwave amount format

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a service
- [Paystack](https://paystack.com/) - Payment processing
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

## 📞 Support

For support, please:
1. Check the troubleshooting section
2. Review server logs for error details
3. Create an issue with detailed information

---

**Built with ❤️ using Next.js and Supabase**
