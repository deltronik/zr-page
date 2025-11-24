import 'dotenv/config';
import { createClient } from '@libsql/client';

// Script para verificar conexión con Turso y recrear tablas

const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function verificarYRecrearTablas() {
    console.log('🔍 Verificando conexión con Turso...');
    console.log('URL:', process.env.TURSO_DATABASE_URL);

    try {
        // Verificar conexión
        const testQuery = await turso.execute('SELECT 1 as test');
        console.log('✅ Conexión exitosa con Turso');

        // Listar tablas existentes
        console.log('\n📋 Verificando tablas existentes...');
        const tables = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

        console.log('Tablas encontradas:', tables.rows.map(r => r.name));

        // Eliminar tablas antiguas si existen
        console.log('\n🗑️  Eliminando tablas antiguas (si existen)...');
        try {
            await turso.execute('DROP TABLE IF EXISTS inscripciones_3km');
            await turso.execute('DROP TABLE IF EXISTS inscripciones_10km');
            console.log('✅ Tablas antiguas eliminadas');
        } catch (error) {
            console.log('ℹ️  No había tablas para eliminar');
        }

        // Crear tablas nuevas
        console.log('\n🔨 Creando tablas nuevas...');

        await turso.execute(`
      CREATE TABLE inscripciones_3km (
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
        console.log('✅ Tabla inscripciones_3km creada');

        await turso.execute(`
      CREATE TABLE inscripciones_10km (
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
        console.log('✅ Tabla inscripciones_10km creada');

        // Verificar tablas creadas
        console.log('\n📋 Verificando tablas creadas...');
        const newTables = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

        console.log('Tablas actuales:', newTables.rows.map(r => r.name));

        console.log('\n✅ ¡Base de datos lista para usar!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Detalles:', error);
        process.exit(1);
    }
}

verificarYRecrearTablas();
