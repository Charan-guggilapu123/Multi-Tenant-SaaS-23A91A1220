# Multi-Tenant SaaS Platform

A production-ready, multi-tenant SaaS application where multiple organizations (tenants) can independently register, manage their teams, create projects, and track tasks.

## Features
*   **Multi-Tenancy**: Complete data isolation via `tenant_id`. Subdomain support.
*   **Role-Based Access Control (RBAC)**: Super Admin, Tenant Admin, and User roles.
*   **Subscription Management**: Free, Pro, and Enterprise tiers with limits.
*   **Project & Task Management**: Full CRUD capabilities isolated by tenant.
*   **Secure Authentication**: JWT-based stateless auth with password hashing.
*   **Dockerized**: Full stack (DB, Backend, Frontend) containerization.

## Technology Stack
*   **Frontend**: React (Vite), TailwindCSS, Axios
*   **Backend**: Node.js, Express, pg (node-postgres)
*   **Database**: PostgreSQL 15
*   **DevOps**: Docker, Docker Compose

## Installation & Setup

### Prerequisites
*   Docker & Docker Compose installed.

### Quick Start
1.  **Start Services**
    ```bash
    docker-compose up -d
    ```
    This command will:
    *   Start PostgreSQL database.
    *   Run all migrations automatically.
    *   Seed the database with test data (Super Admin, Demo Tenant).
    *   Start Backend API on port 5000.
    *   Start Frontend App on port 3000.

2.  **Verify Deployment**
    *   Frontend: [http://localhost:3000](http://localhost:3000)
    *   Health Check: `curl http://localhost:5000/api/health`

### Login Credentials
See `submission.json` for full credentials.
*   **Super Admin**: `superadmin@system.com` / `Admin@123`
*   **Demo Tenant Admin**: `admin@demo.com` / `Demo@123`

## Documentation
*   [Research Analysis](docs/research.md)
*   [Product Requirements (PRD)](docs/PRD.md)
*   [Architecture](docs/architecture.md)
*   [Technical Spec](docs/technical-spec.md)
*   [API Documentation](docs/API.md)