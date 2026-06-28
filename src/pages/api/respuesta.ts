export const prerender = false;
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { peticion_id, autor, contenido } = body;

    if (!peticion_id || !contenido) {
      return new Response(JSON.stringify({ error: 'Datos incompletos.' }), { status: 400 });
    }

    // 1. Insertar la respuesta en la base de datos
    const { data: respuesta, error: errorInsert } = await supabase
      .from('respuestas')
      .insert([{ peticion_id, autor, contenido }])
      .select('id')
      .single();

    if (errorInsert) throw errorInsert;

    // 2. Obtener el motivo de la petición original para el reporte
    const { data: peticionOriginal, error: errorPeticion } = await supabase
      .from('peticiones')
      .select('motivo, nombre')
      .eq('id', peticion_id)
      .single();

    // 3. Preparar y enviar notificación a Telegram
    const botToken = import.meta.env.TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.TELEGRAM_CHAT_RESPUESTAS;
    const urlBase = request.headers.get('origin') || import.meta.env.SITE_URL;
    const tokenSecreto = import.meta.env.SECRET_TOKEN;
    
    if (botToken && chatId) {
      const enlaceEliminar = `${urlBase}/api/eliminar?id=${respuesta.id}&token=${tokenSecreto}`;

      const mensajeTelegram = `💬 <b>Nueva Respuesta Registrada</b>\n\n` +
                              `📖 <b>Petición Original:</b> <i>"${peticionOriginal?.motivo || 'Motivo no encontrado'}"</i>\n` +
                              `👤 <b>Autor (Petición):</b> ${peticionOriginal?.nombre || 'Anónimo'}\n\n` +
                              `➖➖➖➖➖➖➖➖\n` +
                              `✍️ <b>Respuesta de:</b> ${autor || 'Anónimo'}\n` +
                              `📝 <b>Comentario:</b> ${contenido}\n\n` +
                              `🗑️ <b>Acción:</b> <a href="${enlaceEliminar}">Eliminar este comentario</a>\n\n` +
                              `⚡ <i>Enviado desde la Red de Soporte y Oración</i>`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: chatId, 
          text: mensajeTelegram, 
          parse_mode: 'HTML',
          disable_web_page_preview: true 
        })
      });
    }

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