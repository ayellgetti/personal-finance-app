-- Local/dev Sales CRM admin (idempotent).
-- Login: crm.admin@localhost.local / CrmAdmin#2026
-- (Zod z.email() rejects the .localhost TLD, so this uses .localhost.local.)
-- Hash is bcryptjs cost 10 (same default as BCRYPT_ROUNDS).
-- Catalog/roles match apps/api/src/modules/sales-crm/rbac/rbac.catalog.ts.

-- Permission catalog: insert missing codes only (no-op if bootstrap already ran).
INSERT INTO "Permission" (
  "id", "code", "name", "isActive", "createdBy", "createdAt", "updatedBy", "updatedAt"
)
SELECT gen_random_uuid()::text, v.code, v.name, 1, 'migration', CURRENT_TIMESTAMP, 'migration', CURRENT_TIMESTAMP
FROM (
  VALUES
    ('crm.dashboard.read', 'View dashboard'),
    ('crm.contacts.read', 'View contacts'),
    ('crm.contacts.create', 'Create contacts'),
    ('crm.contacts.update', 'Update contacts'),
    ('crm.contacts.delete', 'Delete contacts'),
    ('crm.enquiries.read', 'View enquiries'),
    ('crm.enquiries.create', 'Create enquiries'),
    ('crm.enquiries.update', 'Update enquiries'),
    ('crm.enquiries.delete', 'Delete enquiries'),
    ('crm.enquiries.convert', 'Convert enquiries'),
    ('crm.followups.read', 'View follow-ups'),
    ('crm.followups.create', 'Create follow-ups'),
    ('crm.followups.update', 'Update follow-ups'),
    ('crm.followups.delete', 'Delete follow-ups'),
    ('crm.clients.read', 'View clients'),
    ('crm.clients.create', 'Create clients'),
    ('crm.clients.update', 'Update clients'),
    ('crm.clients.delete', 'Delete clients'),
    ('crm.payments.read', 'View payments'),
    ('crm.payments.create', 'Create payments'),
    ('crm.payments.update', 'Update payments'),
    ('crm.payments.delete', 'Delete payments'),
    ('crm.tasks.read', 'View tasks'),
    ('crm.tasks.create', 'Create tasks'),
    ('crm.tasks.update', 'Update tasks'),
    ('crm.tasks.delete', 'Delete tasks'),
    ('crm.calendar.read', 'View calendar'),
    ('crm.calendar.create', 'Create calendar events'),
    ('crm.calendar.update', 'Update calendar events'),
    ('crm.calendar.delete', 'Delete calendar events'),
    ('crm.users.read', 'View CRM users'),
    ('crm.users.create', 'Create CRM users'),
    ('crm.users.update', 'Update CRM users'),
    ('crm.roles.read', 'View roles'),
    ('crm.roles.update', 'Update roles')
) AS v(code, name)
ON CONFLICT ("code") DO NOTHING;

-- Four CRM roles (create if missing).
INSERT INTO "Role" (
  "id", "name", "slug", "isActive", "createdBy", "createdAt", "updatedBy", "updatedAt"
)
SELECT gen_random_uuid()::text, v.name, v.slug, 1, 'migration', CURRENT_TIMESTAMP, 'migration', CURRENT_TIMESTAMP
FROM (
  VALUES
    ('Admin', 'admin'),
    ('Manager', 'manager'),
    ('Sales', 'sales'),
    ('Viewer', 'viewer')
) AS v(name, slug)
WHERE NOT EXISTS (
  SELECT 1 FROM "Role" r WHERE r.slug = v.slug OR r.name = v.name
);

-- Admin: every permission.
INSERT INTO "RolePermission" (
  "id", "roleId", "permissionId", "isActive", "createdBy", "createdAt", "updatedBy", "updatedAt"
)
SELECT gen_random_uuid()::text, r.id, p.id, 1, 'migration', CURRENT_TIMESTAMP, 'migration', CURRENT_TIMESTAMP
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.slug = 'admin'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Manager / sales / viewer grants only when this migration is filling an empty
-- RolePermission table (bootstrap already applied them otherwise).
INSERT INTO "RolePermission" (
  "id", "roleId", "permissionId", "isActive", "createdBy", "createdAt", "updatedBy", "updatedAt"
)
SELECT gen_random_uuid()::text, r.id, p.id, 1, 'migration', CURRENT_TIMESTAMP, 'migration', CURRENT_TIMESTAMP
FROM "Role" r
JOIN "Permission" p ON (
  (r.slug = 'manager' AND p.code <> 'crm.roles.update')
  OR (r.slug = 'sales' AND p.code NOT LIKE 'crm.users.%' AND p.code NOT LIKE 'crm.roles.%')
  OR (r.slug = 'viewer' AND p.code LIKE '%.read')
)
WHERE r.slug IN ('manager', 'sales', 'viewer')
  AND NOT EXISTS (
    SELECT 1 FROM "RolePermission" existing WHERE existing."roleId" = r.id
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Dedicated CRM admin user (skip if email or mobile already exists).
INSERT INTO "User" (
  "id",
  "firstName",
  "lastName",
  "dob",
  "gender",
  "countryCode",
  "mobileNo",
  "email",
  "password",
  "isActive",
  "createdBy",
  "createdAt",
  "updatedBy",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'CRM',
  'Admin',
  TIMESTAMP '1990-01-01 00:00:00',
  'male',
  '+91',
  '+910000000001',
  'crm.admin@localhost.local',
  '$2b$10$caPgaQMtL1Brhw1SkXF49uJQVSNwBEzYZjWREfwu6W51aBCDJpcte',
  1,
  'migration',
  CURRENT_TIMESTAMP,
  'migration',
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "User"
  WHERE email = 'crm.admin@localhost.local' OR "mobileNo" = '+910000000001'
);

-- Link that user to the admin role.
INSERT INTO "UserRole" (
  "id", "userId", "roleId", "isActive", "createdBy", "createdAt", "updatedBy", "updatedAt"
)
SELECT gen_random_uuid()::text, u.id, r.id, 1, 'migration', CURRENT_TIMESTAMP, 'migration', CURRENT_TIMESTAMP
FROM "User" u
JOIN "Role" r ON r.slug = 'admin'
  WHERE u.id = (
  SELECT id
  FROM "User"
  WHERE email = 'crm.admin@localhost.local' OR "mobileNo" = '+910000000001'
  ORDER BY CASE WHEN email = 'crm.admin@localhost.local' THEN 0 ELSE 1 END
  LIMIT 1
)
ON CONFLICT ("userId", "roleId") DO NOTHING;
