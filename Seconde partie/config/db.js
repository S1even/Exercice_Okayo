const mysql = require('mysql2/promise');

// Configuration base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'okayo_factures',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de connexions
const pool = mysql.createPool(dbConfig);

// Test de connexion
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Base de données connectée');
    connection.release();
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };