import { MercadoPagoConfig, Payment } from 'mercadopago';
import {
  saveInscripcion,
  checkPaymentExists,
  getPendingParticipant,
  deletePendingParticipant
} from '../../lib/db.js';
import { MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET } from 'astro:env/server';
import crypto from 'crypto';

/**
 * Valida la firma del webhook de Mercado Pago
 * Según documentación: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
function validateWebhookSignature(request, body) {
  try {
    // Obtener headers necesarios
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');

    if (!xSignature || !xRequestId) {
      console.warn('Headers de firma no encontrados');
      return false;
    }

    // Extraer ts y v1 del header x-signature
    // Formato: "ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839"
    const parts = xSignature.split(',');
    let ts, hash;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    }

    if (!ts || !hash) {
      console.warn('Formato de x-signature inválido');
      return false;
    }

    // Obtener el ID del evento
    const dataId = body.data?.id;
    if (!dataId) {
      console.warn('data.id no encontrado en el body');
      return false;
    }

    // Construir el manifest según la documentación de Mercado Pago
    // Formato: "id:[data_id];request-id:[x-request-id];ts:[ts];"
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Generar HMAC SHA256
    const hmac = crypto.createHmac('sha256', MERCADOPAGO_WEBHOOK_SECRET);
    hmac.update(manifest);
    const generatedHash = hmac.digest('hex');

    // Comparar las firmas
    const isValid = generatedHash === hash;

    if (!isValid) {
      console.warn('Firma del webhook inválida');
      console.warn('Hash esperado:', hash);
      console.warn('Hash generado:', generatedHash);
    }

    return isValid;
  } catch (error) {
    console.error('Error al validar firma del webhook:', error);
    return false;
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();

    console.log('Webhook recibido:', body);

    // Validar firma del webhook
    const isValidSignature = validateWebhookSignature(request, body);
    if (!isValidSignature) {
      console.error('Firma del webhook inválida - posible intento de fraude');
      return new Response(JSON.stringify({ error: 'Firma inválida' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Firma del webhook validada correctamente');

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
