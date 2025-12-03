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
    
    // Get entries from new schema
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
        created_at
      FROM entries
      ORDER BY entry_date DESC
      LIMIT 100
    `;

    // For each entry, get partner snapshots
    const entryIds = entries.map(e => e.id);
    let partnerSnapshots = [];
    if (entryIds.length > 0) {
      partnerSnapshots = await sql`
        SELECT entry_id, partner_name, capital, ownership, value, pl
        FROM entry_partner_snapshots
        WHERE entry_id = ANY(${entryIds})
      `;
    }

    // Attach partner snapshots to each entry
    const entryMap = {};
    entries.forEach(e => { entryMap[e.id] = { ...e, partners: [] }; });
    partnerSnapshots.forEach(snap => {
      if (entryMap[snap.entry_id]) {
        entryMap[snap.entry_id].partners.push({
          partner_name: snap.partner_name,
          capital: snap.capital,
          ownership: snap.ownership,
          value: snap.value,
          pl: snap.pl
        });
      }
    });

    const result = Object.values(entryMap);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching entries:', error);
    return res.status(500).json({ error: 'Failed to fetch entries' });
  }
}
