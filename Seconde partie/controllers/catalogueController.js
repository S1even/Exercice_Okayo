const Catalogue = require('../models/Catalogue');

const catalogueController = {
  // GET - Catalogue actuel
  async getCatalogue(req, res) {
    try {
      const catalogue = await Catalogue.getCurrent();
      res.json(catalogue);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  },

  // GET - Historique des prix d'un produit
  async getProductHistory(req, res) {
    try {
      const history = await Catalogue.getProductHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  }
};

module.exports = catalogueController;