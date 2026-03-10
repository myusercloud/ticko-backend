## Ticko Backend

Node.js/Express, PostgreSQL (Prisma), Redis, Stripe, BullMQ-based event ticketing backend similar to Eventbrite.

### Tech Stack

- **Runtime**: Node.js 20
- **Web**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Cache/Locks/Queues**: Redis + BullMQ
- **Auth**: JWT
- **Payments**: Stripe Payment Intents + Webhooks
- **Tickets**: QR code + PDF (PDFKit)
- **Docs**: Swagger (at `/api/docs`)
- **Tests**: Jest + Supertest

### Getting Started

1. **Install dependencies**

```bash
npm install
```

2. **Copy env and edit**

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL, Redis, and Stripe keys.

3. **Run with Docker (recommended)**

```bash
docker-compose up --build
```

This starts:

- `api` on port `4000`
- `postgres` on `5432`
- `redis` on `6379`

4. **Run migrations and seed**

In another shell inside the container or on host (with env configured):

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

5. **Start dev server (without Docker)**

```bash
npm run dev
```

The API will be available at `http://localhost:4000/api`.

6. **Run workers**

```bash
npm run worker
```

### Key API Endpoints (examples)

- **Auth**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`

- **Events**
  - `GET /api/events?page=1&pageSize=20`
  - `GET /api/events/:id`
  - `POST /api/events` (organizer/admin)
  - `PUT /api/events/:id` (organizer/admin)
  - `DELETE /api/events/:id` (organizer/admin)

- **Payments & Tickets**
  - `POST /api/payments/intent` (reserve + Stripe payment intent)
  - Stripe webhook: `POST /api/webhooks/stripe` (configured in `app.js`)
  - `GET /api/tickets/:code/pdf` (download ticket PDF)
  - `POST /api/tickets/scan` (organizer/admin) – validate + mark ticket used

- **Dashboard (Organizer)**
  - `GET /api/dashboard/events/:eventId/stats`

### Users Seeded

After `npm run prisma:seed`:

- Admin: `admin@ticko.local` / `password123`
- Organizer: `organizer@ticko.local` / `password123`
- Attendee: `attendee@ticko.local` / `password123`

### Notes

- Stripe webhook needs to be configured to point to `POST /api/webhooks/stripe`.
- Reservation expiration is handled via BullMQ (`ticket-expiration` queue) with a 10‑minute TTL.
- QR and PDF generation happen after successful payment.

