# EquipRent Server: The Engine Behind the Rentals

The backend API of **EquipRent**, an equipment rental marketplace where users can explore available equipment. The server provides equipment data with filtering, searching, and sorting capabilities.

> This repository contains the **backend** of the EquipRent project. The frontend lives in a separate repository.

## Links

- 🌐 **Live API:** [EquipRent Server](https://equiprent-server-rk.vercel.app/)
- 💻 **Frontend Repository:** [equiprent-client](https://github.com/rezasdsju/equiprent-client)
- 🔗 **Live Site:** [EquipRent Client](https://equiprent-client-rk.vercel.app/)

## Features

- **MongoDB Integration:** Connects to MongoDB to retrieve equipment data.
- **Approved Equipment Only:** Public listing returns only equipment with approved status.
- **Category Filtering:** Filter equipment by category.
- **Rental Type Filtering:** Filter equipment by rental type (Hourly, Daily, Weekly, Monthly).
- **Price Range Filtering:** Filter equipment using minimum and maximum rental prices.
- **Availability Filtering:** Filter equipment by availability status.
- **Search:** Search equipment by name or location (case-insensitive).
- **Sorting:** Price (low to high), price (high to low), and recently added.
- **Protected Equipment Details:** The equipment details route requires a valid session token, verified by the `verifyToken` middleware.
- **Role-Based Access:** `verifyAdmin` middleware restricts admin-only routes (403 for non-admins).
- **Owner-Only Equipment Creation:** The add equipment route requires a valid session token and owner role, verified by `verifyToken` and `verifyOwner` middleware.
- **Server-Controlled Equipment Data:** Automatically assigns owner information from the authenticated user and sets the initial approval status to `pending` on the backend.
- **Owner-Only Equipment Updates:** Owners can update their own equipment through a protected route using `verifyToken` and `verifyOwner` middleware, with server-side field validation, ownership verification, and error handling.
- **Owner-Only Equipment Deletion:** Allows authenticated owners to delete their own equipment using `verifyToken` and `verifyOwner` middleware, with ownership verification and error handling.
- **Admin User Role Management:** Allows authenticated admins to change user roles (Customer, Owner, and Admin) through a protected API using `verifyToken` and `verifyAdmin` middleware, with role validation and self-role modification prevention.
- **Admin-Only Equipment Updates:** Allows authenticated admins to update any equipment through a protected API route using `verifyToken` and `verifyAdmin` middleware, with server-side field validation and error handling.
- **Admin-Only Equipment Deletion:** Allows authenticated admins to delete any equipment through a protected API route using `verifyToken` and `verifyAdmin` middleware, with error handling.
- **Admin Equipment Approval and Rejection:** Allows authenticated admins to approve or reject equipment submissions by updating their approval status through a protected API route using `verifyToken` and `verifyAdmin` middleware, with status validation.

## Technologies

- **Node.js:** JavaScript runtime environment
- **Express.js:** Backend web framework
- **MongoDB:** NoSQL database
- **dotenv:** Environment variable management
- **CORS:** Cross-Origin Resource Sharing





## API Endpoints

### Base Route

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Returns a Hello World message |

### Public Equipment Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/all-equipments` | Public | Returns approved equipment with optional filtering, searching, and sorting |
| GET | `/all-equipments/:id` | Private (Token required) | Returns details of a single equipment item |

### Owner Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/owner/add-equipment` | Private (Owner only) | Adds new equipment, assigns owner information from the authenticated user, and sets the initial approval status to `pending` |
| GET | `/owner/my-equipments` | Private (Owner only) | Retrieves all equipment listed by the authenticated owner |
| PATCH | `/owner/my-equipments/:id` | Private (Owner only) | Updates an equipment item owned by the authenticated owner with server-side field validation and ownership verification |
| DELETE | `/owner/my-equipments/:id` | Private (Owner only) | Deletes an equipment item owned by the authenticated owner with ownership verification |

### Admin Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/admin/all-equipment` | Private (Admin only) | Retrieves all equipment, sorted by creation date (newest first) |
| PATCH | `/admin/all-equipment/:id/approval` | Private (Admin only) | Updates an equipment item's approval status (`pending`, `approved`, or `rejected`) with status validation |
| PATCH | `/admin/all-equipment/:id` | Private (Admin only) | Updates equipment information with server-side field validation |
| DELETE | `/admin/all-equipment/:id` | Private (Admin only) | Deletes any equipment item |
| GET | `/admin/users` | Private (Admin only) | Retrieves all registered users, sorted by registration date (newest first) |
| PATCH | `/admin/users/:id` | Private (Admin only) | Updates a user's role (`admin`, `customer`, or `owner`) with role validation and prevents admins from changing their own role |

### Query Parameters

| Parameter | Description | Example |
|---|---|---|
| `category` | Filter by equipment category | `category=Electronics` |
| `rentalType` | Filter by rental type | `rentalType=Daily` |
| `availability` | Filter by availability | `availability=Available` |
| `minPrice` | Minimum rental price | `minPrice=100` |
| `maxPrice` | Maximum rental price | `maxPrice=1000` |
| `search` | Search by equipment name or location | `search=Dhaka` |
| `sort` | Sort equipment by price or creation date | `sort=price-asc` |

### Sorting Options

| Value | Description |
|---|---|
| `price-asc` | Price: Low to High |
| `price-desc` | Price: High to Low |
| `recent` | Recently Added (default) |

### Example Request

```http
GET /all-equipments?category=Electronics&minPrice=100&maxPrice=1000&sort=price-asc
```

---


## Getting Started

Follow these steps to run the server locally.

### Prerequisites

- Node.js
- npm
- MongoDB database
- Nodemon

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/rezasdsju/equiprent-server.git
   ```

2. Navigate to the project directory:

   ```bash
   cd equiprent-server
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory:

   ```env
   PORT=5000
   MONGODB_URI=
   ```

   Add your MongoDB connection string to `MONGODB_URI`.

5. Start the development server using Nodemon:

   ```bash
   nodemon index.js
   ```

   Replace `index.js` with your actual server entry filename if it is different.


---

Built with Node.js, Express.js, and MongoDB.