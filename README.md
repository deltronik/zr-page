# Zenta Running - Sitio de Inscripción

Sitio web de inscripción para el evento Zenta Running con carreras de 3km y 10km.

## 🚀 Tecnologías

- **Framework**: Astro 5.16.0
- **Base de Datos**: Turso (LibSQL)
- **Pasarela de Pago**: Mercado Pago
- **Hosting**: Vercel

## 📦 Instalación Local

```bash
npm install
npm run dev
```

El sitio estará disponible en `http://localhost:4321`

## 🌐 Producción

Sitio desplegado en: `https://zentarunning.vercel.app`

## 📖 Documentación

- Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones de despliegue

## 🔧 Configuración

Copia `.env.example` a `.env` y completa con tus credenciales.

## 📝 Estructura

- `/` - Landing page (personalizable)
- `/inscripcion` - Formulario de inscripción
- `/success` - Página de pago exitoso
- `/failure` - Página de pago rechazado
- `/pending` - Página de pago pendiente
