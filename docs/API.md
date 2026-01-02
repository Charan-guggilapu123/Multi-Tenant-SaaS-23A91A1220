# API Documentation

## Authentication
*   `POST /api/auth/register-tenant`: Register new tenant.
    *   Body: `{ tenantName, subdomain, adminEmail, adminPassword, adminFullName }`
*   `POST /api/auth/login`: Login user.
    *   Body: `{ email, password, tenantSubdomain }`
*   `GET /api/auth/me`: Get current user info.
*   `POST /api/auth/logout`: Logout.

## Tenant Management
*   `GET /api/tenants`: List all tenants (Super Admin).
*   `GET /api/tenants/:tenantId`: Get tenant details (Admin).
*   `PUT /api/tenants/:tenantId`: Update tenant (Admin).

## User Management
*   `POST /api/tenants/:tenantId/users`: Create user (Tenant Admin).
*   `GET /api/tenants/:tenantId/users`: List users (Auth).
*   `PUT /api/users/:userId`: Update user.
*   `DELETE /api/users/:userId`: Delete user (Tenant Admin).

## Project Management
*   `POST /api/projects`: Create project.
*   `GET /api/projects`: List projects.
*   `GET /api/projects/:projectId`: Get project details.
*   `PUT /api/projects/:projectId`: Update project.
*   `DELETE /api/projects/:projectId`: Delete project.

## Task Management
*   `POST /api/projects/:projectId/tasks`: Create task.
*   `GET /api/projects/:projectId/tasks`: List tasks.
*   `GET /api/tasks/my`: List tasks assigned to current user (Dashboard).
*   `PUT /api/tasks/:taskId`: Update task.
*   `PATCH /api/tasks/:taskId/status`: Update task status.
*   `DELETE /api/tasks/:taskId`: Delete task.
