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
- **Admin-Only User Retrieval:** Allows authenticated admins to retrieve all registered users, sorted by registration date, using `verifyToken` and `verifyAdmin` middleware.

## Technologies

- **Node.js:** JavaScript runtime environment
- **Express.js:** Backend web framework
- **MongoDB:** NoSQL database
- **dotenv:** Environment variable management
- **CORS:** Cross-Origin Resource Sharing

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
| POST | `/add-equipment` | Private (Owner only) | Adds new equipment, assigns owner information from the authenticated user, and sets approval status to `pending` |
| GET | `/my-equipments` | Private (Owner only) | Returns all equipment listed by the authenticated owner |
| PATCH | `/my-equipments/:id` | Private (Owner only) | Updates an equipment item owned by the authenticated owner with server-side field validation and ownership verification |
| DELETE | `/my-equipments/:id` | Private (Owner only) | Deletes an equipment item owned by the authenticated owner with ownership verification and error handling |

### Admin Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/users` | Private (Admin only) | Retrieves all registered users, sorted by registration date (newest first) |



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

Built with Node.js, Express.js, and MongoDB.