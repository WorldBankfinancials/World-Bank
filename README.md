# World Bank Digital Banking Platform

A comprehensive international banking application providing secure digital banking services with advanced technological integrations.

## Overview

This is a full-stack banking application built with React, TypeScript, Express, and Supabase, featuring:

- **Mobile-first Design**: Responsive interface optimized for mobile banking
- **Multi-language Support**: English and Chinese translations (580+ keys)
- **Real-time Features**: Live chat, notifications, and transaction processing
- **Admin Dashboard**: Comprehensive management tools for banking operations
- **Security**: Multi-factor authentication with PIN verification
- **International Banking**: Global transfer capabilities with compliance features

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development and builds
- Tailwind CSS with custom World Bank branding
- Shadcn/ui component library
- TanStack Query for state management
- Wouter for routing

### Backend
- Node.js with Express.js
- Supabase for authentication and database
- Drizzle ORM for type-safe database operations
- WebSocket support for real-time features
- RESTful API design

## Features

### User Management
- Comprehensive user profiles with international banking requirements
- Multi-step registration with identity verification
- Profile settings with personal and professional information
- Security settings with PIN management

### Account System
- Multiple account types (checking, savings, investment)
- Multi-currency support
- Real-time balance tracking
- Account verification and compliance

### Transaction Processing
- International transfer capabilities
- Real-time transaction processing
- Enhanced verification for high-value transactions
- Transaction history with filtering

### Banking Services
- Credit card management
- Investment portfolio tracking
- Digital wallet solutions
- Customer support system

## Quick Start

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   cd client && npm install
   ```
3. Set up environment variables in `.env`
4. Start the development server:
   ```bash
   npm run dev
   ```

### Deployment on Vercel

1. Connect your GitHub repository to Vercel
2. Set the following build settings:
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/dist`
   - Install Command: `cd client && npm install`
3. Add environment variables in Vercel dashboard
4. Deploy

## User Credentials

### Customer Access
- **Username**: liu.wei
- **Password**: password123
- **PIN**: 0192
- **Email**: bankmanagerworld5@gmail.com

### Admin Access
- **Username**: admin
- **Password**: admin123
- **Admin Panel**: `/simple-admin`

## API Endpoints

- `GET /api/user` - Get user profile
- `GET /api/accounts` - Get user accounts
- `GET /api/accounts/:id/transactions` - Get account transactions
- `POST /api/login` - User authentication
- `POST /api/verify-pin` - PIN verification
- `POST /api/admin/customers/:id/balance` - Update customer balance

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── contexts/      # React contexts
│   │   └── lib/           # Utilities and configurations
├── server/                # Express backend
├── api/                   # Vercel serverless functions
├── shared/                # Shared types and schemas
└── supabase/             # Database migrations and config
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For technical support or questions, contact the development team or visit the admin dashboard for operational assistance.