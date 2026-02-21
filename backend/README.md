# Takeda Backend API

The backend is a lightweight Node.js server powered by tRPC and Drizzle ORM.

## Features

- **tRPC API**: Type-safe communication with the frontend.
- **Drizzle ORM**: Type-safe database operations.
- **SQL Database**: PostgreSQL (Supabase).
- **Validation**: Strict input validation with Zod.

## Getting Started

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file from `.env.example`:

   ```env
   DATABASE_URL=postgres://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   PORT=3000
   ```

3. **Database Migration**:

   ```bash
   npm run db:generate  # Generate migration files
   npm run db:migrate   # Run migrations in database
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## API Structure

- `src/server.ts`: Entry point with CORS and error handling.
- `src/trpc/`: Router composition and base tRPC setup.
- `src/modules/`: Domain-driven routers (Patient, HCP, Family).
- `src/db/`: Schema definitions and database initialization.

## Security & Verification

- **Input Validation**: Strictly enforced via Zod schemas.
- **CORS**: Configured to restrict access to authorized frontend origins.
- **Robust Rate Limiting**: Multi-layer fingerprinting (IP + UA + Guest ID).
- **Testing**: Use `npx tsx test-rate-limit.ts` to verify the rate limiting blocks after 50 attempts.
