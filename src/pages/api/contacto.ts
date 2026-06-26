import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { nombre, direccion, whatsapp, nota } = body;

    // Validamos campos obligatorios del contacto
    if (!nombre || !whatsapp || !nota) {
      return new Response(JSON.stringify({ error: 'Todos los campos son obligatorios.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatIdContactos = process.env.TELEGRAM_CHAT_CONTACTOS; // Canal de solicitudes

    if (botToken && chatIdContactos) {
      // Formato limpio y estructurado para la directiva D7
      const mensajeTelegram = `🔔 *Nueva Solicitud de Contacto D7*\n\n` +
                        `👤 *Nombre:* ${nombre}\n` +
                        `📍 *Dirección:* ${direccion}\n` +
                        `📞 *WhatsApp:* ${whatsapp}\n\n` +
                        `📝 *Detalle de la Solicitud:*\n_${nota}_\n\n` +
                        `⚡ _Atención inmediata_`;

      // Despachamos al canal de contactos
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: chatIdContactos, 
          text: mensajeTelegram, 
          parse_mode: 'Markdown' 
        })
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};