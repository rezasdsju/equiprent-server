# EquipRent Server

<div align="center">

### Backend API for a multi-role equipment rental marketplace

**Browse equipment · Manage listings · Create bookings · Process payments · Analyse platform activity**

[Live API](https://equiprent-server-rk.vercel.app/) · [Live Application](https://equiprent-client-rk.vercel.app/) · [Frontend Repository](https://github.com/rezasdsju/equiprent-client)

</div>

---

## About the Project

**EquipRent** is an equipment rental platform that connects customers with equipment owners.
This repository contains the server-side application responsible for equipment discovery, role-based access control, bookings, favourites, Stripe payment verification, and platform analytics.

The API uses MongoDB for persistent data and session-based authentication for protected routes.

## Key Capabilities

### Public and Discovery

- Approved-equipment marketplace listing
- Category, rental type, availability, and price-range filtering
- Case-insensitive search across equipment names and locations
- Price and newest-first sorting
- Featured and recently added equipment endpoints

### Authentication and Authorization

- Session token verification through MongoDB
- Session expiration checks
- Admin, owner, and customer middleware
- Protected equipment, booking, payment, favourite, and analytics routes

### Customer Features

- Create validated rental booking drafts
- Retrieve draft bookings owned by the authenticated customer
- Verify completed Stripe checkout sessions
- Convert confirmed payments into paid/confirmed bookings
- Reduce available equipment quantity after successful payment verification
- Add, check, list, and remove favourite equipment
- View the customer's rental history

### Owner Features

- Add equipment with server-assigned owner details
- Start submitted equipment in `pending` approval status
- View, update, and delete owned equipment
- View bookings for the owner's equipment
- View owner analytics and monthly earnings

### Admin Features

- View every equipment listing regardless of approval status
- Approve, reject, or reset equipment approval status
- Update or delete equipment
- View all users and update customer, owner, or admin roles
- Delete non-admin users
- View and update rental bookings
- View platform-wide analytics

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript server runtime |
| Express 5 | REST API framework |
| MongoDB | Equipment, session, user, booking, payment, and favourite storage |
| MongoDB Driver | Database queries and aggregation |
| Stripe SDK | Checkout session and payment verification |
| dotenv | Environment configuration |
| CORS | Cross-origin API access |
| Nodemon | Development-time server restarts |

## MongoDB Collections

The API uses the `equiprent` database and these collections:

- `equipments`
- `session`
- `user`
- `bookings`
- `payments`
- `favourites`

## Authorization Model

Protected routes expect a session token in the request header:

```http
Authorization: Bearer <session-token>
```

The `verifyToken` middleware:

1. Reads the bearer token.
2. Finds the matching session in MongoDB.
3. Rejects expired sessions.
4. Loads the associated user.
5. Attaches the user to `req.user`.

The `verifyAdmin`, `verifyOwner`, and `verifyCustomer` middleware then enforce the required role.

## API Reference

### General

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | Health/root response |

### Equipment Discovery

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/all-equipments` | Public | Approved equipment with filters, search, and sorting |
| `GET` | `/all-equipments/:id` | Authenticated | Equipment details |
| `GET` | `/featured-equipments` | Public | Up to 6 approved equipment items |
| `GET` | `/recently-added-equipments` | Public | Up to 4 approved items sorted newest first |

### Owner

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/owner/add-equipment` | Owner | Add equipment; assign owner data and set `pending` approval |
| `GET` | `/owner/my-equipments` | Owner | List the owner's equipment |
| `PATCH` | `/owner/my-equipments/:id` | Owner | Update owned equipment |
| `DELETE` | `/owner/my-equipments/:id` | Owner | Delete owned equipment |
| `GET` | `/owner/my-equipments-rental` | Owner | List bookings for the owner's equipment |
| `GET` | `/owner/analytics` | Owner | Equipment, rental, earnings, and monthly earnings data |

### Admin

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/all-equipment` | Admin | All equipment, newest first |
| `PATCH` | `/admin/all-equipment/:id/approval` | Admin | Set approval to `pending`, `approved`, or `rejected` |
| `PATCH` | `/admin/all-equipment/:id` | Admin | Update equipment fields |
| `DELETE` | `/admin/all-equipment/:id` | Admin | Delete equipment |
| `GET` | `/admin/users` | Admin | All users, newest first |
| `PATCH` | `/admin/users/:id` | Admin | Change a user's role |
| `DELETE` | `/admin/users/:id` | Admin | Delete a non-admin user |
| `GET` | `/admin/rentals` | Admin | All rental bookings, newest first |
| `PATCH` | `/admin/rentals/:id` | Admin | Update booking status |
| `GET` | `/admin/analytics` | Admin | Platform users, equipment, bookings, revenue, and monthly bookings |

### Customer

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/customer/bookings/draft` | Customer | Create a draft rental booking |
| `GET` | `/customer/bookings/draft/:id` | Customer | Retrieve the customer's draft booking |
| `POST` | `/customer/payments/checkout-verify` | Customer | Verify a Stripe checkout session |
| `POST` | `/customer/favourites` | Customer | Add equipment to favourites |
| `GET` | `/customer/favourites/:id` | Customer | Check whether equipment is a favourite |
| `DELETE` | `/customer/favourites/:id` | Customer | Remove equipment from favourites |
| `GET` | `/customer/favourites` | Customer | List favourite equipment |
| `GET` | `/customer/rental` | Customer | List the customer's rentals |

## Query Options

The `/all-equipments` endpoint supports:

| Parameter | Description | Example |
|---|---|---|
| `category` | Filter by category | `category=Electronics` |
| `rentalType` | Filter by `Daily`, `Weekly`, or `Monthly` | `rentalType=Daily` |
| `availability` | Filter by availability | `availability=Available` |
| `minPrice` | Minimum rental price | `minPrice=100` |
| `maxPrice` | Maximum rental price | `maxPrice=1000` |
| `search` | Search equipment name or location | `search=Dhaka` |
| `sort` | Choose `price-asc`, `price-desc`, or `recent` | `sort=price-asc` |

Example:

```http
GET /all-equipments?category=Electronics&minPrice=100&maxPrice=1000&sort=price-asc
```

## Booking Calculation

A draft booking validates its rental dates and required quantity, then calculates the rental duration from the equipment rental type:

- **Daily:** number of booked days
- **Weekly:** booked days divided into 7-day periods
- **Monthly:** booked days divided into 30-day periods

The total booking amount is calculated as:

```text
rental price x rental duration x required quantity
```

After verified payment, the API marks the payment and booking as paid/confirmed and decreases the equipment's available quantity.

## Local Setup

### Prerequisites

- Node.js
- npm
- MongoDB database
- Stripe account for payment verification

### Installation

```bash
git clone https://github.com/rezasdsju/equiprent-server.git
cd equiprent-server
npm install
```

Create a `.env` file in the repository root:

```env
PORT=5000
MONGODB_URI=<your-mongodb-uri>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
```

Start the development server:

```bash
npx nodemon index.js
```

The server uses `PORT` from the environment and defaults to port `5000`.

## Project Structure

```text
equiprent-server/
├── index.js       # API routes, middleware, database setup, and Stripe integration
├── package.json   # Dependencies and project metadata
├── package-lock.json
└── README.md
```

## Related Repository

- [EquipRent Frontend](https://github.com/rezasdsju/equiprent-client)
- [Live Application](https://equiprent-client-rk.vercel.app/)
- [Live API](https://equiprent-server-rk.vercel.app/)

---

<div align="center">
Built with Node.js, Express, MongoDB, and Stripe
</div>
