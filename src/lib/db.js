import { createClient } from '@libsql/client';
import { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } from 'astro:env/server';

// Inicializar cliente de Turso
const turso = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// Inicializar tablas
export async function initializeTables() {
  try {
    // Crear tabla para participantes pendientes (antes de confirmar pago)
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS participantes_pendientes (
        preference_id TEXT PRIMARY KEY,
        nombre_apellido TEXT NOT NULL,
        dni TEXT NOT NULL,
        sexo TEXT NOT NULL,
        fecha_nacimiento TEXT NOT NULL,
        edad INTEGER NOT NULL,
        team TEXT,
        ciudad TEXT NOT NULL,
        distancia TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla para inscripciones de 3km
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS inscripciones_3km (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_apellido TEXT NOT NULL,
        dni TEXT NOT NULL,
        sexo TEXT NOT NULL,
        edad INTEGER NOT NULL,
        fecha_nacimiento TEXT NOT NULL,
        team TEXT,
        ciudad TEXT NOT NULL,
        distancia TEXT NOT NULL,
        payment_id TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla para inscripciones de 10km
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS inscripciones_10km (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_apellido TEXT NOT NULL,
        dni TEXT NOT NULL,
        sexo TEXT NOT NULL,
        edad INTEGER NOT NULL,
        fecha_nacimiento TEXT NOT NULL,
        team TEXT,
        ciudad TEXT NOT NULL,
        distancia TEXT NOT NULL,
        payment_id TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tablas inicializadas correctamente');
  } catch (error) {
    console.error('Error al inicializar tablas:', error);
    throw error;
  }
}

// Guardar inscripción en la tabla correspondiente
export async function saveInscripcion(data) {
  const {
    nombre_apellido,
    dni,
    sexo,
    fecha_nacimiento,
    edad,
    team,
    ciudad,
    distancia,
    payment_id
  } = data;

  // Determinar en qué tabla guardar según la distancia
  const tableName = distancia === '3km' ? 'inscripciones_3km' : 'inscripciones_10km';

  try {
    await turso.execute({
      sql: `INSERT INTO ${tableName} 
            (nombre_apellido, dni, sexo, fecha_nacimiento, edad, team, ciudad, distancia, payment_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [nombre_apellido, dni, sexo, fecha_nacimiento, edad, team || null, ciudad, distancia, payment_id]
    });

    console.log(`Inscripción guardada en ${tableName} para payment_id: ${payment_id}`);
    return { success: true, table: tableName };
  } catch (error) {
    console.error('Error al guardar inscripción:', error);
    throw error;
  }
}

// Verificar si ya existe una inscripción con el payment_id
export async function checkPaymentExists(payment_id) {
  try {
    // Buscar en ambas tablas
    const result3km = await turso.execute({
      sql: 'SELECT * FROM inscripciones_3km WHERE payment_id = ?',
      args: [payment_id]
    });

    const result10km = await turso.execute({
      sql: 'SELECT * FROM inscripciones_10km WHERE payment_id = ?',
      args: [payment_id]
    });

    return result3km.rows.length > 0 || result10km.rows.length > 0;
  } catch (error) {
    console.error('Error al verificar payment_id:', error);
    return false;
  }
}

// ============================================
// Funciones para participantes pendientes
// ============================================

// Guardar participante pendiente (antes de confirmar pago)
export async function savePendingParticipant(preferenceId, formData) {
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

  try {
    await turso.execute({
      sql: `INSERT INTO participantes_pendientes 
            (preference_id, nombre_apellido, dni, sexo, fecha_nacimiento, edad, team, ciudad, distancia) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [preferenceId, nombre_apellido, dni, sexo, fecha_nacimiento, edad, team || null, ciudad, distancia]
    });

    console.log(`Participante pendiente guardado con preference_id: ${preferenceId}`);
    return { success: true };
  } catch (error) {
    console.error('Error al guardar participante pendiente:', error);
    throw error;
  }
}

// Obtener participante pendiente por preference_id
export async function getPendingParticipant(preferenceId) {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM participantes_pendientes WHERE preference_id = ?',
      args: [preferenceId]
    });

    if (result.rows.length === 0) {
      return null;
    }

    // Convertir el resultado a un objeto plano
    const row = result.rows[0];
    return {
      nombre_apellido: row.nombre_apellido,
      dni: row.dni,
      sexo: row.sexo,
      fecha_nacimiento: row.fecha_nacimiento,
      edad: row.edad,
      team: row.team,
      ciudad: row.ciudad,
      distancia: row.distancia
    };
  } catch (error) {
    console.error('Error al obtener participante pendiente:', error);
    throw error;
  }
}

// Eliminar participante pendiente después de procesar el pago
export async function deletePendingParticipant(preferenceId) {
  try {
    await turso.execute({
      sql: 'DELETE FROM participantes_pendientes WHERE preference_id = ?',
      args: [preferenceId]
    });

    console.log(`Participante pendiente eliminado: ${preferenceId}`);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar participante pendiente:', error);
    throw error;
  }
}

export { turso };
