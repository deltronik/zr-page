// Configuración de variables de entorno
// En Astro, las variables de entorno deben accederse desde process.env en el servidor
export const config = {
    turso: {
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    },
    mercadoPago: {
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
        publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
    },
};
