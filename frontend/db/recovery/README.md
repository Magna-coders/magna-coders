# Database Recovery

This directory contains scripts and procedures for database recovery operations.

## Files Structure

- `recovery_scripts/` - Automated recovery scripts
- `manual_procedures/` - Step-by-step recovery guides
- `point_in_time_recovery.sql` - PITR recovery scripts
- `disaster_recovery_plan.md` - Comprehensive DR plan

## Recovery Types

### 1. Point-in-Time Recovery (PITR)
- Recover to a specific timestamp
- Useful for accidental data deletion/modification

### 2. Full Database Recovery
- Complete database restoration from backup
- Used in case of total database failure

### 3. Partial Recovery
- Recover specific tables or schemas
- Minimal downtime approach

## Usage

```bash
# Point-in-time recovery
psql -h localhost -U postgres -d magna_coders -f recovery/point_in_time_recovery.sql

# Full recovery
pg_restore -h localhost -U postgres -d magna_coders backups/full_backup.dump
```

## Emergency Contacts

- Database Administrator: [Contact Info]
- System Administrator: [Contact Info]
- DevOps Team: [Contact Info]