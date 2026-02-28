#!/bin/bash
# Backup Verification Script for Magna Coders
# This script verifies the integrity of database backups

set -e

# Configuration
LOG_FILE="/var/log/backup_verification.log"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Display usage
usage() {
    echo "Usage: $0 <backup_file> [options]"
    echo ""
    echo "Options:"
    echo "  -d, --database NAME    Test database name for restore verification"
    echo "  -v, --verbose          Verbose output"
    echo "  -h, --help            Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 backup.dump"
    echo "  $0 backup.dump --database test_db"
    exit 1
}

# Parse command line arguments
BACKUP_FILE=""
TEST_DB=""
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--database)
            TEST_DB="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            if [ -z "$BACKUP_FILE" ]; then
                BACKUP_FILE="$1"
            else
                error_exit "Unknown option: $1"
            fi
            shift
            ;;
    esac
done

if [ -z "$BACKUP_FILE" ]; then
    usage
fi

# Verify backup file exists
verify_file_exists() {
    if [ ! -f "$BACKUP_FILE" ]; then
        error_exit "Backup file does not exist: $BACKUP_FILE"
    fi

    if [ ! -r "$BACKUP_FILE" ]; then
        error_exit "Backup file is not readable: $BACKUP_FILE"
    fi
}

# Get file information
get_file_info() {
    local file_size
    local file_date
    local file_perms

    file_size=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")
    file_date=$(stat -f%Sm -t "%Y-%m-%d %H:%M:%S" "$BACKUP_FILE" 2>/dev/null || stat -c"%y" "$BACKUP_FILE" | cut -d'.' -f1)
    file_perms=$(stat -f%Lp "$BACKUP_FILE" 2>/dev/null || stat -c%a "$BACKUP_FILE")

    log "Backup file: $(basename "$BACKUP_FILE")"
    log "File size: $(numfmt --to=iec-i --suffix=B "$file_size")"
    log "Modified: $file_date"
    log "Permissions: $file_perms"
}

# Verify custom format backup
verify_custom_backup() {
    log "Verifying custom format backup..."

    if ! pg_restore --list "$BACKUP_FILE" >/dev/null 2>&1; then
        error_exit "Custom format backup is corrupted or invalid"
    fi

    # Get backup contents
    local toc
    toc=$(pg_restore --list "$BACKUP_FILE")

    local table_count
    local schema_count
    table_count=$(echo "$toc" | grep -c "^TABLE " || true)
    schema_count=$(echo "$toc" | grep -c "^SCHEMA " || true)

    log "✓ Custom format backup is valid"
    log "  Tables found: $table_count"
    log "  Schemas found: $schema_count"

    if [ "$VERBOSE" = true ]; then
        echo "$toc" | head -20
    fi
}

# Verify plain SQL backup
verify_sql_backup() {
    log "Verifying SQL format backup..."

    # Check if it's a valid PostgreSQL dump
    if ! head -n 5 "$BACKUP_FILE" | grep -q "PostgreSQL database dump"; then
        error_exit "Not a valid PostgreSQL SQL dump"
    fi

    # Count major objects
    local table_count
    local index_count
    local function_count
    table_count=$(grep -c "^CREATE TABLE " "$BACKUP_FILE" || true)
    index_count=$(grep -c "^CREATE INDEX " "$BACKUP_FILE" || true)
    function_count=$(grep -c "^CREATE FUNCTION " "$BACKUP_FILE" || true)

    log "✓ SQL format backup is valid"
    log "  Tables: $table_count"
    log "  Indexes: $index_count"
    log "  Functions: $function_count"
}

# Test restore (optional)
test_restore() {
    if [ -z "$TEST_DB" ]; then
        return 0
    fi

    log "Testing restore to database: $TEST_DB"

    # Create test database
    if ! createdb "$TEST_DB" 2>/dev/null; then
        log "Warning: Test database $TEST_DB already exists or creation failed"
    fi

    # Attempt restore
    local restore_start
    restore_start=$(date +%s)

    if [[ $BACKUP_FILE == *.dump ]]; then
        if pg_restore -d "$TEST_DB" --clean --if-exists "$BACKUP_FILE" >/dev/null 2>&1; then
            log "✓ Restore test successful"
        else
            log "✗ Restore test failed"
            return 1
        fi
    elif [[ $BACKUP_FILE == *.sql ]]; then
        if psql -d "$TEST_DB" -f "$BACKUP_FILE" >/dev/null 2>&1; then
            log "✓ Restore test successful"
        else
            log "✗ Restore test failed"
            return 1
        fi
    fi

    local restore_end
    restore_end=$(date +%s)
    local restore_time=$((restore_end - restore_start))

    log "Restore completed in ${restore_time}s"

    # Quick data validation
    local user_count
    local post_count
    user_count=$(psql -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    post_count=$(psql -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM posts;" 2>/dev/null || echo "0")

    log "Test database contents:"
    log "  Users: ${user_count// /}"
    log "  Posts: ${post_count// /}"

    # Clean up test database
    if dropdb "$TEST_DB" 2>/dev/null; then
        log "Test database cleaned up"
    fi
}

# Main verification process
main() {
    log "=== Starting Backup Verification ==="
    log "Backup file: $BACKUP_FILE"

    # Basic file checks
    verify_file_exists
    get_file_info

    # Format-specific verification
    if [[ $BACKUP_FILE == *.dump ]]; then
        verify_custom_backup
    elif [[ $BACKUP_FILE == *.sql ]]; then
        verify_sql_backup
    else
        error_exit "Unsupported backup format. Expected .dump or .sql file"
    fi

    # Optional restore test
    if [ -n "$TEST_DB" ]; then
        test_restore
    fi

    log "=== Backup Verification Completed Successfully ==="
}

# Run main function
main "$@"