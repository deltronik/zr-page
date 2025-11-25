import { MercadoPagoConfig, Preference } from 'mercadopago';
import { MERCADOPAGO_ACCESS_TOKEN } from 'astro:env/server';
import { savePendingParticipant } from '../../lib/db.js';

export async function POST({ request }) {
  try {
    const formData = await request.json();

    const {
      nombre_apellido,
      dni,
      sexo,
      fecha_nacimiento,
      edad,
      team,
      ciudad,
      distancia
    } = formData;

    if (!nombre_apellido || !dni || !sexo || !fecha_nacimiento || !edad || !ciudad || !distancia) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const amount = distancia === '3km' ? 5000 : 15000;
    const description = `Inscripción Zenta Running - ${distancia}`;

    const client = new MercadoPagoConfig({
      accessToken: MERCADOPAGO_ACCESS_TOKEN,
    });

    const preference = new Preference(client);

    const preferenceData = {
      items: [
        {
          title: description,
          quantity: 1,
          unit_price: amount,
          currency_id: 'ARS',
        }
      ],
      back_urls: {
        success: `${new URL(request.url).origin}/success`,
        failure: `${new URL(request.url).origin}/failure`,
        pending: `${new URL(request.url).origin}/pending`,
      },
      notification_url: `${new URL(request.url).origin}/api/webhook`,
      metadata: {
        distancia: distancia
      }
    };

    const result = await preference.create({ body: preferenceData });

    // Guardar participante pendiente en Turso (persistente en serverless)
    await savePendingParticipant(result.id, formData);

    return new Response(JSON.stringify({
      init_point: result.init_point,
      preference_id: result.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al crear preferencia de pago:', error);
    return new Response(JSON.stringify({
      error: 'Error al procesar el pago',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
