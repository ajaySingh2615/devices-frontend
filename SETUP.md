# DeviceHub Frontend Setup

## Overview

This is the frontend for DeviceHub - a premium refurbished electronics e-commerce platform built with Next.js, TypeScript, and Tailwind CSS.

## Design System

### Color Palette

We've chosen an attractive, trust-inspiring color palette perfect for device e-commerce:

- **Primary (Blue)**: `#2563eb` - Trust & reliability
- **Secondary (Emerald)**: `#059669` - Success & quality
- **Accent (Amber)**: `#f59e0b` - Attention & deals
- **Neutral Grays**: Various shades of slate for backgrounds and text

### Typography

- **Display Font**: Plus Jakarta Sans (headings, brand)
- **Body Font**: Inter (readable text)
- **Mono Font**: JetBrains Mono (code, technical)

### Features

- ChatGPT-style authentication layout
- Three login methods: Email, Google OAuth, Phone/OTP
- Modern, clean design inspired by successful e-commerce platforms
- Fully responsive design
- Toast notifications
- Form validation
- JWT token management with auto-refresh

## Installation

1. **Install Dependencies**

```bash
npm install
```

2. **Environment Variables**
   Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

3. **Start Development Server**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   ├── register/      # Registration page
│   │   ├── forgot-password/ # Password reset
│   │   └── layout.tsx     # Auth layout
│   ├── dashboard/         # User dashboard
│   ├── globals.css        # Global styles & design system
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   └── ui/               # Base UI components
│       ├── Button.tsx    # Button component
│       ├── Card.tsx      # Card components
│       └── Input.tsx     # Input component
└── lib/                  # Utilities & configurations
    ├── api.ts            # API client & types
    └── utils.ts          # Utility functions
```

## Authentication Flow

The authentication system supports:

### 1. Email/Password Authentication

- Registration with email, password, name, and optional phone
- Login with email and password
- Password reset via email (TODO: email service)

### 2. Google OAuth

- Integration ready for Google Identity Services
- Automatic account creation for new users
- Seamless login for existing users

### 3. Phone/OTP Authentication

- Send OTP to phone number
- Verify OTP for registration/login
- Currently uses development mode (console output)

## API Integration

The frontend integrates with the Spring Boot backend APIs:

### Authentication Endpoints

- `POST /api/v1/auth/register` - Email registration
- `POST /api/v1/auth/login` - Email login
- `POST /api/v1/auth/google` - Google OAuth
- `POST /api/v1/auth/phone/start` - Send OTP
- `POST /api/v1/auth/phone/verify` - Verify OTP
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/password/forgot` - Request password reset
- `POST /api/v1/auth/password/reset` - Reset password

### User Endpoints

- `GET /api/v1/users/me` - Get user profile
- `PATCH /api/v1/users/me` - Update user profile

## Key Features

### Design & UX

- Modern, clean design with professional color scheme
- ChatGPT-inspired auth layout with tabbed interface
- Fully responsive across all devices
- Smooth animations and transitions
- Focus on accessibility and usability

### Authentication

- Multi-method authentication system
- Secure JWT token management
- Automatic token refresh
- Form validation with helpful error messages
- Toast notifications for user feedback

### Development Experience

- TypeScript for type safety
- React Hook Form for efficient form handling
- Tailwind CSS for rapid styling
- Hot reload and fast refresh
- Comprehensive error handling

## Next Steps

1. **Backend Integration**: Start the Spring Boot backend on port 8080
2. **Google OAuth**: Configure Google Identity Services with your client ID
3. **Email Service**: Implement email service for password reset
4. **SMS Service**: Implement SMS service for phone verification
5. **Device Catalog**: Add device browsing and shopping features
6. **Payment Integration**: Add payment processing
7. **User Dashboard**: Expand user profile and order management

## Backend Compatibility

This frontend is designed to work with the DeviceHub Spring Boot backend that includes:

- JWT authentication with 15-minute access tokens
- Refresh tokens with 15-day expiry
- Multiple authentication methods
- User profile management
- Comprehensive audit logging

Make sure your backend is running on `http://localhost:8080` for development.
