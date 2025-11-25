import { neon } from '@neondatabase/serverless';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { person, amount } = JSON.parse(event.body);

    // Update capital
    const result = await sql`
      UPDATE capital 
      SET 
        total_invested = total_invested + ${amount},
        updated_at = CURRENT_TIMESTAMP
      WHERE person = ${person}
      RETURNING *
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result[0])
    };
  } catch (error) {
    console.error('Error updating capital:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update capital' })
    };
  }
}
