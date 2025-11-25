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
    
    const capital = await sql`
      SELECT person, total_invested, updated_at
      FROM capital
      ORDER BY person
    `;

    return res.status(200).json(capital);
  } catch (error) {
    console.error('Error fetching capital:', error);
    return res.status(500).json({ error: 'Failed to fetch capital data' });
  }
}
