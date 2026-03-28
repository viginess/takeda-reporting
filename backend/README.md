# Clin Solutions L.L.C. Backend API

Backend service for Clin Solutions L.L.C. project.js server powered by tRPC and Drizzle ORM.

## Features

- **tRPC API**: Type-safe communication with the frontend.
- **Two-Tier Validation**: Combined Business-Rule checks (Tier 1) and strict ICH XSD Schema validation (Tier 2).
- **Automated E2B Sync**: Lifecycle orchestration that generates, validates, and stores XML/PDF files on every update.
- **Drizzle ORM**: Type-safe database operations.
- **SQL Database**: PostgreSQL (Supabase).
- **Translation Services**: Integrated Azure Translator API supporting 137+ languages.
- **Translation Caching**: Intelligent Supabase-backed caching.
- **Validation**: Strict input validation with Zod.
- **Compliance**: E2B R3 (HL7 v3) XML generation and ICH-compliant safety reporting.
- **Logging**: Server-side audit logging for all exports and edits.

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

3. **Database Synchronization**:

   ```bash
   # Sync schema directly to Supabase (Recommended for Dev)
   npm run db:push

   # Or generate a migration file for history
   npm run db:generate
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
- **reCAPTCHA**: Support for verifying bot prevention tokens.
- **Translation Audit**: Centralized management of localization strings via Supabase.
- **Testing**: Use `npx tsx test-rate-limit.ts` to verify the rate limiting blocks after 50 attempts.
