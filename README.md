# API Gestion Factures Okayo


## Structure de la seconde partie

```
/Seconde partie
├── config/
│   └── db.js                 # Configuration base de données
├── controllers/
│   ├── clientController.js   # Contrôleur clients
│   ├── factureController.js  # Contrôleur factures
│   ├── produitController.js  # Contrôleur produits
│   └── catalogueController.js # Contrôleur catalogue
├── models/
│   ├── Client.js            # Modèle Client
│   ├── Facture.js           # Modèle Facture
│   ├── Produit.js           # Modèle Produit
│   └── Catalogue.js         # Modèle Catalogue
├── routes/
│   ├── clientRoutes.js      # Routes clients
│   ├── factureRoutes.js     # Routes factures
│   ├── produitRoutes.js     # Routes produits
│   ├── catalogueRoutes.js   # Routes catalogue
│   └── statistiquesRoutes.js # Routes statistiques
├── middleware/
│   ├── validation.js        # Middleware validation
│   └── errorHandler.js      # Middleware erreurs
├── .env                     # Variables d'environnement
├── package.json
└── server.js               # Point d'entrée

```

## API Endpoints

 ### Clients

- ```GET /api/clients``` - Liste des clients
- ```GET /api/clients/:id``` - Détail d'un client
- ```POST /api/clients``` - Créer un client

 ### Factures

- ```GET /api/factures``` - Liste des factures (avec pagination)
- ```GET /api/factures/:id``` - Détail d'une facture
- ```POST /api/factures``` - Créer une facture

 ### Produits

- ```GET /api/produits``` - Liste des produits
- ```GET /api/produits/:id``` - Détail d'un produit
- ```POST /api/produits``` - Créer un produit

### Catalogue

- ```GET /api/catalogue``` - Catalogue actuel
- ```GET /api/catalogue/produit/:id/historique``` - Historique des prix

### Statistiques

- ```GET /api/statistiques/factures``` - Statistiques des factures
- ```GET /api/statistiques/top-clients``` - Top clients par CA

## Documentation
La documentation complète est disponible à l'adresse : http://localhost:3000/api/docs

## Health Check
Vérifiez l'état du serveur : http://localhost:3000/health