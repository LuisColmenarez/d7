export const prerender = false;
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { nombre, emocion, motivo, ciudad_sector, contacto_whatsapp, iglesia } = body;

    if (!emocion || !motivo || !ciudad_sector) {
      return new Response(JSON.stringify({ error: 'La emoción, el motivo y la ubicación son campos obligatorios.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ipUsuario = request.headers.get('x-forwarded-for')?.split(',')[0] 
                      || request.headers.get('x-real-ip') 
                      || 'Desconocida';

    const { data: nuevaPeticion, error: dbError } = await supabase
      .from('peticiones')
      .insert([
        {
          nombre: nombre || 'Anónimo',
          emocion,
          motivo,
          ciudad_sector: ciudad_sector || 'No especificado',
          contacto_whatsapp: contacto_whatsapp || '',
          iglesia: iglesia || 'Ninguna / No especifica',
          ip_usuario: ipUsuario
        }
      ])
      .select()
      .single();

    if (dbError) throw new Error(`Error Supabase DB: ${dbError.message}`);

    const idPeticion = nuevaPeticion.id;
    const botToken = import.meta.env.TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.TELEGRAM_CHAT_PETICIONES;

    const urlBase = request.headers.get('origin') || 'https://tu-dominio-oficial.com';
    if (botToken && chatId) {
      const enlaceOrar = `${urlBase}/api/orar-telegram?id=${idPeticion}`;
      console.log("🔗 Enlace generado para Telegram:", enlaceOrar);
      const mensajeTelegram = `🇻🇪 <b>Nueva Petición Nacional</b>\n\n` +
                              `🏢 <b>Ubicación:</b> ${ciudad_sector}\n` +
                              `👤 <b>Nombre:</b> ${nombre || 'Anónimo'}\n` +
                              `⛪ <b>Iglesia:</b> ${iglesia || 'Ninguna / No especifica'}\n` +
                              `🎭 <b>Se siente:</b> ${emocion}\n` +
                              `📝 <b>Motivo:</b> ${motivo}\n` +
                              `📞 <b>Contacto:</b> ${contacto_whatsapp || 'Ninguno'}\n\n` +
                              `🙏 <b>Para orar por esta petición, abre este enlace:</b>\n` +
                              `${enlaceOrar}\n\n` +
                              `⚡ <i>Enviado desde la Red de Soporte y Oración</i>`;

      try {
        const respuestaTelegram = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: chatId, 
            text: mensajeTelegram, 
            parse_mode: 'HTML'
          })
        });

        const resultadoJson = await respuestaTelegram.json();
        
        if (!respuestaTelegram.ok) {
          console.error("❌ Error HTTP en Telegram:", respuestaTelegram.status);
        }

      } catch (err) {
        console.error("❌ Fallo crítico al intentar conectar con la API de Telegram:", err);
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Oración registrada.' }), {
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