import { MercadoPagoConfig, Payment } from 'mercadopago';
import {
  saveInscripcion,
  checkPaymentExists,
  getPendingParticipant,
  deletePendingParticipant
} from '../../lib/db.js';
import { MERCADOPAGO_ACCESS_TOKEN } from 'astro:env/server';

export async function POST({ request }) {
  try {
    const body = await request.json();

    console.log('Webhook recibido:', body);

    if (body.type !== 'payment') {
      return new Response(JSON.stringify({ message: 'Tipo de notificación no manejado' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const paymentId = body.data.id;

    const client = new MercadoPagoConfig({
      accessToken: MERCADOPAGO_ACCESS_TOKEN,
    });

    const payment = new Payment(client);

    const paymentInfo = await payment.get({ id: paymentId });

    console.log('Estado del pago:', paymentInfo.status);

    if (paymentInfo.status === 'approved') {
      const exists = await checkPaymentExists(paymentId.toString());

      if (exists) {
        console.log('Pago ya procesado anteriormente');
        return new Response(JSON.stringify({ message: 'Pago ya procesado' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const preferenceId = paymentInfo.metadata?.preference_id || paymentInfo.additional_info?.preference_id;

      // Obtener datos del participante desde Turso (persistente en serverless)
      const formData = await getPendingParticipant(preferenceId);

      if (!formData) {
        console.error('No se encontraron datos del formulario para este pago');
        return new Response(JSON.stringify({
          error: 'No se encontraron datos del formulario'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await saveInscripcion({
        ...formData,
        payment_id: paymentId.toString()
      });

      // Eliminar de participantes pendientes después de guardar en tabla final
      await deletePendingParticipant(preferenceId);

      console.log('Inscripción guardada exitosamente');
    }

    return new Response(JSON.stringify({ message: 'Webhook procesado' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en webhook:', error);
    return new Response(JSON.stringify({
      error: 'Error al procesar webhook',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
