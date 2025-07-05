const Client = require('../models/Client');

const clientController = {
  // GET - Liste des clients
  async getClients(req, res) {
    try {
      const clients = await Client.getAll();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  },

  // GET - Détail d'un client
  async getClient(req, res) {
    try {
      const client = await Client.getById(req.params.id);
      
      if (!client) {
        return res.status(404).json({ error: 'Client non trouvé' });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  },

  // POST - Créer un client
  async createClient(req, res) {
    try {
      const clientId = await Client.create(req.body);
      
      res.status(201).json({ 
        message: 'Client créé avec succès',
        id_client: clientId 
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Code client déjà existant' });
      }
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  },

  // GET - Top clients par chiffre d'affaires
  async getTopClients(req, res) {
    try {
      const { limit = 10 } = req.query;
      const topClients = await Client.getTopClients(limit);
      res.json(topClients);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
  }
};

module.exports = clientController;