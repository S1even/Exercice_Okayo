const express = require('express');
const { body, param } = require('express-validator');
const clientController = require('../controllers/clientController');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET - Liste des clients
router.get('/', clientController.getClients);

// GET - Détail d'un client
router.get('/:id', [
  param('id').isInt().withMessage('ID client invalide')
], handleValidationErrors, clientController.getClient);

// POST - Créer un client
router.post('/', [
  body('code_client').notEmpty().withMessage('Code client requis'),
  body('nom').notEmpty().withMessage('Nom requis'),
  body('adresse').notEmpty().withMessage('Adresse requise'),
  body('ville').notEmpty().withMessage('Ville requise'),
  body('code_postal').notEmpty().withMessage('Code postal requis'),
  body('email').optional().isEmail().withMessage('Email invalide')
], handleValidationErrors, clientController.createClient);

module.exports = router;