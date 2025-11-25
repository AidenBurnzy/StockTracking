import { neon } from '@neondatabase/serverless';

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    
    const capital = await sql`
      SELECT person, total_invested, updated_at
      FROM capital
      ORDER BY person
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(capital)
    };
  } catch (error) {
    console.error('Error fetching capital:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch capital data' })
    };
  }
}
