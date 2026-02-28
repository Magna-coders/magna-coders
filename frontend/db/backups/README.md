# Database Backup Management

This directory contains database backup scripts, configurations, and recovery procedures for the Magna Coders platform.

## Backup Strategy

### Types of Backups

1. **Full Database Backup**
   - Complete snapshot of the entire database
   - Includes all tables, data, and schemas
   - Performed weekly during low-traffic periods

2. **Incremental Backup**
   - Backs up changes since the last full backup
   - More frequent (daily) and faster than full backups
   - Uses PostgreSQL's Write-Ahead Logging (WAL)

3. **Schema-Only Backup**
   - Backs up database structure without data
   - Useful for development environments
   - Quick restoration of empty database structure

## Backup Scripts

### Automated Backup Script (`automated_backup.sh`)
```bash
#!/bin/bash
# Automated backup script for Magna Coders database

BACKUP_DIR="/var/backups/magna_coders"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="magna_coders"
DB_USER="postgres"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Full database backup
pg_dump -U $DB_USER -h localhost -d $DB_NAME -F c -f $BACKUP_DIR/full_backup_$DATE.dump

# Schema-only backup
pg_dump -U $DB_USER -h localhost -d $DB_NAME -s -f $BACKUP_DIR/schema_backup_$DATE.sql

# Clean up old backups (keep last 30 days)
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Manual Backup Commands

```bash
# Full database backup
pg_dump -U postgres -h localhost -d magna_coders -F c -f full_backup.dump

# Schema-only backup
pg_dump -U postgres -h localhost -d magna_coders -s -f schema_backup.sql

# Specific table backup
pg_dump -U postgres -h localhost -d magna_coders -t users -f users_backup.sql

# Compressed backup
pg_dump -U postgres -h localhost -d magna_coders | gzip > backup.gz
```

## Backup Verification

### Verification Script (`verify_backup.sh`)
```bash
#!/bin/bash
# Verify backup integrity

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

echo "Verifying backup: $BACKUP_FILE"

# Check if file exists and is readable
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file does not exist"
    exit 1
fi

# Get file size
FILE_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")
echo "Backup file size: $FILE_SIZE bytes"

# Test backup integrity (for custom format)
if [[ $BACKUP_FILE == *.dump ]]; then
    pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✓ Backup integrity check passed"
    else
        echo "✗ Backup integrity check failed"
        exit 1
    fi
fi

echo "Backup verification completed successfully"
```

## Backup Rotation Strategy

### Retention Policy
- **Full Backups**: Retain for 30 days
- **Incremental Backups**: Retain for 7 days
- **Schema Backups**: Retain for 90 days
- **Archive**: Move backups older than retention period to cold storage

### Automated Cleanup
```bash
# Remove backups older than 30 days
find /var/backups/magna_coders -name "*.dump" -mtime +30 -delete

# Compress old backups before archiving
find /var/backups/magna_coders -name "*.dump" -mtime +7 -exec gzip {} \;
```

## Cloud Backup Integration

### AWS S3 Backup Upload
```bash
#!/bin/bash
# Upload backups to AWS S3

BACKUP_DIR="/var/backups/magna_coders"
S3_BUCKET="magna-coders-backups"

# Upload latest backup
LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.dump | head -1)
aws s3 cp $LATEST_BACKUP s3://$S3_BUCKET/

echo "Backup uploaded to S3: $(basename $LATEST_BACKUP)"
```

### Google Cloud Storage
```bash
#!/bin/bash
# Upload to Google Cloud Storage

BACKUP_FILE=$1
GCS_BUCKET="magna-coders-backups"

gsutil cp $BACKUP_FILE gs://$GCS_BUCKET/
```

## Backup Monitoring

### Monitoring Script (`monitor_backups.sh`)
```bash
#!/bin/bash
# Monitor backup status and send alerts

BACKUP_DIR="/var/backups/magna_coders"
THRESHOLD_HOURS=25  # Alert if no backup in last 25 hours

# Check for recent backups
LATEST_BACKUP=$(find $BACKUP_DIR -name "*.dump" -mtime -1 | wc -l)

if [ $LATEST_BACKUP -eq 0 ]; then
    echo "ALERT: No backup found in the last 24 hours!"
    # Send email alert or notification
    # curl -X POST -H 'Content-type: application/json' \
    #   --data '{"text":"Database backup alert: No recent backup found!"}' \
    #   $SLACK_WEBHOOK_URL
fi

# Check backup file sizes
find $BACKUP_DIR -name "*.dump" -exec ls -lh {} \; | awk '
BEGIN { total_size = 0; count = 0 }
{
    size = $5;
    if (size ~ /G/) { size = size * 1024 * 1024 * 1024 }
    else if (size ~ /M/) { size = size * 1024 * 1024 }
    else if (size ~ /K/) { size = size * 1024 }
    total_size += size;
    count++
}
END {
    if (count > 0) {
        avg_size = total_size / count;
        print "Average backup size:", avg_size / (1024*1024), "MB"
    }
}'
```

## Disaster Recovery Testing

### Recovery Test Checklist
- [ ] Schedule maintenance window
- [ ] Create test database instance
- [ ] Restore backup to test environment
- [ ] Verify data integrity
- [ ] Test application functionality
- [ ] Document recovery time
- [ ] Update recovery procedures if needed

### Recovery Time Objective (RTO)
- **Critical Data**: 4 hours
- **Important Data**: 24 hours
- **Archive Data**: 72 hours

### Recovery Point Objective (RPO)
- **Critical Data**: 1 hour data loss acceptable
- **Important Data**: 4 hours data loss acceptable
- **Archive Data**: 24 hours data loss acceptable

## Backup Security

### Encryption
```bash
# Encrypt backup before storage
openssl enc -aes-256-cbc -salt -in backup.dump -out backup.dump.enc -k $ENCRYPTION_KEY

# Decrypt backup for restore
openssl enc -d -aes-256-cbc -in backup.dump.enc -out backup.dump -k $ENCRYPTION_KEY
```

### Access Control
- Backups stored with restricted permissions (600)
- Separate credentials for backup operations
- Audit logging of backup access
- Encryption keys stored in secure vault

## Emergency Contacts

- **Database Administrator**: [Primary DBA Contact]
- **DevOps Lead**: [DevOps Contact]
- **System Administrator**: [SysAdmin Contact]
- **Management**: [Management Contact]

## Backup Schedule

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Full Backup | Weekly (Sunday 02:00) | 30 days | Local + Cloud |
| Incremental | Daily (02:00) | 7 days | Local |
| Schema | Weekly (Sunday 03:00) | 90 days | Local + Cloud |
| WAL Archive | Continuous | 7 days | Local |

## Monitoring and Alerts

### Nagios/Zabbix Integration
- Monitor backup job completion
- Alert on backup failures
- Track backup file sizes
- Monitor backup storage space

### Log Monitoring
```bash
# Monitor PostgreSQL logs for backup-related messages
tail -f /var/log/postgresql/postgresql.log | grep -i backup

# Monitor backup script logs
tail -f /var/log/backup.log
```

This backup strategy ensures data safety, quick recovery, and minimal downtime in case of database failures.