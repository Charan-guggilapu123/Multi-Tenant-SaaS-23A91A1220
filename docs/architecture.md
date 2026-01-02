# System Architecture

## Architecture Diagram

![System Architecture](./images/system-architecture.png)

The system follows a standard 3-tier architecture:
1.  **Client Layer**: React-based Single Page Application (SPA).
2.  **API Layer**: Node.js/Express REST API. Handles business logic, authentication, and tenant context resolution.
3.  **Data Layer**: PostgreSQL Database. Stores all persistent data with rigid relational structure.

**Flow**:
User Request -> Nginx/Docker Router -> Backend API -> functionality (Auth/Tenant Check) -> Database Query -> Response.

## Database Schema Design (ERD)

![Database ERD](./images/database-erd.png)

### Core Tables
*   **Tenants**: `id`, `name`, `subdomain`, `plan`, `limits`
*   **Users**: `id`, `tenant_id`, `email`, `password`, `role`
*   **Projects**: `id`, `tenant_id`, `name`, `status`
*   **Tasks**: `id`, `project_id`, `tenant_id`, `title`, `status`, `assigned_to`
*   **AuditLogs**: `id`, `tenant_id`, `user_id`, `action`, `entity`

*Relationships*:
*   Tenant (1) -> (N) Users
*   Tenant (1) -> (N) Projects
*   Project (1) -> (N) Tasks
*   User (1) -> (N) Tasks (Assignment)

## API Architecture

### Authentication Module
*   `POST /api/auth/register-tenant` (Public)
*   `POST /api/auth/login` (Public)
*   `GET /api/auth/me` (Auth)
*   `POST /api/auth/logout` (Auth)

### Tenant Management
*   `GET /api/tenants` (Super Admin)
*   `GET /api/tenants/:id` (Admin)
*   `PUT /api/tenants/:id` (Admin/Super Admin)

### User Management
*   `POST /api/tenants/:tenantId/users` (Tenant Admin)
*   `GET /api/tenants/:tenantId/users` (Auth)
*   `PUT /api/users/:id` (Tenant Admin/Self)
*   `DELETE /api/users/:id` (Tenant Admin)

### Project Management
*   `POST /api/projects` (Auth)
*   `GET /api/projects` (Auth)
*   `PUT /api/projects/:id` (Tenant Admin/Creator)
*   `DELETE /api/projects/:id` (Tenant Admin/Creator)

### Task Management
*   `POST /api/projects/:projectId/tasks` (Auth)
*   `GET /api/projects/:projectId/tasks` (Auth)
*   `PUT /api/tasks/:id` (Auth)
*   `PATCH /api/tasks/:id/status` (Auth)
*   `DELETE /api/tasks/:id` (Auth)
