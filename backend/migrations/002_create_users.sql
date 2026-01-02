CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email)
);

-- Super admin has tenant_id NULL, so we might need partial index or handle logic
-- But the unique constraint above allows multiple NULLs in standard SQL (SQL standard says NULL != NULL),
-- Postgres treats NULLs as distinct for UNIQUE unless specified otherwise (in versions < 15, NULLs distinct. In 15+ allow NULLS NOT DISTINCT).
-- We assume standard behavior where multiple super admins (NULL tenant_id) can exist with same email?
-- No, super admin email should be globally unique or just unique.
-- Let's just create the index on tenant_id for performance.
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
-- Also ensure super admin email is unique if tenant_id is null?
CREATE UNIQUE INDEX IF NOT EXISTS idx_super_admin_email ON users(email) WHERE tenant_id IS NULL;
