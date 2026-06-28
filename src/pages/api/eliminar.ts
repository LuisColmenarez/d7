export const prerender = false;
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  const token = url.searchParams.get('token');

  if (!id || isNaN(parseInt(id))) {
    return new Response('ID inválido', { status: 400 });
  }

  if (token !== import.meta.env.SECRET_TOKEN) {
    return new Response('Acceso denegado', { status: 403 });
  }

  const { error } = await supabase.rpc('eliminar_respuesta', { id_objetivo: parseInt(id) });

  if (error) {
    return new Response('Error al eliminar: ' + error.message, { status: 500 });
  }

  return new Response('Comentario eliminado correctamente.', { status: 200 });
};