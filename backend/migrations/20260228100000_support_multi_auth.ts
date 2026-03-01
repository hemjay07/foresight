import { Knex } from 'knex';

/**
 * Support multi-method auth (Twitter, email, wallet) via Privy.
 * - Make wallet_address nullable (email/Twitter users won't have one initially)
 * - Add email column for email login users
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    // Email login support
    table.string('email', 255).unique().nullable();
  });

  // Make wallet_address nullable — Knex .alter() doesn't reliably drop NOT NULL,
  // so use raw SQL
  await knex.raw('ALTER TABLE users ALTER COLUMN wallet_address DROP NOT NULL');
}

export async function down(knex: Knex): Promise<void> {
  // Restore NOT NULL (backfill nulls first to avoid failure)
  await knex.raw(
    "UPDATE users SET wallet_address = 'migrated_' || id WHERE wallet_address IS NULL"
  );
  await knex.raw('ALTER TABLE users ALTER COLUMN wallet_address SET NOT NULL');

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('email');
  });
}
