# Database Migrations

This directory contains SQL migration files for the magna-coders database.

## Structure
- Migration files should be named with timestamps: `YYYYMMDD_HHMMSS_description.sql`
- Each migration should be idempotent and reversible
- Include both UP and DOWN migration scripts

## Usage
- Apply migrations in chronological order
- Keep track of applied migrations
- Test migrations on development environment first

## Example Migration File Structure
```sql
-- UP Migration
-- Add your schema changes here

-- DOWN Migration (commented)
-- Add rollback commands here
```