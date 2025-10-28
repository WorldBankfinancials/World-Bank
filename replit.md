# World Bank Digital Banking Platform

## Overview
This project is a full-stack, secure digital banking platform with a mobile-first design, offering comprehensive international banking services. It features a React frontend, Express.js backend, and Supabase for authentication and data. The platform supports multi-language functionality (English and Chinese), real-time features, and includes both customer-facing interfaces and administrative tools. The business vision is to deliver a robust, scalable, and secure banking solution with significant market potential in the digital finance sector.

## User Preferences
Preferred communication style: Simple, everyday language.
Technical approach: Hybrid system - professional banking UI + real Supabase backend functionality.

## System Architecture
The platform utilizes a modern web stack focused on performance, security, and scalability.

**UI/UX Decisions:**
- **Design System:** Mobile-first approach with a professional banking UI.
- **Styling:** Tailwind CSS with World Bank branding and Shadcn/ui for a consistent and modern look.
- **Localization:** Multi-language support (English and Chinese).

**Technical Implementations:**
- **Frontend:** React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state, and React Hook Form with Zod for form handling.
- **Backend:** Node.js with Express.js for RESTful API services.
- **Database:** Supabase (PostgreSQL) with Row Level Security (RLS) and Drizzle ORM for type-safe operations.
- **Authentication:** Supabase Auth for user authentication, custom user profiles, and PIN-based transaction security.
- **Key Features:**
    - **User Management:** Multi-step registration with identity verification, comprehensive user profiles, admin-managed verification.
    - **Banking Operations:** Multiple account types, multi-currency support, international transfers with compliance, and transaction processing with admin approval.
    - **Administrative Tools:** Admin dashboard for customer management, transaction monitoring, live chat, and compliance.
    - **Security:** Multi-factor authentication, RLS, secure transaction processing, and comprehensive audit logging.

**System Design Choices:**
- **Data Flow:** Structured flows for user registration, transactions, and authentication, including admin approval and real-time notifications.
- **Database Schema:** Comprehensive UUID-based banking schema including tables for users, accounts, transactions, cards, messages, beneficiaries, account statements, and alerts, all with RLS, indexes, and foreign key constraints.
- **Security Architecture:** JWT validation across HTTP and WebSocket, resource ownership verification, role-based access control (RBAC), and server-side identity derivation.

## External Dependencies
- **Supabase:** Authentication, PostgreSQL database, and real-time features.
- **Drizzle ORM:** Type-safe ORM for database interactions.
- **TanStack Query (React Query):** Manages frontend server state and data caching.
- **React Hook Form & Zod:** Form handling and validation.
- **Shadcn/ui:** Reusable UI component library.
- **Tailwind CSS:** Utility-first CSS framework.
- **Vite:** Frontend build tool and development server.
- **Node.js & Express.js:** Backend runtime and web application framework.
- **TypeScript:** Static type checking for the entire codebase.