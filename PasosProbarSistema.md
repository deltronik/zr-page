# Guía: Probar Webhooks en Modo Sandbox de Mercado Pago

Esta guía explica cómo probar el sistema de webhooks de Mercado Pago en modo sandbox para verificar que las inscripciones se procesen correctamente.

## Paso 1: Crear Usuarios de Prueba

1. **Ir al panel de Mercado Pago**:
   - URL: https://www.mercadopago.com.ar/developers/panel/test-users

2. **Crear usuario VENDEDOR**:
   - Click en "Crear usuario de prueba"
   - Tipo: **Vendedor**
   - Guarda el email y contraseña que te genera

3. **Crear usuario COMPRADOR**:
   - Click en "Crear usuario de prueba" nuevamente
   - Tipo: **Comprador**
   - Guarda el email y contraseña que te genera

## Paso 2: Obtener Credenciales del Usuario Vendedor

1. **Iniciar sesión como vendedor**:
   - URL: https://www.mercadopago.com.ar/
   - Inicia sesión con el **email y contraseña del usuario vendedor de prueba**

2. **Obtener las credenciales**:
   - Ve a: https://www.mercadopago.com.ar/developers/panel/credentials
   - Copia las **credenciales de prueba** (Access Token y Public Key)
   - Estas son las que debes usar en tu `.env`

3. **Configurar webhook**:
   - Ve a: https://www.mercadopago.com.ar/developers/panel/webhooks
   - Configura la URL: `https://zentas.run/api/webhook`
   - Eventos: **Pagos**
   - **Importante**: Guarda la clave secreta que te dan aquí

## Paso 3: Actualizar Variables de Entorno

### En `.env` Local

```env
MERCADOPAGO_ACCESS_TOKEN=[Access Token del vendedor de prueba]
MERCADOPAGO_PUBLIC_KEY=[Public Key del vendedor de prueba]
MERCADOPAGO_WEBHOOK_SECRET=[Clave secreta del webhook del vendedor]
```

### En Vercel

1. Ve a: https://vercel.com/[tu-proyecto]/settings/environment-variables
2. Agrega las mismas 3 variables:
   - `MERCADOPAGO_ACCESS_TOKEN`
   - `MERCADOPAGO_PUBLIC_KEY`
   - `MERCADOPAGO_WEBHOOK_SECRET`
3. Selecciona: Production, Preview, Development

## Paso 4: Desplegar a Vercel

```bash
git add .
git commit -m "Actualizar credenciales de prueba"
git push
```

Vercel desplegará automáticamente.

## Paso 5: Hacer una Compra de Prueba

### ⚠️ IMPORTANTE: El Truco para que Funcione

**NO uses el simulador de Mercado Pago**. En su lugar:

1. **Ir a tu sitio en producción**:
   - URL: `https://zentas.run/inscripcion`

2. **Llenar el formulario** con datos de prueba:
   - Nombre: Juan Pérez
   - DNI: 12345678
   - Etc.

3. **Hacer click en "Pagar"**

4. **En la página de Mercado Pago**:
   - Usa el link de **producción** (el que te redirige automáticamente)
   - **NO uses el link de sandbox**
   - Esto es crucial porque los webhooks solo se envían desde producción

5. **Iniciar sesión como comprador**:
   - Usa el **email y contraseña del usuario comprador de prueba**

6. **Pagar con tarjeta de prueba**:
   - Tarjeta: `5031 7557 3453 0604` (Mastercard)
   - Vencimiento: Cualquier fecha futura (ej: `11/25`)
   - CVV: `123`
   - Nombre: APRO (para aprobación automática)
   - DNI: Cualquiera

## Paso 6: Verificar que Funcionó

### 1. Ver Logs en Vercel

- URL: https://vercel.com/[tu-proyecto]/logs
- Busca logs del webhook:

```
Webhook recibido: { type: 'payment', data: { id: '...' } }
✅ Firma del webhook validada correctamente
Estado del pago: approved
Inscripción guardada exitosamente
```

### 2. Verificar en Turso

- El participante debería haberse movido de `participantes_pendientes` a `inscripciones_3km` o `inscripciones_10km`
- Ya no debería estar en `participantes_pendientes`

### 3. Ver el Pago en Mercado Pago (Opcional)

- Inicia sesión como **vendedor de prueba** en: https://www.mercadopago.com.ar/
- Ve a "Actividad" → deberías ver el pago aprobado

## Tarjetas de Prueba

| Tarjeta | Número | CVV | Resultado |
|---------|--------|-----|-----------|
| Mastercard | `5031 7557 3453 0604` | `123` | ✅ Aprobado |
| Visa | `4509 9535 6623 3704` | `123` | ✅ Aprobado |
| Mastercard | `5031 4332 1540 6351` | `123` | ❌ Rechazado |
| Visa | `4074 5957 4557 7763` | `123` | ❌ Fondos insuficientes |

**Todas las tarjetas de prueba usan CVV: `123`**

**Nombres especiales**:
- `APRO` → Pago aprobado
- `CONT` → Pago pendiente
- `OTHE` → Rechazado por error general
- `CALL` → Rechazado con validación para autorizar
- `FUND` → Rechazado por fondos insuficientes
- `SECU` → Rechazado por código de seguridad inválido
- `EXPI` → Rechazado por fecha de expiración inválida
- `FORM` → Rechazado por error en formulario

## Resumen del Flujo

```
1. Usuario llena formulario → Datos en participantes_pendientes
2. Usuario hace click en "Pagar" → Redirige a Mercado Pago
3. Usuario paga con cuenta de prueba → Mercado Pago procesa
4. Mercado Pago envía webhook → Tu servidor recibe notificación
5. Webhook valida firma → Verifica autenticidad
6. Webhook procesa pago → Mueve datos a tabla final
7. Limpia pendientes → Elimina de participantes_pendientes
```

## Solución de Problemas

### El webhook no llega

- ✅ Verifica que la URL en Mercado Pago sea: `https://zentas.run/api/webhook`
- ✅ Asegúrate de estar usando credenciales del **vendedor de prueba**
- ✅ Compra desde **producción**, no desde sandbox
- ✅ Verifica que las variables de entorno estén en Vercel

### Error "Firma inválida"

- ✅ Verifica que `MERCADOPAGO_WEBHOOK_SECRET` esté configurada en Vercel
- ✅ Asegúrate de usar la clave secreta correcta del panel de webhooks

### Los datos no se mueven a la tabla final

- ✅ Revisa los logs de Vercel para ver errores
- ✅ Verifica que el `preference_id` coincida
- ✅ Comprueba que el estado del pago sea "approved"

## Notas Importantes

- ⚠️ El simulador de webhooks de Mercado Pago puede mostrar error 307, pero esto **NO significa que no funcione** en producción
- ✅ Los webhooks reales **SÍ funcionan** cuando usas el flujo de producción con usuarios de prueba
- 🔒 La validación de firma protege contra webhooks fraudulentos
- 📊 Puedes ver todos los pagos de prueba en el panel del vendedor de prueba

## Referencias

- Documentación oficial: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integrate-checkout-pro/web
- Usuarios de prueba: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-integration
- Tarjetas de prueba: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards
