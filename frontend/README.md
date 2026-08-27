# Enterprise Affiliate Management SaaS Platform

Production-ready, commercial-grade **Affiliate Management Software** built with React 19, Node.js / Express (MVC + Service + Repository Pattern), and Supabase PostgreSQL.

---

## Architecture & Tech Stack

### Frontend
- **React 19** + **React Router DOM v7**
- **Vanilla CSS3 Design System** with HSL theme tokens (Stripe & Linear SaaS aesthetic)
- **Axios** with automatic JWT access token attachment and refresh token rotation interceptor
- **Context API** (`AuthContext`, `ThemeContext`, `NotificationContext`)
- **Responsive Layouts** with skeleton loaders, empty states, and modal components

### Backend
- **Node.js** + **Express.js**
- **Clean Architecture**: Repositories -> Services -> Controllers -> Middlewares -> Routes
- **Authentication**: JWT Access Token (15m) + JWT Refresh Token (7d) + Password hashing with `bcryptjs`
- **Security**: Helmet, CORS, Express Rate Limiter, Input Validation (`express-validator`), Centralized Error Handler
- **Database**: PostgreSQL (Supabase compatible) with parameterized queries, foreign key constraints, indexes, and soft deletes (`deleted_at`)

---

## Database Schema (17 Normalized Tables)
1. `roles` & `permissions` & `role_permissions`
2. `users` & `profiles`
3. `affiliate_links` & `click_events` & `conversion_events`
4. `referrals`
5. `commissions` & `commission_rules`
6. `withdraw_requests` & `transactions`
7. `notifications` & `activity_logs` & `audit_logs` & `system_settings`

---

## Pre-seeded Credentials (Password: `password123`)

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@affiliate.com` | Full control, audit logs, system settings, user management |
| **Admin** | `admin@affiliate.com` | Approve affiliates, configure commission rules, reports |
| **Super Affiliate** | `superaffiliate@affiliate.com` | Team network management, sub-affiliate tracking |
| **Affiliate** | `affiliate@affiliate.com` | Custom referral code `AFF-HJ72KS`, click/conversion tracking, earnings |

---

## Getting Started

### 1. Database Setup (Supabase / Local Postgres)
Run the SQL DDL scripts inside `backend/src/database`:
1. Execute `schema.sql` in Supabase SQL Editor.
2. Execute `seed.sql` to populate roles and sample credentials.

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Update DATABASE_URL with your Supabase PostgreSQL connection string
npm install
npm run dev
```
Backend server will run at `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend application will open at `http://localhost:3000`.

---

## Deployment Guide

### Vercel (Frontend)
- The repository-root `vercel.json` builds the `frontend` directory automatically.
- In Vercel, add `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`.
- Redeploy after setting the variable because Vite embeds it at build time.

### Render (Backend)
- Create the service using the repository-root `render.yaml` Blueprint. It sets
  `backend` as the service root and exposes `/health` for health checks.
- Set `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
  `FRONTEND_URL`, and `CORS_ORIGIN`. The last two must be your exact frontend URL,
  including `https://` and without a trailing slash.
- Initialize the database before using the API: run
  `npm run db:migrate` once from `backend` with the production `DATABASE_URL`.
  This creates schema only; never run the demo seed script in production.

### Required production secrets

Set `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `STOREFRONT_API_KEY` to
independent random values of at least 32 characters. The storefront API key is
server-to-server only: your ecommerce backend must send it in
`X-Storefront-Api-Key` when it creates a payment order or records a conversion.
Do not expose it in browser code or Vite environment variables.
The ecommerce backend must calculate the final order amount from its own
catalogue and checkout records before calling the payment endpoint; it must
never trust an amount sent by a browser.

### Standard affiliate commission slabs

Standard affiliate commissions are calculated on the final amount paid (after
the customer discount):

| Order value | Commission rate |
| --- | --- |
| Up to ₹1,000 | 10% |
| ₹1,001–₹1,500 | 15% |
| ₹1,501–₹2,000 | 20% |
| Above ₹2,000 | 20% |

Super-affiliate and other roles continue to use the active commission rule
configured by an administrator.

### Ecommerce conversion tracking

Referral visitors arrive on the storefront with `ref`, `click_id`, and the
affiliate offer in the URL, for example
`https://veggieradiance.com/?ref=AFF-123&click_id=<uuid>&affiliate_discount=10`.
Every valid affiliate link gives the customer a **10% discount** by default.
Set `AFFILIATE_DISCOUNT_PERCENT` on the backend to change that value.

The Veggie Affiliate storefront should persist `ref` and `click_id` through the
cart, then apply the discount before payment. For server-side validation, call:

```http
GET https://<your-render-service>.onrender.com/referrals/discount/AFF-123
```

Only apply the returned `discountPercent` when the response confirms
`valid: true`; do not trust a customer-edited URL parameter. Send the **final
discounted amount** in the conversion request below, so affiliate commission
is calculated on the amount actually paid.
When the payment is confirmed, the **server-side** checkout/webhook on the
Veggie Affiliate ecommerce site must send the paid order to:

```http
POST https://<your-render-service>.onrender.com/referrals/conversion
Content-Type: application/json

{
  "referralCode": "AFF-123",
  "clickId": "<uuid>",
  "orderId": "ORDER-1001",
  "amount": 129.00,
  "currency": "USD"
}
```

The API creates the conversion and pending commission. Sending the same
`orderId` again is safe: it returns the already-recorded conversion and does
not create a duplicate commission.

### Razorpay storefront integration

Payment-order creation and verification are **server-to-server** endpoints.
Do not call them from a Vite/browser app and never expose
`STOREFRONT_API_KEY` there. Configure the same long random key in the affiliate
backend and the ecommerce storefront backend, then send it as:

```http
X-Storefront-Api-Key: <STOREFRONT_API_KEY>
```

The storefront backend calls `POST /payments/create-order` with `amount`,
`currency`, `customer`, `referralCode`, and `clickId`. It opens Razorpay
Checkout using the returned `keyId` and `orderId`, then sends the Razorpay
response to `POST /payments/verify` from its server. In Razorpay Dashboard,
set the webhook URL to:

```text
https://<your-render-service>/payments/webhook
```

Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and
`RAZORPAY_WEBHOOK_SECRET` only to Render's backend environment variables.

### Docker
```bash
docker-compose up --build
```
Starts full stack (PostgreSQL database + Express API) containerized environment.

## Operational readiness
- Health checks are available at `/health` and the backend writes a snapshot to `.health.json` for monitoring.
- Structured logs are retained in `logs/api.log` and can be shipped to an external error tracker through `ERROR_TRACKING_URL`.
- Database backup and restore helpers are available via `npm run backup:db` and `npm run restore:db`.
- OpenAPI documentation is available at `/docs` and a storefront integration guide lives in [backend/src/docs/storefront-integration.md](backend/src/docs/storefront-integration.md).
- CI now includes migration smoke tests, dependency audits, secret scanning, frontend unit tests, and Playwright browser tests.
