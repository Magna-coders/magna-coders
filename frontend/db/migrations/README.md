# Database Migrations

This directory contains database migration scripts for schema changes, data transformations, and version upgrades for the Magna Coders platform.

## Migration Strategy

### Migration Types

1. **Schema Migrations**
   - Table structure changes (ADD/DROP/ALTER columns)
   - Index creation/modification
   - Constraint additions/removals

2. **Data Migrations**
   - Data transformation scripts
   - Data cleanup operations
   - Default value insertions

3. **Refactoring Migrations**
   - Performance optimizations
   - Data normalization/denormalization
   - Schema restructuring

## Migration Naming Convention

```
YYYYMMDD_HHMM_description.sql
```

Examples:
- `20240101_1200_add_user_phone_column.sql`
- `20240102_1430_create_indexes.sql`
- `20240103_0900_migrate_user_data.sql`

## Migration Scripts Structure

### Schema Migration Template
```sql
-- Migration: Add phone column to users table
-- Version: 2024.01.01
-- Description: Adds phone number support for SMS notifications

BEGIN;

-- Add phone column
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Add index for phone lookups
CREATE INDEX CONCURRENTLY idx_users_phone ON users (phone);

-- Add check constraint for phone format
ALTER TABLE users ADD CONSTRAINT chk_users_phone_format
    CHECK (phone IS NULL OR phone ~ '^\+[1-9]\d{1,14}$');

-- Update migration tracking
INSERT INTO schema_migrations (version, description, applied_at)
VALUES ('20240101_1200', 'Add phone column to users table', NOW());

COMMIT;
```

### Data Migration Template
```sql
-- Data Migration: Normalize user roles
-- Version: 2024.01.02
-- Description: Standardizes user role values

BEGIN;

-- Create temporary table for role mapping
CREATE TEMP TABLE role_mapping (
    old_role TEXT,
    new_role TEXT
);

INSERT INTO role_mapping VALUES
    ('admin', 'ADMIN'),
    ('developer', 'DEVELOPER'),
    ('client', 'CLIENT'),
    ('user', 'DEVELOPER');

-- Update user roles
UPDATE users
SET role = rm.new_role::user_role
FROM role_mapping rm
WHERE users.role::TEXT = rm.old_role;

-- Clean up
DROP TABLE role_mapping;

-- Log migration
INSERT INTO schema_migrations (version, description, applied_at)
VALUES ('20240102_1430', 'Normalize user roles', NOW());

COMMIT;
```

## Migration Execution

### Manual Execution
```bash
# Run specific migration
psql -d magna_coders -f migrations/20240101_1200_add_user_phone_column.sql

# Run all pending migrations (if using migration tool)
./run_migrations.sh
```

### Automated Execution
```bash
#!/bin/bash
# run_migrations.sh

MIGRATION_DIR="migrations"
DB_NAME="magna_coders"

# Get list of applied migrations
APPLIED=$(psql -d $DB_NAME -t -c "SELECT version FROM schema_migrations ORDER BY version;")

# Get all migration files
for migration in $(ls $MIGRATION_DIR/*.sql | sort); do
    version=$(basename "$migration" .sql)

    if ! echo "$APPLIED" | grep -q "^$version$"; then
        echo "Applying migration: $version"
        if psql -d $DB_NAME -f "$migration"; then
            echo "✓ Migration $version applied successfully"
        else
            echo "✗ Migration $version failed"
            exit 1
        fi
    else
        echo "Migration $version already applied"
    fi
done
```

## Migration Tracking

### Schema Migrations Table
```sql
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_by VARCHAR(255) DEFAULT CURRENT_USER,
    checksum VARCHAR(255)
);

-- Index for faster lookups
CREATE INDEX idx_schema_migrations_applied_at ON schema_migrations (applied_at);
```

### Migration Status Check
```sql
-- Check applied migrations
SELECT version, description, applied_at, applied_by
FROM schema_migrations
ORDER BY applied_at DESC;

-- Check for missing migrations
SELECT file_name
FROM (
    SELECT substring(filename from '^(\d{8}_\d{4})_') as version,
           filename as file_name
    FROM pg_ls_dir('migrations') as filename
    WHERE filename ~ '^\d{8}_\d{4}_.*\.sql$'
) files
LEFT JOIN schema_migrations sm ON sm.version = files.version
WHERE sm.version IS NULL;
```

