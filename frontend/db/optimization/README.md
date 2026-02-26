# Database Optimization

This directory contains database optimization scripts and queries.

## Optimization Categories

### 1. Index Optimization
- `analyze_indexes.sql` - Analyze index usage and suggest improvements
- `create_indexes.sql` - Create additional indexes for better performance
- `unused_indexes.sql` - Identify and remove unused indexes

### 2. Query Optimization
- `slow_queries_analysis.sql` - Analyze slow queries and suggest fixes
- `query_rewrite.sql` - Query rewrite suggestions
- `explain_analyze.sql` - EXPLAIN ANALYZE examples for common queries

### 3. Table Optimization
- `vacuum_analyze.sql` - Vacuum and analyze scripts
- `reindex_tables.sql` - Reindex tables when needed
- `table_bloat_check.sql` - Check for table bloat

### 4. Configuration Optimization
- `postgresql_conf.sql` - PostgreSQL configuration recommendations
- `connection_pooling.sql` - Connection pooling setup

## Usage Examples

```bash
# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM posts WHERE author_id = $1;

# Check index usage
SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan DESC;

# Vacuum and analyze
VACUUM ANALYZE posts;

# Reindex table
REINDEX TABLE CONCURRENTLY posts;
```

## Performance Monitoring

### Key Metrics to Monitor:
1. **Query Execution Time**: Aim for <100ms for most queries
2. **Index Hit Ratio**: Should be >95%
3. **Cache Hit Ratio**: Should be >99%
4. **Connection Pool Utilization**: Keep under 80%
5. **Lock Waits**: Should be minimal

### Common Optimization Techniques:
1. **Indexing**: Create indexes on frequently queried columns
2. **Query Optimization**: Use EXPLAIN to analyze query plans
3. **Connection Pooling**: Use PgBouncer for connection management
4. **Partitioning**: Partition large tables by date/user
5. **Archiving**: Move old data to archive tables

## Automated Optimization

Consider setting up automated tasks:
- Daily vacuum and analyze
- Weekly reindexing
- Monthly performance reports
- Alert on slow queries (>5 seconds)