import { neon } from '@neondatabase/serverless';

export async function handler(event) {
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = JSON.parse(event.body);

    // Delete entry (entry_partner_snapshots will cascade due to ON DELETE CASCADE)
    await sql`
      DELETE FROM entries 
      WHERE id = ${id}
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error deleting entry:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete entry' })
    };
  }
}
