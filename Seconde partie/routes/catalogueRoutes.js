const express = require('express');
const { param } = require('express-validator');
const catalogueController = require('../controllers/catalogueController');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET - Catalogue actuel
router.get('/', catalogueController.getCatalogue);

// GET - Historique des prix d'un produit
router.get('/produit/:id/historique', [
  param('id').isInt().withMessage('ID produit invalide')
], handleValidationErrors, catalogueController.getProductHistory);

module.exports = router;