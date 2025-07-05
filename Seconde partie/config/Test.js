// ==================================================
// API Gestion Factures Okayo
// ==================================================

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { body, validationResult, param } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Middleware
app.use(express.json());
app.use(cors());

// Middleware de validation des erreurs
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Données invalides', 
      details: errors.array() 
    });
  }
  next();
};

// ==================================================
// ROUTES - GESTION DES CLIENTS
// ==================================================

// GET - Liste des clients
app.get('/api/clients', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id_client, code_client, nom, adresse, ville, code_postal, 
             telephone, email, forme_juridique, date_creation
      FROM Client
      ORDER BY nom
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// GET - Détail d'un client
app.get('/api/clients/:id', [
  param('id').isInt().withMessage('ID client invalide')
], handleValidationErrors, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM Client WHERE id_client = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// POST - Créer un client
app.post('/api/clients', [
  body('code_client').notEmpty().withMessage('Code client requis'),
  body('nom').notEmpty().withMessage('Nom requis'),
  body('adresse').notEmpty().withMessage('Adresse requise'),
  body('ville').notEmpty().withMessage('Ville requise'),
  body('code_postal').notEmpty().withMessage('Code postal requis'),
  body('email').optional().isEmail().withMessage('Email invalide')
], handleValidationErrors, async (req, res) => {
  try {
    const { code_client, nom, adresse, ville, code_postal, telephone, email, forme_juridique } = req.body;
    
    const [result] = await pool.execute(`
      INSERT INTO Client (code_client, nom, adresse, ville, code_postal, telephone, email, forme_juridique)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [code_client, nom, adresse, ville, code_postal, telephone, email, forme_juridique]);
    
    res.status(201).json({ 
      message: 'Client créé avec succès',
      id_client: result.insertId 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Code client déjà existant' });
    }
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ==================================================
// ROUTES - GESTION DU CATALOGUE
// ==================================================

// GET - Catalogue actuel
app.get('/api/catalogue', async (req, res) => {
  try {
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
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// GET - Historique des prix d'un produit
app.get('/api/catalogue/produit/:id/historique', [
  param('id').isInt().withMessage('ID produit invalide')
], handleValidationErrors, async (req, res) => {
  try {
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
    `, [req.params.id]);
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ==================================================
// ROUTES - GESTION DES FACTURES
// ==================================================

// GET - Liste des factures
app.get('/api/factures', async (req, res) => {
  try {
    const { page = 1, limit = 20, client_id } = req.query;
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
    
    if (client_id) {
      query += ' WHERE f.id_client = ?';
      params.push(client_id);
    }
    
    query += ' ORDER BY f.date_facturation DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// GET - Détail d'une facture
app.get('/api/factures/:id', [
  param('id').isInt().withMessage('ID facture invalide')
], handleValidationErrors, async (req, res) => {
  try {
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
    `, [req.params.id]);
    
    if (factureRows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
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
    `, [req.params.id]);
    
    const facture = factureRows[0];
    facture.lignes = lignesRows;
    
    res.json(facture);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// POST - Créer une facture
app.post('/api/factures', [
  body('reference').notEmpty().withMessage('Référence requise'),
  body('date_facturation').isISO8601().withMessage('Date de facturation invalide'),
  body('date_echeance').isISO8601().withMessage('Date d\'échéance invalide'),
  body('id_client').isInt().withMessage('ID client invalide'),
  body('lignes').isArray({ min: 1 }).withMessage('Au moins une ligne requise'),
  body('lignes.*.id_produit').isInt().withMessage('ID produit invalide'),
  body('lignes.*.quantite').isNumeric().withMessage('Quantité invalide')
], handleValidationErrors, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { reference, date_facturation, date_echeance, id_client, lignes } = req.body;
    
    // Vérification que le client existe
    const [clientRows] = await connection.execute(
      'SELECT id_client FROM Client WHERE id_client = ?', 
      [id_client]
    );
    
    if (clientRows.length === 0) {
      throw new Error('Client non trouvé');
    }
    
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
    
    res.status(201).json({
      message: 'Facture créée avec succès',
      id_facture: id_facture,
      reference: reference
    });
    
  } catch (error) {
    await connection.rollback();
    
    if (error.message.includes('Duplicate entry')) {
      return res.status(409).json({ error: 'Référence de facture déjà existante' });
    }
    
    res.status(500).json({ error: 'Erreur lors de la création', details: error.message });
  } finally {
    connection.release();
  }
});

// ==================================================
// ROUTES - STATISTIQUES ET RAPPORTS
// ==================================================

// GET - Statistiques des factures
app.get('/api/statistiques/factures', async (req, res) => {
  try {
    const { annee = new Date().getFullYear(), mois } = req.query;
    
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
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// GET - Top clients par chiffre d'affaires
app.get('/api/statistiques/top-clients', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
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
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ==================================================
// ROUTES - GESTION DES PRODUITS
// ==================================================

// GET - Liste des produits
app.get('/api/produits', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id_produit, nom_produit, description, date_creation
      FROM Produit
      ORDER BY nom_produit
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// POST - Créer un produit
app.post('/api/produits', [
  body('nom_produit').notEmpty().withMessage('Nom du produit requis'),
  body('description').optional().isString(),
  body('prix_unitaire_ht').isFloat({ min: 0 }).withMessage('Prix unitaire invalide'),
  body('taux_tva').isFloat({ min: 0, max: 100 }).withMessage('Taux TVA invalide')
], handleValidationErrors, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { nom_produit, description, prix_unitaire_ht, taux_tva } = req.body;
    
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
    
    res.status(201).json({
      message: 'Produit créé avec succès',
      id_produit: id_produit
    });
    
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Erreur lors de la création', details: error.message });
  } finally {
    connection.release();
  }
});

// ==================================================
// MIDDLEWARE DE GESTION DES ERREURS
// ==================================================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// ==================================================
// DÉMARRAGE DU SERVEUR
// ==================================================

app.listen(PORT, () => {
  console.log(`🚀 Serveur API Okayo démarré sur le port ${PORT}`);
  console.log(`📖 Documentation disponible sur http://localhost:${PORT}/api/docs`);
});

// ==================================================
// ROUTE DE DOCUMENTATION
// ==================================================

app.get('/api/docs', (req, res) => {
  res.json({
    title: 'API Gestion Factures Okayo',
    version: '1.0.0',
    description: 'API pour la gestion des factures, clients, produits et statistiques',
    endpoints: {
      clients: {
        'GET /api/clients': 'Liste des clients',
        'GET /api/clients/:id': 'Détail d\'un client',
        'POST /api/clients': 'Créer un client'
      },
      catalogue: {
        'GET /api/catalogue': 'Catalogue actuel',
        'GET /api/catalogue/produit/:id/historique': 'Historique des prix d\'un produit'
      },
      factures: {
        'GET /api/factures': 'Liste des factures (avec pagination)',
        'GET /api/factures/:id': 'Détail d\'une facture',
        'POST /api/factures': 'Créer une facture'
      },
      produits: {
        'GET /api/produits': 'Liste des produits',
        'POST /api/produits': 'Créer un produit'
      },
      statistiques: {
        'GET /api/statistiques/factures': 'Statistiques des factures',
        'GET /api/statistiques/top-clients': 'Top clients par CA'
      }
    }
  });
});

module.exports = app;