const { pool } = require('../config/db');

class Facture {
  // Récupérer les factures avec pagination
  static async getAll(page = 1, limit = 20, clientId = null) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        f.id_facture,
        f.reference,
        f.date_facturation,
        f.date_echeance,
        c.nom as nom_client,
        c.code_client,
        f.total_ht,
        f.total_ttc
      FROM Facture f
      JOIN Client c ON f.id_client = c.id_client
    `;
    
    const params = [];
    
    if (clientId) {
      query += ' WHERE f.id_client = ?';
      params.push(clientId);
    }
    
    query += ' ORDER BY f.date_facturation DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Récupérer une facture par ID avec ses lignes
  static async getById(id) {
    // Récupération des données de la facture
    const [factureRows] = await pool.execute(`
      SELECT 
        f.*,
        c.nom as nom_client,
        c.adresse as adresse_client,
        c.ville as ville_client,
        c.code_postal as code_postal_client,
        e.nom as nom_emetteur,
        e.adresse as adresse_emetteur,
        e.ville as ville_emetteur,
        e.code_postal as code_postal_emetteur,
        e.telephone as telephone_emetteur,
        e.web as web_emetteur,
        e.siret,
        e.tva_intracommunautaire,
        cr.libelle as condition_reglement,
        ib.nom_banque,
        ib.nom_proprietaire,
        ib.iban,
        ib.bic
      FROM Facture f
      JOIN Client c ON f.id_client = c.id_client
      JOIN Emetteur e ON f.id_emetteur = e.id_emetteur
      JOIN ConditionReglement cr ON f.id_condition_reglement = cr.id_condition
      JOIN InformationBancaire ib ON f.id_compte_bancaire = ib.id_compte
      WHERE f.id_facture = ?
    `, [id]);
    
    if (factureRows.length === 0) {
      return null;
    }
    
    // Récupération des lignes de facture
    const [lignesRows] = await pool.execute(`
      SELECT 
        designation,
        quantite,
        prix_unitaire_ht,
        taux_tva,
        total_ht_ligne,
        total_tva_ligne,
        numero_ligne
      FROM LigneFacture
      WHERE id_facture = ?
      ORDER BY numero_ligne
    `, [id]);
    
    const facture = factureRows[0];
    facture.lignes = lignesRows;
    
    return facture;
  }

  // Créer une nouvelle facture
  static async create(factureData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { reference, date_facturation, date_echeance, id_client, lignes } = factureData;
      
      // Récupération des données d'émetteur et compte par défaut
      const [emetteurRows] = await connection.execute(
        'SELECT id_emetteur FROM Emetteur LIMIT 1'
      );
      
      const [conditionRows] = await connection.execute(
        'SELECT id_condition FROM ConditionReglement LIMIT 1'
      );
      
      const [compteRows] = await connection.execute(
        'SELECT id_compte FROM InformationBancaire WHERE date_fin IS NULL LIMIT 1'
      );
      
      // Création de la facture
      const [factureResult] = await connection.execute(`
        INSERT INTO Facture (reference, date_facturation, date_echeance, id_client, 
                            id_emetteur, id_condition_reglement, id_compte_bancaire)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [reference, date_facturation, date_echeance, id_client, 
          emetteurRows[0].id_emetteur, conditionRows[0].id_condition, compteRows[0].id_compte]);
      
      const id_facture = factureResult.insertId;
      
      // Création des lignes de facture
      for (let i = 0; i < lignes.length; i++) {
        const ligne = lignes[i];
        
        // Récupération des données du catalogue à la date de facturation
        const [catalogueRows] = await connection.execute(`
          SELECT 
            p.nom_produit,
            c.prix_unitaire_ht,
            t.taux
          FROM Catalogue c
          JOIN Produit p ON c.id_produit = p.id_produit
          JOIN TVA t ON c.id_tva = t.id_tva
          WHERE c.id_produit = ? 
          AND ? BETWEEN c.date_debut AND IFNULL(c.date_fin, '9999-12-31')
        `, [ligne.id_produit, date_facturation]);
        
        if (catalogueRows.length === 0) {
          throw new Error(`Produit ${ligne.id_produit} non disponible à cette date`);
        }
        
        const catalogueData = catalogueRows[0];
        
        // Utilisation de la procédure stockée pour créer la ligne
        await connection.execute(`
          CALL sp_ajouter_ligne_facture(?, ?, ?, ?, ?, ?)
        `, [
          id_facture,
          catalogueData.nom_produit,
          ligne.quantite,
          catalogueData.prix_unitaire_ht,
          catalogueData.taux,
          i + 1
        ]);
      }
      
      await connection.commit();
      
      return {
        id_facture,
        reference
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Statistiques des factures
  static async getStatistics(annee, mois = null) {
    let whereClause = 'WHERE YEAR(date_facturation) = ?';
    const params = [annee];
    
    if (mois) {
      whereClause += ' AND MONTH(date_facturation) = ?';
      params.push(mois);
    }
    
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as nombre_factures,
        SUM(total_ht) as total_ht,
        SUM(total_ttc) as total_ttc,
        AVG(total_ttc) as moyenne_ttc
      FROM Facture
      ${whereClause}
    `, params);
    
    return rows[0];
  }
}

module.exports = Facture;