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
    const { person, amount } = req.body;

    // Update capital
    const result = await sql`
      UPDATE capital 
      SET 
        total_invested = total_invested + ${amount},
        updated_at = CURRENT_TIMESTAMP
      WHERE person = ${person}
      RETURNING *
    `;

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error updating capital:', error);
    return res.status(500).json({ error: 'Failed to update capital' });
  }
}
