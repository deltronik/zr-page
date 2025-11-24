import 'dotenv/config';
import { createClient } from '@libsql/client';
import { config } from './config.js';

// Inicializar cliente de Turso
const turso = createClient({
  url: config.turso.url,
  authToken: config.turso.authToken,
});

// Inicializar tablas
export async function initializeTables() {
  try {
    // Crear tabla para inscripciones de 3km
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS inscripciones_3km (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_apellido TEXT NOT NULL,
        dni TEXT NOT NULL,
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

export { turso };
