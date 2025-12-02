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
    const data = JSON.parse(event.body);

    // Use provided entry_date or default to CURRENT_TIMESTAMP
    const entryDate = data.entry_date || null;

    // Extract nick/joey data from partners array (hybrid approach)
    let nickCapital = 0, joeyCapital = 0;
    let nickOwnership = 0, joeyOwnership = 0;
    let nickValue = 0, joeyValue = 0;
    let nickPL = 0, joeyPL = 0;

    if (data.partners && data.partners.length >= 2) {
      // Assuming partners[0] is nick (id:1) and partners[1] is joey (id:2)
      const nick = data.partners.find(p => p.partner_id === 1) || data.partners[0];
      const joey = data.partners.find(p => p.partner_id === 2) || data.partners[1];
      
      nickCapital = nick.capital;
      nickOwnership = nick.ownership;
      nickValue = nick.value;
      nickPL = nick.pl;
      
      joeyCapital = joey.capital;
      joeyOwnership = joey.ownership;
      joeyValue = joey.value;
      joeyPL = joey.pl;
    }

    // Insert into old schema with hardcoded nick/joey columns
    const entryResult = await sql`
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
        ${nickCapital},
        ${joeyCapital},
        ${nickOwnership},
        ${joeyOwnership},
        ${nickValue},
        ${joeyValue},
        ${nickPL},
        ${joeyPL}
      )
      RETURNING *
    `;

    const entry = entryResult[0];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(entry)
    };
  } catch (error) {
    console.error('Error adding entry:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to add entry', details: error.message })
    };
  }
}
