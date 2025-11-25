import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    return res.status(200).json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    return res.status(500).json({ error: 'Failed to fetch entries' });
  }
}
