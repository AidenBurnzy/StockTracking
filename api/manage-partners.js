import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // GET - List all partners
    if (req.method === 'GET') {
      const partners = await sql`
        SELECT id, name, display_name, color, total_invested, active, created_at
        FROM partners
        ORDER BY name
      `;
      return res.status(200).json(partners);
    }
    
    // POST - Add new partner
    if (req.method === 'POST') {
      const { name, display_name, color } = req.body;
      
      if (!name || !display_name) {
        return res.status(400).json({ error: 'Name and display_name are required' });
      }
      
      const result = await sql`
        INSERT INTO partners (name, display_name, color, total_invested, active)
        VALUES (${name.toLowerCase()}, ${display_name}, ${color || 'blue'}, 0.00, true)
        RETURNING id, name, display_name, color, total_invested, active
      `;
      
      return res.status(201).json(result[0]);
    }
    
    // PUT - Update partner
    if (req.method === 'PUT') {
      const { id, display_name, color, active } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Partner ID is required' });
      }
      
      const result = await sql`
        UPDATE partners
        SET 
          display_name = COALESCE(${display_name}, display_name),
          color = COALESCE(${color}, color),
          active = COALESCE(${active}, active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id, name, display_name, color, total_invested, active
      `;
      
      return res.status(200).json(result[0]);
    }
    
    // DELETE - Hard delete partner permanently
    if (req.method === 'DELETE') {
      const { id, permanent } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Partner ID is required' });
      }
      
      if (permanent) {
        // Permanent delete - remove from database
        await sql`
          DELETE FROM partners
          WHERE id = ${id}
        `;
      } else {
        // Soft delete - mark inactive
        await sql`
          UPDATE partners
          SET active = false, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
        `;
      }
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Error managing partners:', error);
    return res.status(500).json({ error: 'Failed to manage partners', details: error.message });
  }
}
