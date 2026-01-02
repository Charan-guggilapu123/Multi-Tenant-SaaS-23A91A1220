# Product Requirements Document (PRD)

## User Personas

1.  **Super Admin**
    *   **Description**: System-level administrator with oversight of the entire platform.
    *   **Responsibilities**: Manage tenants, monitor platform usage, configure global settings.
    *   **Goals**: Ensure platform stability, manage new tenant onboarding, handle high-level support.
    *   **Pain Points**: Lack of visibility into individual tenant usage, manual onboarding processes.

2.  **Tenant Admin**
    *   **Description**: The administrator for a specific organization (Tenant).
    *   **Responsibilities**: Manage team members (users), configure project settings, oversee organization subscription.
    *   **Goals**: Efficiently manage team workflow, secure organization data, maximize productivity.
    *   **Pain Points**: Difficulty in managing user permissions, lack of audit trails for team actions.

3.  **End User**
    *   **Description**: A regular team member within an organization.
    *   **Responsibilities**: Execute tasks, collaborate on projects, update statuses.
    *   **Goals**: Complete assigned tasks, track progress, communicate with the team.
    *   **Pain Points**: Confusing interfaces, unclear task priorities, difficulty finding information.

## Functional Requirements

### Authentication & Tenant Onboarding
*   **FR-001**: The system shall allow a new organization to register as a tenant with a unique subdomain.
*   **FR-002**: The system shall create a default 'tenant_admin' user upon tenant registration.
*   **FR-003**: The system shall prevent duplicate subdomains or admin emails during registration.
*   **FR-004**: The system shall authenticate users via email and password, returning a JWT.
*   **FR-005**: The system shall restrict login access to the correct tenant subdomain/context.

### Tenant Management
*   **FR-006**: The system shall allow Super Admins to view a list of all tenants and their statistics.
*   **FR-007**: The system shall allow Tenant Admins to update their organization's display name.
*   **FR-008**: The system shall enforce subscription plan limits (users/projects) per tenant.

### User Management
*   **FR-009**: The system shall allow Tenant Admins to invite/create new users within their tenant.
*   **FR-010**: The system shall prevent creating more users than the subscription plan allows.
*   **FR-011**: The system shall allow Tenant Admins to deactivate or delete users.

### Project & Task Management
*   **FR-012**: The system shall allow users to create projects with a name, description, and status.
*   **FR-013**: The system shall allow users to create tasks associated with specific projects.
*   **FR-014**: The system shall allow assigning tasks to specific users within the same tenant.
*   **FR-015**: The system shall allow updating task status (Todo -> In Progress -> Completed).
*   **FR-016**: The system shall ensure data isolation so no tenant can view another tenant's projects or tasks.

## Non-Functional Requirements

*   **NFR-001 (Security)**: All user passwords must be salted and hashed (bcrypt/argon2) before storage.
*   **NFR-002 (Security)**: API endpoints must validate the JWT signature and expiration (24h) on every protected request.
*   **NFR-003 (Performance)**: API response time should be under 200ms for 90% of standard CRUD requests.
*   **NFR-004 (Isolation)**: Database queries for tenant-scoped data must always include the `tenant_id` filter.
*   **NFR-005 (Availability)**: The application must be containerized (Docker) to ensure consistent deployment and availability.
*   **NFR-006 (Usability)**: The frontend interface must be responsive, adapting to desktop and mobile viewports.
