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
    
    const entries = await sql`
      SELECT 
        id,
        entry_date,
        entry_type,
        portfolio_value,
        ticker,
        trade_type,
        contracts,
        notes,
        daily_pl,
        capital_person,
        capital_amount,
        nick_capital,
        joey_capital,
        nick_ownership,
        joey_ownership,
        nick_value,
        joey_value,
        nick_pl,
        joey_pl
      FROM entries
      ORDER BY entry_date DESC
      LIMIT 100
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(entries)
    };
  } catch (error) {
    console.error('Error fetching entries:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch entries' })
    };
  }
}
