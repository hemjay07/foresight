# GEMINI.md

## Project Overview

This is a full-stack web3 project called "Foresight", a revolutionary prediction & fantasy gaming ecosystem. The project is built with a modern tech stack, including:

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS, Wagmi, and RainbowKit for wallet connections.
*   **Backend:** Express, TypeScript, PostgreSQL, and Knex.js.
*   **Smart Contracts:** Foundry and Base Sepolia.
*   **Real-time:** WebSocket for real-time updates.

The project is structured as a monorepo with `pnpm` workspaces, containing three main packages: `frontend`, `backend`, and `contracts`.

## Building and Running

### Prerequisites

*   Node.js (>=20.0.0)
*   pnpm (>=8.0.0)
*   PostgreSQL

### Installation

1.  Install dependencies from the root directory:
    ```bash
    pnpm install
    ```
2.  Create the PostgreSQL database:
    ```bash
    psql postgres -c "CREATE DATABASE foresight;"
    ```
3.  Run database migrations:
    ```bash
    pnpm db:migrate
    ```

### Development

*   **Run all services concurrently (frontend and backend):**
    ```bash
    pnpm dev
    ```
*   **Run frontend only:**
    ```bash
    pnpm dev:frontend
    ```
*   **Run backend only:**
    ```bash
    pnpm dev:backend
    ```

### Building

*   **Build all packages:**
    ```bash
    pnpm build
    ```
*   **Build frontend only:**
    ```bash
    pnpm build:frontend
    ```
*   **Build backend only:**
    ```bash
    pnpm build:backend
    ```

### Testing

*   **Run all tests (backend and contracts):**
    ```bash
    pnpm test
    ```
*   **Run backend tests:**
    ```bash
    pnpm --filter backend test
    ```
*   **Run contract tests:**
    ```bash
    pnpm contracts:test
    ```

### Smart Contracts

*   **Build contracts:**
    ```bash
    pnpm contracts:build
    ```
*   **Deploy contracts to Base Sepolia:**
    ```bash
    pnpm contracts:deploy:sepolia
    ```
*   **Deploy contracts locally:**
    ```bash
    pnpm contracts:deploy:local
    ```

## Development Conventions

*   **Code Formatting:** The project uses Prettier for code formatting. Run `pnpm format` to format all files.
*   **Linting:** The project uses ESLint for linting. Run `pnpm lint` to lint the frontend and backend.
*   **Database:** The backend uses Knex.js for database migrations and seeding. Migrations are located in `backend/migrations` and seeds in `backend/seeds`.
*   **Environment Variables:** The backend and contracts rely on environment variables. Create `.env` files in the respective directories based on the `.env.example` files.
