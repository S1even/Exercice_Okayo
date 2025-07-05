const Produit = require('../models/Produit');

const produitController = {
  // GET - Liste des produits
  async getProduits(req, res) {
    try {
      const produits = await Produit.getAll();
      res.json(produits);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  },

  // GET - Détail d'un produit
  async getProduit(req, res) {
    try {
      const produit = await Produit.getById(req.params.id);
      
      if (!produit) {
        return res.status(404).json({ error: 'Produit non trouvé' });
      }
      
      res.json(produit);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  },

  // POST - Créer un produit
  async createProduit(req, res) {
    try {
      const produitId = await Produit.create(req.body);
      
      res.status(201).json({
        message: 'Produit créé avec succès',
        id_produit: produitId
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la création', details: error.message });
    }
  }
};

module.exports = produitController;