// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
    output: 'server',
    adapter: vercel(),
    env: {
        schema: {
            // Variables de Turso (solo servidor)
            TURSO_DATABASE_URL: envField.string({
                context: 'server',
                access: 'secret',
            }),
            TURSO_AUTH_TOKEN: envField.string({
                context: 'server',
                access: 'secret',
            }),
            // Variables de Mercado Pago (solo servidor)
            MERCADOPAGO_ACCESS_TOKEN: envField.string({
                context: 'server',
                access: 'secret',
            }),
            MERCADOPAGO_PUBLIC_KEY: envField.string({
                context: 'server',
                access: 'secret',
            }),
        }
    }
});
