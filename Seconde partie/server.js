// ==================================================
// API Gestion Factures Okayo - Serveur Principal
// ==================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import des routes
const clientRoutes = require('./routes/clientRoutes');
const factureRoutes = require('./routes/factureRoutes');
const produitRoutes = require('./routes/produitRoutes');
const catalogueRoutes = require('./routes/catalogueRoutes');
const statistiquesRoutes = require('./routes/statistiquesRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================================================
// MIDDLEWARES GLOBAUX
// ==================================================

app.use(express.json());
app.use(cors());

// ==================================================
// ROUTES PRINCIPALES
// ==================================================

app.use('/api/clients', clientRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/catalogue', catalogueRoutes);
app.use('/api/statistiques', statistiquesRoutes);

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
        'GET /api/produits/:id': 'Détail d\'un produit',
        'POST /api/produits': 'Créer un produit'
      },
      statistiques: {
        'GET /api/statistiques/factures': 'Statistiques des factures',
        'GET /api/statistiques/top-clients': 'Top clients par CA'
      }
    }
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Okayo Factures API'
  });
});

// ==================================================
// MIDDLEWARE DE GESTION DES ERREURS
// ==================================================

app.use(errorHandler);

// ==================================================
// DÉMARRAGE DU SERVEUR
// ==================================================

const startServer = async () => {
  try {
    // Test de la connexion à la base de données
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`Serveur API Okayo démarré sur le port ${PORT}`);
      console.log(`Documentation disponible sur http://localhost:${PORT}/api/docs`);
      console.log(`Health check disponible sur http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;