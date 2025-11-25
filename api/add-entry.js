import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const data = req.body;

    // Use provided entry_date or default to CURRENT_TIMESTAMP
    const entryDate = data.entry_date || null;

    const result = await sql`
      INSERT INTO entries (
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
      ) VALUES (
        COALESCE(${entryDate}::timestamp, CURRENT_TIMESTAMP),
        ${data.entry_type},
        ${data.portfolio_value},
        ${data.ticker || null},
        ${data.trade_type || null},
        ${data.contracts || null},
        ${data.notes || null},
        ${data.daily_pl || 0},
        ${data.capital_person || null},
        ${data.capital_amount || null},
        ${data.nick_capital},
        ${data.joey_capital},
        ${data.nick_ownership},
        ${data.joey_ownership},
        ${data.nick_value},
        ${data.joey_value},
        ${data.nick_pl},
        ${data.joey_pl}
      )
      RETURNING *
    `;

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error adding entry:', error);
    return res.status(500).json({ error: 'Failed to add entry', details: error.message });
  }
}
