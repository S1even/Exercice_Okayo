const Facture = require('../models/facture');
const Client = require('../models/Client');

const factureController = {
  // GET - Liste des factures
  async getFactures(req, res) {
    try {
      const { page = 1, limit = 20, client_id } = req.query;
      const factures = await Facture.getAll(page, limit, client_id);
      res.json(factures);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  },

  // GET - Détail d'une facture
  async getFacture(req, res) {
    try {
      const facture = await Facture.getById(req.params.id);
      
      if (!facture) {
        return res.status(404).json({ error: 'Facture non trouvée' });
      }
      
      res.json(facture);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  },

  // POST - Créer une facture
  async createFacture(req, res) {
    try {
      const { id_client } = req.body;
      
      // Vérification que le client existe
      const clientExists = await Client.exists(id_client);
      if (!clientExists) {
        return res.status(404).json({ error: 'Client non trouvé' });
      }
      
      const result = await Facture.create(req.body);
      
      res.status(201).json({
        message: 'Facture créée avec succès',
        id_facture: result.id_facture,
        reference: result.reference
      });
      
    } catch (error) {
      if (error.message.includes('Duplicate entry')) {
        return res.status(409).json({ error: 'Référence de facture déjà existante' });
      }
      
      res.status(500).json({ error: 'Erreur lors de la création', details: error.message });
    }
  },

  // GET - Statistiques des factures
  async getStatistics(req, res) {
    try {
      const { annee = new Date().getFullYear(), mois } = req.query;
      const statistics = await Facture.getStatistics(annee, mois);
      res.json(statistics);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  }
};

module.exports = factureController;