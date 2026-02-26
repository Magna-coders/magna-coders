# Database Monitoring

This directory contains database monitoring and health check scripts.

## Monitoring Scripts

### Health Checks
- `health_check.sql` - Basic database connectivity and performance checks
- `table_sizes.sql` - Monitor table sizes and growth
- `index_usage.sql` - Check index usage and effectiveness
- `connection_monitor.sql` - Monitor active connections and locks

### Performance Monitoring
- `slow_queries.sql` - Identify slow-running queries
- `blocking_queries.sql` - Find queries causing locks
- `vacuum_monitor.sql` - Monitor autovacuum and manual vacuum operations

### Alert Scripts
- `disk_space_alert.sql` - Monitor disk space usage
- `memory_usage.sql` - Check memory consumption
- `replication_status.sql` - Monitor replication health (if applicable)

## Usage

```bash
# Run health check
psql -h localhost -U postgres -d magna_coders -f monitoring/health_check.sql

# Monitor table sizes
psql -h localhost -U postgres -d magna_coders -f monitoring/table_sizes.sql

# Check slow queries (requires pg_stat_statements extension)
psql -h localhost -U postgres -d magna_coders -f monitoring/slow_queries.sql
```

## Automated Monitoring

For automated monitoring, consider using:
- pgBadger for log analysis
- pg_stat_statements for query performance
- Custom cron jobs running these scripts
- Integration with monitoring tools like Nagios, Zabbix, or Prometheus

## Key Metrics to Monitor

1. **Connection Pool**: Active/idle connections
2. **Performance**: Query execution time, cache hit ratio
3. **Storage**: Table sizes, index sizes, WAL size
4. **Replication**: Lag time, replication status
5. **Locks**: Blocking queries, lock waits
6. **Vacuum**: Auto-vacuum progress, bloat levels