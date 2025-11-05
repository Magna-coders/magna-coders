import { prisma } from './prismaClient';

/**
 * Reset the database by truncating all tables in the public schema.
 * Safety guards:
 *  - Refuses to run when NODE_ENV === 'production' unless --yes is passed.
 *  - Requires either the CLI flag --yes or the env var CONFIRM_DB_RESET=true to proceed.
 *
 * Usage (dev):
 *   CONFIRM_DB_RESET=true npm run db:reset
 *   or
 *   npm run db:reset -- --yes
 */
export async function resetDatabase(opts: { force?: boolean } = {}) {
  const args = process.argv.slice(2);
  const yes = opts.force || args.includes('--yes') || process.env.CONFIRM_DB_RESET === 'true';

  if (process.env.NODE_ENV === 'production' && !yes) {
    throw new Error('Refusing to reset database in production. Set NODE_ENV or pass --yes to override.');
  }

  if (!yes) {
    throw new Error('Database reset must be confirmed. Pass --yes or set CONFIRM_DB_RESET=true');
  }

  console.log('Resetting database — truncating all tables in public schema (RESTART IDENTITY CASCADE)');

  // Postgres: loop over public tables and truncate each with cascade
  const sql = `DO $$ DECLARE r RECORD; BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%') LOOP
      EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
    END LOOP;
  END $$;`;

  try {
    // Use $executeRawUnsafe because the SQL contains identifiers built server-side
    // This will remove all data and reset sequences.
    // NOTE: ensure DATABASE_URL points to a development/test DB when running this.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await prisma.$executeRawUnsafe(sql as any);
    console.log('Database reset completed.');
  } catch (err) {
    console.error('Failed to reset database:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI entry
if (require.main === module) {
  (async () => {
    try {
      await resetDatabase();
      process.exit(0);
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  })();
}
