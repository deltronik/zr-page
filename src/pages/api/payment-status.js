import { MercadoPagoConfig, Payment } from 'mercadopago';
import { config } from '../../lib/config.js';

export async function GET({ url }) {
  try {
    const paymentId = url.searchParams.get('payment_id');
    
    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'payment_id requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const client = new MercadoPagoConfig({
      accessToken: config.mercadoPago.accessToken,
    });

    const payment = new Payment(client);

    const paymentInfo = await payment.get({ id: paymentId });

    return new Response(JSON.stringify({
      status: paymentInfo.status,
      status_detail: paymentInfo.status_detail,
      payment_id: paymentInfo.id,
      amount: paymentInfo.transaction_amount,
      description: paymentInfo.description
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al obtener estado del pago:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al obtener estado del pago',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
