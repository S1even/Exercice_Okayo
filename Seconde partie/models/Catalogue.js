const { pool } = require('../config/db');

class Catalogue {
  // Récupérer le catalogue actuel
  static async getCurrent() {
    const [rows] = await pool.execute(`
      SELECT 
        c.id_catalogue,
        p.id_produit,
        p.nom_produit,
        p.description,
        c.prix_unitaire_ht,
        t.taux as taux_tva,
        c.date_debut,
        c.date_fin
      FROM Catalogue c
      JOIN Produit p ON c.id_produit = p.id_produit
      JOIN TVA t ON c.id_tva = t.id_tva
      WHERE c.date_fin IS NULL OR c.date_fin >= CURDATE()
      ORDER BY p.nom_produit
    `);
    return rows;
  }

  // Récupérer l'historique des prix d'un produit
  static async getProductHistory(productId) {
    const [rows] = await pool.execute(`
      SELECT 
        c.prix_unitaire_ht,
        t.taux as taux_tva,
        c.date_debut,
        c.date_fin
      FROM Catalogue c
      JOIN TVA t ON c.id_tva = t.id_tva
      WHERE c.id_produit = ?
      ORDER BY c.date_debut DESC
    `, [productId]);
    
    return rows;
  }

  // Récupérer les données d'un produit à une date donnée
  static async getProductAtDate(productId, date) {
    const [rows] = await pool.execute(`
      SELECT 
        p.nom_produit,
        c.prix_unitaire_ht,
        t.taux
      FROM Catalogue c
      JOIN Produit p ON c.id_produit = p.id_produit
      JOIN TVA t ON c.id_tva = t.id_tva
      WHERE c.id_produit = ? 
      AND ? BETWEEN c.date_debut AND IFNULL(c.date_fin, '9999-12-31')
    `, [productId, date]);
    
    return rows[0];
  }
}

module.exports = Catalogue;