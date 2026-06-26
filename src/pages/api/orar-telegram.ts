export const prerender = false;
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Usando las variables con el prefijo PUBLIC_ que ya tienes configuradas
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const GET: APIRoute = async ({ request, redirect }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response('ID de petición no suministrado.', { status: 400 });
    }

    // 🚀 Usamos la misma función RPC que tienes en orar.ts
    const { error } = await supabase.rpc('incrementar_oracion', { row_id: id });

    if (error) {
      console.error('Error al ejecutar RPC en Telegram:', error);
      // Redirigimos igual para no dejar al usuario en una página de error
      return redirect('/?error=true', 303);
    }

    // 🎯 Éxito: Redirigimos al muro con el flag para el alert de confirmación
    return redirect(`/?orando=true&id=${id}`, 303);

  } catch (error: any) {
    console.error('Error crítico al procesar oración desde Telegram:', error);
    return redirect('/', 303);
  }
};