const { pool } = require('../config/db');

class Client {
  // Récupérer tous les clients
  static async getAll() {
    const [rows] = await pool.execute(`
      SELECT id_client, code_client, nom, adresse, ville, code_postal, 
             telephone, email, forme_juridique, date_creation
      FROM Client
      ORDER BY nom
    `);
    return rows;
  }

  // Récupérer un client par ID
  static async getById(id) {
    const [rows] = await pool.execute(`
      SELECT * FROM Client WHERE id_client = ?
    `, [id]);
    return rows[0];
  }

  // Créer un nouveau client
  static async create(clientData) {
    const { code_client, nom, adresse, ville, code_postal, telephone, email, forme_juridique } = clientData;
    
    const [result] = await pool.execute(`
      INSERT INTO Client (code_client, nom, adresse, ville, code_postal, telephone, email, forme_juridique)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [code_client, nom, adresse, ville, code_postal, telephone, email, forme_juridique]);
    
    return result.insertId;
  }

  // Vérifier si un client existe
  static async exists(id) {
    const [rows] = await pool.execute(
      'SELECT id_client FROM Client WHERE id_client = ?', 
      [id]
    );
    return rows.length > 0;
  }

  // Statistiques des top clients
  static async getTopClients(limit = 10) {
    const [rows] = await pool.execute(`
      SELECT 
        c.nom,
        c.code_client,
        COUNT(f.id_facture) as nombre_factures,
        SUM(f.total_ttc) as chiffre_affaires
      FROM Client c
      JOIN Facture f ON c.id_client = f.id_client
      GROUP BY c.id_client
      ORDER BY chiffre_affaires DESC
      LIMIT ?
    `, [parseInt(limit)]);
    
    return rows;
  }
}

module.exports = Client;