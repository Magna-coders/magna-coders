-- Database Health Check Script for Magna Coders
-- Run this script regularly to monitor database health

-- Database Information
SELECT
    current_database() as database_name,
    current_user as current_user,
    version() as postgres_version,
    now() as check_time;

-- Connection Statistics
SELECT
    count(*) as total_connections,
    count(*) filter (where state = 'active') as active_connections,
    count(*) filter (where state = 'idle') as idle_connections,
    count(*) filter (where state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity
WHERE datname = current_database();

-- Database Size Information
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Table Row Counts
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Index Usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 10;

-- Cache Hit Ratio
SELECT
    'index hit rate' as metric,
    (sum(idx_blks_hit)) / nullif(sum(idx_blks_hit + idx_blks_read), 0) * 100 as ratio
FROM pg_stat_user_indexes
UNION ALL
SELECT
    'table hit rate' as metric,
    sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100 as ratio
FROM pg_statio_user_tables;

-- Long Running Queries (running > 30 seconds)
SELECT
    pid,
    now() - pg_stat_activity.query_start as duration,
    query,
    state
FROM pg_stat_activity
WHERE state = 'active'
    AND now() - pg_stat_activity.query_start > interval '30 seconds'
    AND datname = current_database()
ORDER BY duration DESC;

-- Locks Information
SELECT
    locktype,
    mode,
    granted,
    count(*) as lock_count
FROM pg_locks
WHERE datname = current_database()
GROUP BY locktype, mode, granted
ORDER BY locktype, mode;

-- Vacuum Statistics
SELECT
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    vacuum_count,
    autovacuum_count,
    n_dead_tup,
    n_live_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- WAL Information
SELECT
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) as wal_size,
    pg_walfile_name(pg_current_wal_lsn()) as current_wal_file;

-- Replication Status (if applicable)
SELECT
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) as lag_bytes
FROM pg_stat_replication;

-- Health Check Summary
DO $$
DECLARE
    active_conn INTEGER;
    dead_tuples INTEGER;
    cache_hit_ratio NUMERIC;
BEGIN
    SELECT count(*) INTO active_conn
    FROM pg_stat_activity
    WHERE state = 'active' AND datname = current_database();

    SELECT sum(n_dead_tup) INTO dead_tuples
    FROM pg_stat_user_tables;

    SELECT
        (sum(heap_blks_hit) + sum(idx_blks_hit)) /
        nullif(sum(heap_blks_hit) + sum(idx_blks_hit) + sum(heap_blks_read) + sum(idx_blks_read), 0) * 100
    INTO cache_hit_ratio
    FROM pg_statio_user_tables;

    RAISE NOTICE '=== DATABASE HEALTH SUMMARY ===';
    RAISE NOTICE 'Active Connections: %', active_conn;
    RAISE NOTICE 'Dead Tuples: %', dead_tuples;
    RAISE NOTICE 'Cache Hit Ratio: %%%', round(cache_hit_ratio, 2);

    IF active_conn > 50 THEN
        RAISE WARNING 'High number of active connections!';
    END IF;

    IF dead_tuples > 100000 THEN
        RAISE WARNING 'High number of dead tuples - consider vacuuming!';
    END IF;

    IF cache_hit_ratio < 95 THEN
        RAISE WARNING 'Low cache hit ratio - consider increasing shared_buffers!';
    END IF;

    RAISE NOTICE 'Health check completed at %', now();
END $$;