const express = require('express');
const factureController = require('../controllers/factureController');
const clientController = require('../controllers/clientController');

const router = express.Router();

// GET - Statistiques des factures
router.get('/factures', factureController.getStatistics);

// GET - Top clients par chiffre d'affaires
router.get('/top-clients', clientController.getTopClients);

module.exports = router;