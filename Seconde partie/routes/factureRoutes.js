const express = require('express');
const { body, param } = require('express-validator');
const factureController = require('../controllers/factureController');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET - Liste des factures
router.get('/', factureController.getFactures);

// GET - Détail d'une facture
router.get('/:id', [
  param('id').isInt().withMessage('ID facture invalide')
], handleValidationErrors, factureController.getFacture);

// POST - Créer une facture
router.post('/', [
  body('reference').notEmpty().withMessage('Référence requise'),
  body('date_facturation').isISO8601().withMessage('Date de facturation invalide'),
  body('date_echeance').isISO8601().withMessage('Date d\'échéance invalide'),
  body('id_client').isInt().withMessage('ID client invalide'),
  body('lignes').isArray({ min: 1 }).withMessage('Au moins une ligne requise'),
  body('lignes.*.id_produit').isInt().withMessage('ID produit invalide'),
  body('lignes.*.quantite').isNumeric().withMessage('Quantité invalide')
], handleValidationErrors, factureController.createFacture);

module.exports = router;