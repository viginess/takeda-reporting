# Takeda Frontend Application

This React application provides the user interface for Takeda's clinical reporting system.

## Tech Stack

- **Framework**: React + Vite + TypeScript.
- **UI Library**: [Saas UI](https://saas-ui.dev/) / Chakra UI.
- **Data Fetching**: [TanStack Query](https://tanstack.com/query) (React Query).
- **API Client**: [@trpc/react-query](https://trpc.io/).

## Getting Started

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Environment Setup**:
   Ensure `.env` exists with the correct backend URL:

   ```env
   VITE_API_URL=http://localhost:3000
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Development Features

- **Standardized Forms**: Components for Patient, HCP, and Family reports.
- **Multi-step Progress**: Step-by-step reporting flow.
- **Type Safety**: Automatic type sharing with the backend via tRPC.

## Commands

- `npm run dev`: Start Vite development server.
- `npm run build`: Build production bundle.
- `npm run lint`: Run ESLint.
- `npm run preview`: Preview the production build locally.
