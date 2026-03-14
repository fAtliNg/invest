import { query } from './db';

const MAX_DIGEST_ENTRIES = 50;

/**
 * Generate a unified digest text — last 50 entries, no dates.
 * Older entries beyond 50 are auto-deleted.
 */
export async function generateDigestText(): Promise<string> {
    const result = await query(
        `SELECT id, content
     FROM news_digest
     ORDER BY created_at DESC
     LIMIT $1`,
        [MAX_DIGEST_ENTRIES]
    );

    if (result.rows.length === 0) {
        return '';
    }

    // Delete entries older than the 50th
    await query(
        `DELETE FROM news_digest
     WHERE id NOT IN (
       SELECT id FROM news_digest ORDER BY created_at DESC LIMIT $1
     )`,
        [MAX_DIGEST_ENTRIES]
    );

    return result.rows.map((r: any) => r.content).join('\n\n');
}
