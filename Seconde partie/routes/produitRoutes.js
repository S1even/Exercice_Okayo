const express = require('express');
const { body, param } = require('express-validator');
const produitController = require('../controllers/produitController');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET - Liste des produits
router.get('/', produitController.getProduits);

// GET - Détail d'un produit
router.get('/:id', [
  param('id').isInt().withMessage('ID produit invalide')
], handleValidationErrors, produitController.getProduit);

// POST - Créer un produit
router.post('/', [
  body('nom_produit').notEmpty().withMessage('Nom du produit requis'),
  body('description').optional().isString(),
  body('prix_unitaire_ht').isFloat({ min: 0 }).withMessage('Prix unitaire invalide'),
  body('taux_tva').isFloat({ min: 0, max: 100 }).withMessage('Taux TVA invalide')
], handleValidationErrors, produitController.createProduit);

module.exports = router;