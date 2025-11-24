import 'dotenv/config';
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function actualizarTablas() {
  console.log('🔨 Actualizando tablas para agregar campo "sexo"...');
  
  try {
    // Eliminar tablas existentes
    console.log('��️  Eliminando tablas antiguas...');
    await turso.execute('DROP TABLE IF EXISTS inscripciones_3km');
    await turso.execute('DROP TABLE IF EXISTS inscripciones_10km');
    
    // Crear tablas con campo sexo
    console.log('📝 Creando tabla inscripciones_3km con campo sexo...');
    await turso.execute(`
      CREATE TABLE inscripciones_3km (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_apellido TEXT NOT NULL,
        dni TEXT NOT NULL,
        sexo TEXT NOT NULL CHECK(sexo IN ('masculino', 'femenino')),
        fecha_nacimiento TEXT NOT NULL,
        edad INTEGER NOT NULL,
        team TEXT,
        ciudad TEXT NOT NULL,
        distancia TEXT NOT NULL,
        payment_id TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('📝 Creando tabla inscripciones_10km con campo sexo...');
    await turso.execute(`
      CREATE TABLE inscripciones_10km (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_apellido TEXT NOT NULL,
        dni TEXT NOT NULL,
        sexo TEXT NOT NULL CHECK(sexo IN ('masculino', 'femenino')),
        fecha_nacimiento TEXT NOT NULL,
        edad INTEGER NOT NULL,
        team TEXT,
        ciudad TEXT NOT NULL,
        distancia TEXT NOT NULL,
        payment_id TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tablas actualizadas exitosamente con campo sexo');
    
    // Verificar
    const tables = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE 'inscripciones_%'
      ORDER BY name
    `);
    
    console.log('📋 Tablas actuales:', tables.rows.map(r => r.name));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

actualizarTablas();
