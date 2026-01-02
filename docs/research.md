# Research & Requirements Analysis

## Multi-Tenancy Analysis

Multi-tenancy is a software architecture where a single instance of software runs on a server and serves multiple tenants. A tenant is a group of users who share a common access with specific privileges to the software instance.

### Comparison of Approaches

| Approach | Description | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Shared Database, Shared Schema** | All tenants share the same database and tables. A `tenant_id` column associates every record with a specific tenant. | • Lowest cost (one DB instance)<br>• Easiest to maintain/migrate schema<br>• Efficient resource usage | • Weakest data isolation (relies on app logic)<br>• Backup/Restore per tenant is difficult<br>• "Noisy Neighbor" performance effect |
| **Shared Database, Separate Schemas** | Tenants share the database, but each tenant has their own set of tables (schema). | • Better isolation than shared schema<br>• Easier tenant-specific backups<br>• Customizable schema per tenant possible | • Higher complexity in migration management<br>• Database overhead increases with tenant count<br>• Connection pooling complexity |
| **Separate Databases** | Each tenant has their own completely separate database instance. | • Highest data isolation and security<br>• No "Noisy Neighbor" effect<br>• easiest per-tenant backup/restore | • Highest cost (resources per tenant)<br>• Most complex infrastructure management<br>• Hardest to maintain/update en masse |

### Selected Approach: Shared Database + Shared Schema

**Justification:**
For this SaaS application, we have selected the **Shared Database, Shared Schema** approach.
1.  **Simplicity & Development Speed**: This approach is the fastest to implement, fitting the project constraints and allowing focus on feature development.
2.  **Resource Efficiency**: Since we are deploying a dockerized solution with potentially limited resources, running a single Postgres instance with a unified schema is more efficient than managing hundreds of schemas or multiple DB instances.
3.  **Scalability**: While isolation is handled at the application level (Logic), this pattern scales well for a large number of smaller tenants, which fits the "Free/Pro/Enterprise" tier model where many users might be on free or low-volume plans.
4.  **Modern tooling support**: ORMs and tools (like Prisma or Sequelize) handle `tenant_id` filtering effectively, mitigating the isolation risk if implemented correctly with middleware.

## Technology Stack Justification

### Backend: Node.js with Express
*   **Why**: Node.js offers a non-blocking, event-driven architecture ideal for I/O-heavy applications like SaaS platforms. Express is a minimalist, flexible framework that allows for rapid API development.
*   **Alternatives**: Python/Django (too heavy), Go (slower dev speed for this scope).

### Frontend: React (Vite)
*   **Why**: React is the industry standard for dynamic web applications. Vite provides a lightning-fast build tool and development server.
*   **Description**: We will use a component-based architecture with hooks for state management.

### Database: PostgreSQL
*   **Why**: PostgreSQL is a powerful, open-source object-relational database system. It supports JSON types, complex queries, and robust transaction management (ACID compliance), which is critical for multi-tenant data integrity.
*   **Alternatives**: MongoDB (NoSQL less suitable for structured relational tenant data in this case), MySQL.

### Authentication: JWT (JSON Web Tokens)
*   **Why**: Stateless authentication scales well. The separation of client and server requires a token-based approach. JWTs can carry the payload (`tenant_id`, `role`) reducing database lookups for every request authorization.

### Deployment: Docker & Docker Compose
*   **Why**: Ensures consistency across development and production environments. It simplifies dependency management by containerizing the Database, Backend, and Frontend.

## Security Considerations

1.  **Logical Data Isolation**:
    *   **Strategy**: Every database query MUST include a `WHERE tenant_id = ?` clause. This will be enforced via a repository pattern or middleware where possible to prevent developer error.
    *   Using Row Level Security (RLS) in Postgres is an option, but application-level enforcement is chosen for simplicity in this implementation.

2.  **Authentication & Authorization**:
    *   **JWT Security**: Tokens will have a short lifespan (24h) and be signed with a strong secret.
    *   **RBAC**: Middleware will check `role` ('super_admin', 'tenant_admin', 'user') before granting access availability to endpoints.

3.  **Password Security**:
    *   **Hashing**: Passwords will never be stored in plain text. We will use `bcrypt` or `argon2` for salt and hashing.

4.  **API Security**:
    *   **Rate Limiting**: To prevent abuse.
    *   **CORS**: Strictly configured to allow only the frontend domain.
    *   **Helmet**: HTTP header hardening.

5.  **Input Validation**:
    *   All incoming data (body, params, query) will be validated against strict schemas (e.g., using Joi or Zod) to prevent SQL injection and malformed data entry.
