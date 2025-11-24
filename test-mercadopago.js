import 'dotenv/config';
import { MercadoPagoConfig } from 'mercadopago';

// Script para verificar credenciales de Mercado Pago

console.log('🔍 Verificando credenciales de Mercado Pago...');
console.log('Public Key:', process.env.MERCADOPAGO_PUBLIC_KEY);
console.log('Access Token:', process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 20) + '...');

try {
    const client = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    });

    console.log('✅ Cliente de Mercado Pago configurado correctamente');
    console.log('ℹ️  Modo: Prueba (sandbox)');
    console.log('ℹ️  Checkout: Checkout Pro');

} catch (error) {
    console.error('❌ Error al configurar Mercado Pago:', error.message);
    process.exit(1);
}
