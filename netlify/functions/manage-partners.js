import { neon } from '@neondatabase/serverless';

export async function handler(event) {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // GET - List all partners
    if (event.httpMethod === 'GET') {
      const partners = await sql`
        SELECT id, name, display_name, color, total_invested, active, created_at
        FROM partners
        ORDER BY name
      `;
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(partners)
      };
    }
    
    // POST - Add new partner
    if (event.httpMethod === 'POST') {
      const { name, display_name, color } = JSON.parse(event.body);
      
      if (!name || !display_name) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Name and display_name are required' })
        };
      }
      
      const result = await sql`
        INSERT INTO partners (name, display_name, color, total_invested, active)
        VALUES (${name.toLowerCase()}, ${display_name}, ${color || 'blue'}, 0.00, true)
        RETURNING id, name, display_name, color, total_invested, active
      `;
      
      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(result[0])
      };
    }
    
    // PUT - Update partner
    if (event.httpMethod === 'PUT') {
      const { id, display_name, color, active } = JSON.parse(event.body);
      
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Partner ID is required' })
        };
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
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(result[0])
      };
    }
    
    // DELETE - Hard delete partner permanently
    if (event.httpMethod === 'DELETE') {
      const { id, permanent } = JSON.parse(event.body);
      
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Partner ID is required' })
        };
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
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: true })
      };
    }
    
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
    
  } catch (error) {
    console.error('Error managing partners:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to manage partners', details: error.message })
    };
  }
}
