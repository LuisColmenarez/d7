export const prerender = false;
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL || '',
  process.env.PUBLIC_SUPABASE_ANON_KEY || ''
);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { peticion_id, autor, contenido } = body;

    // Validación estructural básica
    if (!peticion_id || !contenido) {
      return new Response(JSON.stringify({ error: 'El ID de la petición y el contenido son obligatorios.' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Inserción en la base de datos a través de la API segura del servidor
    const { error } = await supabase
      .from('respuestas')
      .insert([
        { 
          peticion_id, 
          autor: autor || 'Anónimo', 
          contenido 
        }
      ]);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: 'Respuesta registrada.' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};