## Rollback Strategy

### Safe Rollback Template
```sql
-- Rollback: Remove phone column from users table
-- Version: 20240101_1200
-- Description: Safely removes phone column added in migration 20240101_1200

BEGIN;

-- Check if column exists and has no dependencies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'phone'
    ) THEN
        RAISE EXCEPTION 'Phone column does not exist';
    END IF;

    -- Check for dependencies
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'users'::regclass
        AND conname LIKE '%phone%'
    ) THEN
        RAISE EXCEPTION 'Phone column has dependencies - manual rollback required';
    END IF;
END $$;

-- Drop index
DROP INDEX IF EXISTS idx_users_phone;

-- Drop column
ALTER TABLE users DROP COLUMN IF EXISTS phone;

-- Update migration tracking
DELETE FROM schema_migrations WHERE version = '20240101_1200';

COMMIT;
```

## Pre-migration Checks

### Environment Validation
```sql
-- Check database version compatibility
DO $$
BEGIN
    IF current_setting('server_version_num')::int < 120000 THEN
        RAISE EXCEPTION 'PostgreSQL version 12+ required';
    END IF;
END $$;

-- Check available disk space
DO $$
DECLARE
    available_space BIGINT;
BEGIN
    SELECT pg_tablespace_size('pg_default') INTO available_space;

    IF available_space < 1073741824 THEN -- 1GB
        RAISE WARNING 'Low disk space available: % bytes', available_space;
    END IF;
END $$;

-- Check for long-running transactions
SELECT pid, now() - xact_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - xact_start > interval '5 minutes';
```

## Migration Testing

### Test Environment Setup
```bash
# Create test database
createdb magna_coders_test

# Restore recent backup
pg_restore -d magna_coders_test recent_backup.dump

# Run migrations on test database
./run_migrations.sh --database magna_coders_test

# Run application tests
npm test

# Clean up
dropdb magna_coders_test
```

### Migration Testing Checklist
- [ ] Backup created before migration
- [ ] Test environment available
- [ ] Rollback script prepared
- [ ] Application tests pass
- [ ] Performance impact assessed
- [ ] Downtime requirements communicated
- [ ] Rollback plan documented

## Common Migration Patterns

### Adding Columns with Defaults
```sql
-- Safe column addition
ALTER TABLE posts ADD COLUMN is_verified BOOLEAN DEFAULT false;
UPDATE posts SET is_verified = false WHERE is_verified IS NULL;
ALTER TABLE posts ALTER COLUMN is_verified SET NOT NULL;
```

### Index Management
```sql
-- Create index concurrently (non-blocking)
CREATE INDEX CONCURRENTLY idx_posts_created_at ON posts (created_at DESC);

-- Drop index safely
DROP INDEX CONCURRENTLY IF EXISTS idx_old_index;
```

### Data Type Changes
```sql
-- Safe data type change
ALTER TABLE users ADD COLUMN phone_new VARCHAR(20);
UPDATE users SET phone_new = phone::VARCHAR(20);
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users RENAME COLUMN phone_new TO phone;
```

## Emergency Procedures

### Migration Failure Recovery
1. **Stop application** to prevent data corruption
2. **Assess damage** - check database consistency
3. **Execute rollback** if available
4. **Restore from backup** if rollback fails
5. **Communicate** with stakeholders
6. **Document incident** for future prevention

### Contact Information
- **Lead DBA**: [Contact Info]
- **DevOps Team**: [Contact Info]
- **Application Owner**: [Contact Info]

## Migration Schedule

| Environment | Migration Window | Approval Required |
|-------------|------------------|-------------------|
| Development | Anytime | Self-approval |
| Staging | Business Hours | Tech Lead |
| Production | Maintenance Window | Change Advisory Board |

This migration strategy ensures safe, trackable, and reversible database changes.