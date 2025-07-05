const { pool } = require('../config/db');

class Produit {
  // Récupérer tous les produits
  static async getAll() {
    const [rows] = await pool.execute(`
      SELECT id_produit, nom_produit, description, date_creation
      FROM Produit
      ORDER BY nom_produit
    `);
    return rows;
  }

  // Récupérer un produit par ID
  static async getById(id) {
    const [rows] = await pool.execute(`
      SELECT * FROM Produit WHERE id_produit = ?
    `, [id]);
    return rows[0];
  }

  // Créer un nouveau produit avec son prix au catalogue
  static async create(produitData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { nom_produit, description, prix_unitaire_ht, taux_tva } = produitData;
      
      // Création du produit
      const [produitResult] = await connection.execute(`
        INSERT INTO Produit (nom_produit, description)
        VALUES (?, ?)
      `, [nom_produit, description]);
      
      const id_produit = produitResult.insertId;
      
      // Récupération de l'ID TVA correspondant
      const [tvaRows] = await connection.execute(`
        SELECT id_tva FROM TVA 
        WHERE taux = ? AND (date_fin IS NULL OR date_fin >= CURDATE())
        LIMIT 1
      `, [taux_tva]);
      
      if (tvaRows.length === 0) {
        throw new Error('Taux de TVA non trouvé');
      }
      
      // Ajout au catalogue
      await connection.execute(`
        INSERT INTO Catalogue (id_produit, prix_unitaire_ht, id_tva, date_debut)
        VALUES (?, ?, ?, CURDATE())
      `, [id_produit, prix_unitaire_ht, tvaRows[0].id_tva]);
      
      await connection.commit();
      
      return id_produit;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Produit;