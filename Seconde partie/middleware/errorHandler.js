// Middleware de gestion des erreurs
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    // Erreur de validation
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Données invalides',
        details: err.message
      });
    }
    
    // Erreur de base de données
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'Conflit - Données déjà existantes',
        details: err.message
      });
    }
    
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({
        error: 'Référence non trouvée',
        details: err.message
      });
    }
    
    // Erreur générique
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
    });
  };
  
  module.exports = errorHandler;