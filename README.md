# Fable Server – Express.js Backend

## 🌐 Live URL
https://fable-server-delta.vercel.ap

## 📖 Purpose
REST API backend for the Fable ebook sharing platform.

## 🛠️ Tech Stack
- Express.js
- MongoDB (Native Driver)
- Stripe
- better-auth
- dotenv
- cors

## 🔗 API Endpoints

### Users
- `GET /api/users/:email` — Get user by email
- `PATCH /api/users/:email/profile` — Update profile

### Ebooks
- `GET /api/ebooks` — Get all ebooks (with filters)
- `GET /api/ebooks/featured` — Get featured ebooks
- `GET /api/ebooks/writer/:email` — Get writer's ebooks
- `GET /api/ebooks/:id` — Get single ebook
- `POST /api/ebooks` — Add ebook
- `PUT /api/ebooks/:id` — Update ebook
- `PATCH /api/ebooks/:id/status` — Toggle status
- `DELETE /api/ebooks/:id` — Delete ebook

### Bookmarks
- `GET /api/bookmarks/:email` — Get bookmarks
- `POST /api/bookmarks` — Add bookmark
- `DELETE /api/bookmarks/:ebookId` — Remove bookmark

### Purchases & Payment
- `GET /api/purchases/:email` — Get user purchases
- `POST /api/payment/create-checkout` — Create Stripe session
- `POST /api/payment/save-purchase` — Save purchase

### Writers
- `GET /api/writers/top` — Get top 3 writers
- `GET /api/sales/writer/:email` — Get writer sales

### Admin
- `GET /api/admin/analytics` — Platform analytics
- `GET /api/admin/users` — All users
- `PATCH /api/admin/users/:email/role` — Update role
- `DELETE /api/admin/users/:email` — Delete user
- `GET /api/admin/ebooks` — All ebooks
- `GET /api/admin/transactions` — All transactions


