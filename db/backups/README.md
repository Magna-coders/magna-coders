# Database Backups

This directory is designated for database backup files.

## Structure
- Store database dumps and backups here
- Use descriptive naming: `magna_coders_backup_YYYYMMDD_HHMMSS.sql`
- Include both schema and data backups

## Backup Commands
```bash
# Create a full backup
pg_dump -h localhost -U username -d magna_coders_db > backups/magna_coders_backup_$(date +%Y%m%d_%H%M%S).sql

# Create schema-only backup
pg_dump -h localhost -U username -d magna_coders_db --schema-only > backups/magna_coders_schema_$(date +%Y%m%d_%H%M%S).sql

# Create data-only backup
pg_dump -h localhost -U username -d magna_coders_db --data-only > backups/magna_coders_data_$(date +%Y%m%d_%H%M%S).sql
```

## Restore Commands
```bash
# Restore from backup
psql -h localhost -U username -d magna_coders_db < backups/backup_file.sql
```