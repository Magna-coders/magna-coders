#!/bin/bash
# Automated Database Backup Script for Magna Coders
# This script performs automated backups of the PostgreSQL database

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/var/backups/magna_coders"
LOG_FILE="/var/log/backup.log"
DB_NAME="magna_coders"
DB_USER="postgres"
DB_HOST="localhost"
RETENTION_DAYS=30
S3_BUCKET="${S3_BUCKET:-magna_coders_backups}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check if PostgreSQL is running
check_postgres() {
    if ! pg_isready -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        error_exit "PostgreSQL is not running or not accessible"
    fi
}

# Create full database backup
create_full_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/full_backup_$timestamp.dump"

    log "Starting full database backup: $backup_file"

    if pg_dump -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -F c -f "$backup_file"; then
        log "Full backup completed successfully: $(basename "$backup_file")"

        # Get backup size
        local size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
        log "Backup size: $(numfmt --to=iec-i --suffix=B "$size")"

        echo "$backup_file"
    else
        error_exit "Full backup failed"
    fi
}

# Create schema-only backup
create_schema_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local schema_file="$BACKUP_DIR/schema_backup_$timestamp.sql"

    log "Starting schema backup: $schema_file"

    if pg_dump -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -s -f "$schema_file"; then
        log "Schema backup completed successfully: $(basename "$schema_file")"
        echo "$schema_file"
    else
        error_exit "Schema backup failed"
    fi
}

# Upload to cloud storage (if configured)
upload_to_cloud() {
    local backup_file="$1"

    # AWS S3 upload
    if command -v aws >/dev/null 2>&1 && [ -n "$AWS_ACCESS_KEY_ID" ]; then
        log "Uploading to AWS S3: $(basename "$backup_file")"
        if aws s3 cp "$backup_file" "s3://$S3_BUCKET/$(basename "$backup_file")"; then
            log "S3 upload completed successfully"
        else
            log "WARNING: S3 upload failed"
        fi
    fi

    # Google Cloud Storage upload
    if command -v gsutil >/dev/null 2>&1 && [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        log "Uploading to Google Cloud Storage: $(basename "$backup_file")"
        if gsutil cp "$backup_file" "gs://$S3_BUCKET/$(basename "$backup_file")"; then
            log "GCS upload completed successfully"
        else
            log "WARNING: GCS upload failed"
        fi
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days"

    # Remove old dump files
    local old_dumps=$(find "$BACKUP_DIR" -name "*.dump" -mtime +"$RETENTION_DAYS" -type f)
    if [ -n "$old_dumps" ]; then
        echo "$old_dumps" | while read -r file; do
            log "Removing old backup: $(basename "$file")"
            rm -f "$file"
        done
    fi

    # Remove old schema files
    local old_schemas=$(find "$BACKUP_DIR" -name "*.sql" -mtime +"$((RETENTION_DAYS * 3))" -type f)
    if [ -n "$old_schemas" ]; then
        echo "$old_schemas" | while read -r file; do
            log "Removing old schema backup: $(basename "$file")"
            rm -f "$file"
        done
    fi

    # Compress old backups before archiving (7+ days old)
    find "$BACKUP_DIR" -name "*.dump" -mtime +7 ! -name "*.gz" -exec gzip {} \; 2>/dev/null || true
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"

    log "Verifying backup integrity: $(basename "$backup_file")"

    if [[ $backup_file == *.dump ]]; then
        if pg_restore --list "$backup_file" >/dev/null 2>&1; then
            log "✓ Backup integrity check passed"
            return 0
        else
            log "✗ Backup integrity check failed"
            return 1
        fi
    elif [[ $backup_file == *.sql ]]; then
        if head -n 10 "$backup_file" | grep -q "PostgreSQL database dump"; then
            log "✓ Schema backup integrity check passed"
            return 0
        else
            log "✗ Schema backup integrity check failed"
            return 1
        fi
    fi
}

# Send notification (if webhook configured)
send_notification() {
    local message="$1"
    local status="${2:-info}"

    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
          --data "{\"text\":\"Database Backup [$status]: $message\"}" \
          "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi

    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
          --data "{\"content\":\"Database Backup [$status]: $message\"}" \
          "$DISCORD_WEBHOOK_URL" 2>/dev/null || true
    fi
}

# Main backup process
main() {
    log "=== Starting Magna Coders Database Backup ==="

    # Pre-flight checks
    check_postgres

    # Create backups
    local full_backup=""
    local schema_backup=""

    full_backup=$(create_full_backup)
    schema_backup=$(create_schema_backup)

    # Verify backups
    if verify_backup "$full_backup" && verify_backup "$schema_backup"; then
        log "✓ All backups verified successfully"

        # Upload to cloud
        upload_to_cloud "$full_backup"
        upload_to_cloud "$schema_backup"

        # Send success notification
        send_notification "Backup completed successfully. Full: $(basename "$full_backup"), Schema: $(basename "$schema_backup")" "success"

    else
        error_exit "Backup verification failed"
    fi

    # Cleanup old backups
    cleanup_old_backups

    # Final status
    local backup_count=$(find "$BACKUP_DIR" -name "*.dump" -o -name "*.sql" | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)

    log "=== Backup Summary ==="
    log "Total backups: $backup_count"
    log "Backup directory size: $total_size"
    log "Retention policy: $RETENTION_DAYS days"
    log "=== Backup Process Completed ==="
}

# Run main function
main "$@"