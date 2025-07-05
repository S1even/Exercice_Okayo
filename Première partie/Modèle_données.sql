-- ==================================================
-- Script SQL - Modèle de données factures Okayo
-- ==================================================

-- Suppression des tables existantes (dans l'ordre inverse des dépendances)
DROP TABLE IF EXISTS LigneFacture;
DROP TABLE IF EXISTS Facture;
DROP TABLE IF EXISTS InformationBancaire;
DROP TABLE IF EXISTS ConditionReglement;
DROP TABLE IF EXISTS Catalogue;
DROP TABLE IF EXISTS TVA;
DROP TABLE IF EXISTS Produit;
DROP TABLE IF EXISTS Client;
DROP TABLE IF EXISTS Emetteur;

-- ==================================================
-- CRÉATION DES TABLES
-- ==================================================

-- Table Emetteur
CREATE TABLE Emetteur (
    id_emetteur INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(255) NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    code_postal VARCHAR(10) NOT NULL,
    telephone VARCHAR(20),
    web VARCHAR(255),
    siret VARCHAR(14) UNIQUE NOT NULL,
    tva_intracommunautaire VARCHAR(15) UNIQUE NOT NULL,
    capital DECIMAL(12,2) NOT NULL,
    forme_juridique VARCHAR(50) NOT NULL,
    naf_ape VARCHAR(10) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table Client
CREATE TABLE Client (
    id_client INT PRIMARY KEY AUTO_INCREMENT,
    code_client VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    code_postal VARCHAR(10) NOT NULL,
    telephone VARCHAR(20),
    email VARCHAR(255),
    forme_juridique VARCHAR(50),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table Produit
CREATE TABLE Produit (
    id_produit INT PRIMARY KEY AUTO_INCREMENT,
    nom_produit VARCHAR(255) NOT NULL,
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table TVA
CREATE TABLE TVA (
    id_tva INT PRIMARY KEY AUTO_INCREMENT,
    taux DECIMAL(5,2) NOT NULL CHECK (taux >= 0 AND taux <= 100),
    date_debut DATE NOT NULL,
    date_fin DATE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tva_dates CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

-- Table Catalogue
CREATE TABLE Catalogue (
    id_catalogue INT PRIMARY KEY AUTO_INCREMENT,
    id_produit INT NOT NULL,
    prix_unitaire_ht DECIMAL(10,2) NOT NULL CHECK (prix_unitaire_ht >= 0),
    id_tva INT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_produit) REFERENCES Produit(id_produit),
    FOREIGN KEY (id_tva) REFERENCES TVA(id_tva),
    CONSTRAINT chk_catalogue_dates CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

-- Table ConditionReglement
CREATE TABLE ConditionReglement (
    id_condition INT PRIMARY KEY AUTO_INCREMENT,
    libelle VARCHAR(255) NOT NULL,
    delai_jours INT NOT NULL DEFAULT 0 CHECK (delai_jours >= 0),
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table InformationBancaire
CREATE TABLE InformationBancaire (
    id_compte INT PRIMARY KEY AUTO_INCREMENT,
    id_emetteur INT NOT NULL,
    nom_banque VARCHAR(255) NOT NULL,
    nom_proprietaire VARCHAR(255) NOT NULL,
    iban VARCHAR(34) NOT NULL,
    bic VARCHAR(11) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_emetteur) REFERENCES Emetteur(id_emetteur),
    CONSTRAINT chk_compte_dates CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

-- Table Facture
CREATE TABLE Facture (
    id_facture INT PRIMARY KEY AUTO_INCREMENT,
    reference VARCHAR(50) UNIQUE NOT NULL,
    date_facturation DATE NOT NULL,
    date_echeance DATE NOT NULL,
    id_client INT NOT NULL,
    id_emetteur INT NOT NULL,
    id_condition_reglement INT NOT NULL,
    id_compte_bancaire INT NOT NULL,
    total_ht DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_ttc DECIMAL(12,2) NOT NULL DEFAULT 0,
    commentaires TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_client) REFERENCES Client(id_client),
    FOREIGN KEY (id_emetteur) REFERENCES Emetteur(id_emetteur),
    FOREIGN KEY (id_condition_reglement) REFERENCES ConditionReglement(id_condition),
    FOREIGN KEY (id_compte_bancaire) REFERENCES InformationBancaire(id_compte),
    CONSTRAINT chk_facture_dates CHECK (date_echeance >= date_facturation),
    CONSTRAINT chk_facture_montants CHECK (total_ht >= 0 AND total_ttc >= total_ht)
);

-- Table LigneFacture
CREATE TABLE LigneFacture (
    id_ligne INT PRIMARY KEY AUTO_INCREMENT,
    id_facture INT NOT NULL,
    designation VARCHAR(255) NOT NULL,
    quantite DECIMAL(10,3) NOT NULL, -- Permet les quantités négatives pour les avoirs
    prix_unitaire_ht DECIMAL(10,2) NOT NULL CHECK (prix_unitaire_ht >= 0),
    taux_tva DECIMAL(5,2) NOT NULL CHECK (taux_tva >= 0 AND taux_tva <= 100),
    total_ht_ligne DECIMAL(12,2) NOT NULL,
    total_tva_ligne DECIMAL(12,2) NOT NULL,
    numero_ligne INT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_facture) REFERENCES Facture(id_facture) ON DELETE CASCADE,
    CONSTRAINT chk_ligne_montants CHECK (total_ht_ligne = quantite * prix_unitaire_ht),
    CONSTRAINT chk_ligne_tva CHECK (total_tva_ligne = ROUND(total_ht_ligne * taux_tva / 100, 2))
);

-- ==================================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- ==================================================

-- Index sur les clés étrangères
CREATE INDEX idx_catalogue_produit ON Catalogue(id_produit);
CREATE INDEX idx_catalogue_tva ON Catalogue(id_tva);
CREATE INDEX idx_catalogue_dates ON Catalogue(date_debut, date_fin);
CREATE INDEX idx_info_bancaire_emetteur ON InformationBancaire(id_emetteur);
CREATE INDEX idx_info_bancaire_dates ON InformationBancaire(date_debut, date_fin);
CREATE INDEX idx_facture_client ON Facture(id_client);
CREATE INDEX idx_facture_emetteur ON Facture(id_emetteur);
CREATE INDEX idx_facture_date ON Facture(date_facturation);
CREATE INDEX idx_ligne_facture ON LigneFacture(id_facture);

-- Index sur les périodes de validité
CREATE INDEX idx_tva_dates ON TVA(date_debut, date_fin);

-- Index sur les codes/références
CREATE INDEX idx_client_code ON Client(code_client);
CREATE INDEX idx_facture_reference ON Facture(reference);

-- ==================================================
-- TRIGGERS DE VALIDATION ET COHÉRENCE
-- ==================================================

-- Trigger pour vérifier qu'il n'y a pas de chevauchement de périodes TVA
DELIMITER //
CREATE TRIGGER trg_tva_no_overlap
BEFORE INSERT ON TVA
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM TVA 
        WHERE taux = NEW.taux 
        AND (
            (NEW.date_debut BETWEEN date_debut AND IFNULL(date_fin, '9999-12-31'))
            OR 
            (IFNULL(NEW.date_fin, '9999-12-31') BETWEEN date_debut AND IFNULL(date_fin, '9999-12-31'))
            OR
            (date_debut BETWEEN NEW.date_debut AND IFNULL(NEW.date_fin, '9999-12-31'))
        )
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chevauchement de périodes de validité pour ce taux de TVA';
    END IF;
END//
DELIMITER ;

-- Trigger pour vérifier qu'il n'y a pas de chevauchement de périodes dans le catalogue
DELIMITER //
CREATE TRIGGER trg_catalogue_no_overlap
BEFORE INSERT ON Catalogue
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM Catalogue 
        WHERE id_produit = NEW.id_produit 
        AND (
            (NEW.date_debut BETWEEN date_debut AND IFNULL(date_fin, '9999-12-31'))
            OR 
            (IFNULL(NEW.date_fin, '9999-12-31') BETWEEN date_debut AND IFNULL(date_fin, '9999-12-31'))
            OR
            (date_debut BETWEEN NEW.date_debut AND IFNULL(NEW.date_fin, '9999-12-31'))
        )
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chevauchement de périodes de validité pour ce produit';
    END IF;
END//
DELIMITER ;

-- Trigger pour recalculer les totaux de facture après modification des lignes
DELIMITER //
CREATE TRIGGER trg_recalcul_totaux_facture
AFTER INSERT ON LigneFacture
FOR EACH ROW
BEGIN
    UPDATE Facture 
    SET 
        total_ht = (
            SELECT IFNULL(SUM(total_ht_ligne), 0) 
            FROM LigneFacture 
            WHERE id_facture = NEW.id_facture
        ),
        total_ttc = (
            SELECT IFNULL(SUM(total_ht_ligne + total_tva_ligne), 0) 
            FROM LigneFacture 
            WHERE id_facture = NEW.id_facture
        )
    WHERE id_facture = NEW.id_facture;
END//
DELIMITER ;

-- ==================================================
-- VUES UTILITAIRES
-- ==================================================

-- Vue pour obtenir le catalogue actuel
CREATE VIEW vue_catalogue_actuel AS
SELECT 
    c.id_catalogue,
    p.nom_produit,
    p.description,
    c.prix_unitaire_ht,
    t.taux as taux_tva,
    c.date_debut,
    c.date_fin
FROM Catalogue c
JOIN Produit p ON c.id_produit = p.id_produit
JOIN TVA t ON c.id_tva = t.id_tva
WHERE c.date_fin IS NULL OR c.date_fin >= CURDATE();

-- Vue pour les factures avec détails client
CREATE VIEW vue_factures_detail AS
SELECT 
    f.id_facture,
    f.reference,
    f.date_facturation,
    f.date_echeance,
    c.nom as nom_client,
    c.code_client,
    e.nom as nom_emetteur,
    cr.libelle as condition_reglement,
    f.total_ht,
    f.total_ttc
FROM Facture f
JOIN Client c ON f.id_client = c.id_client
JOIN Emetteur e ON f.id_emetteur = e.id_emetteur
JOIN ConditionReglement cr ON f.id_condition_reglement = cr.id_condition;

-- ==================================================
-- FONCTIONS UTILITAIRES
-- ==================================================

-- Fonction pour obtenir le taux de TVA en vigueur à une date donnée
DELIMITER //
CREATE FUNCTION get_taux_tva_date(p_taux DECIMAL(5,2), p_date DATE) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_id_tva INT;
    
    SELECT id_tva INTO v_id_tva
    FROM TVA
    WHERE taux = p_taux
    AND p_date BETWEEN date_debut AND IFNULL(date_fin, '9999-12-31')
    LIMIT 1;
    
    RETURN v_id_tva;
END//
DELIMITER ;

-- Fonction pour obtenir le prix catalogue en vigueur à une date donnée
DELIMITER //
CREATE FUNCTION get_prix_catalogue_date(p_id_produit INT, p_date DATE) 
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_prix DECIMAL(10,2);
    
    SELECT prix_unitaire_ht INTO v_prix
    FROM Catalogue
    WHERE id_produit = p_id_produit
    AND p_date BETWEEN date_debut AND IFNULL(date_fin, '9999-12-31')
    LIMIT 1;
    
    RETURN v_prix;
END//
DELIMITER ;

-- ==================================================
-- PROCÉDURES STOCKÉES
-- ==================================================

-- Procédure pour créer une ligne de facture avec calculs automatiques
DELIMITER //
CREATE PROCEDURE sp_ajouter_ligne_facture(
    IN p_id_facture INT,
    IN p_designation VARCHAR(255),
    IN p_quantite DECIMAL(10,3),
    IN p_prix_unitaire_ht DECIMAL(10,2),
    IN p_taux_tva DECIMAL(5,2),
    IN p_numero_ligne INT
)
BEGIN
    DECLARE v_total_ht_ligne DECIMAL(12,2);
    DECLARE v_total_tva_ligne DECIMAL(12,2);
    
    -- Calcul des totaux
    SET v_total_ht_ligne = p_quantite * p_prix_unitaire_ht;
    SET v_total_tva_ligne = ROUND(v_total_ht_ligne * p_taux_tva / 100, 2);
    
    -- Insertion de la ligne
    INSERT INTO LigneFacture (
        id_facture, designation, quantite, prix_unitaire_ht, 
        taux_tva, total_ht_ligne, total_tva_ligne, numero_ligne
    ) VALUES (
        p_id_facture, p_designation, p_quantite, p_prix_unitaire_ht,
        p_taux_tva, v_total_ht_ligne, v_total_tva_ligne, p_numero_ligne
    );
END//
DELIMITER ;

-- ==================================================
-- DONNÉES D'EXEMPLE
-- ==================================================

-- Insertion des données d'exemple
INSERT INTO Emetteur (nom, adresse, ville, code_postal, telephone, web, siret, tva_intracommunautaire, capital, forme_juridique, naf_ape)
VALUES ('Okayo SAS', '35 Rue du Général Foy', 'Paris', '75008', '01 80 88 63 00', 'www.okayo.fr', '82255940700017', 'FR 76 822559407', 10000.00, 'SAS', '6201Z');

INSERT INTO Client (code_client, nom, adresse, ville, code_postal, forme_juridique)
VALUES ('CU2203-0005', 'Mon client SAS', '45, rue du test', 'PARIS', '75016', 'SAS');

INSERT INTO ConditionReglement (libelle, delai_jours, description)
VALUES ('Règlement à la livraison', 0, 'Paiement immédiat à la réception');

INSERT INTO InformationBancaire (id_emetteur, nom_banque, nom_proprietaire, iban, bic, date_debut)
VALUES (1, 'BRED', 'OKAYO', 'FR76 0000 0000 0000 0000 0000 097', 'BREDFRPPXXX', '2022-01-01');

-- Insertion des taux de TVA
INSERT INTO TVA (taux, date_debut) VALUES (20.00, '2022-01-01');
INSERT INTO TVA (taux, date_debut) VALUES (7.00, '2022-01-01');
INSERT INTO TVA (taux, date_debut) VALUES (5.5, '2022-01-01');

-- Insertion des produits
INSERT INTO Produit (nom_produit, description) VALUES ('Mon produit C', 'Produit de catégorie C');
INSERT INTO Produit (nom_produit, description) VALUES ('Mon produit A', 'Produit de catégorie A');
INSERT INTO Produit (nom_produit, description) VALUES ('Mon produit D', 'Produit de catégorie D');
INSERT INTO Produit (nom_produit, description) VALUES ('Mon produit B', 'Produit de catégorie B');

-- Insertion dans le catalogue
INSERT INTO Catalogue (id_produit, prix_unitaire_ht, id_tva, date_debut) VALUES (1, 70000.00, 1, '2022-01-01');
INSERT INTO Catalogue (id_produit, prix_unitaire_ht, id_tva, date_debut) VALUES (2, 1500.00, 3, '2022-01-01');
INSERT INTO Catalogue (id_produit, prix_unitaire_ht, id_tva, date_debut) VALUES (3, 3000.00, 1, '2022-01-01');
INSERT INTO Catalogue (id_produit, prix_unitaire_ht, id_tva, date_debut) VALUES (4, 4000.00, 2, '2022-01-01');

-- Création de la facture d'exemple
INSERT INTO Facture (reference, date_facturation, date_echeance, id_client, id_emetteur, id_condition_reglement, id_compte_bancaire)
VALUES ('2022-0025', '2018-07-26', '2018-07-31', 1, 1, 1, 1);

-- Ajout des lignes de facture
CALL sp_ajouter_ligne_facture(1, 'Mon produit C', 1, 70000.00, 20.00, 1);
CALL sp_ajouter_ligne_facture(1, 'Mon produit A', 2, 1500.00, 5.5, 2);
CALL sp_ajouter_ligne_facture(1, 'Mon produit D', 1, 3000.00, 20.00, 3);
CALL sp_ajouter_ligne_facture(1, 'Mon produit B', 2, 4000.00, 7.00, 4);

-- ==================================================
-- REQUÊTES DE VÉRIFICATION
-- ==================================================

-- Vérification de la facture créée
SELECT 
    f.reference,
    f.date_facturation,
    f.total_ht,
    f.total_ttc,
    c.nom as client
FROM Facture f
JOIN Client c ON f.id_client = c.id_client
WHERE f.reference = '2022-0025';

-- Détail des lignes de facture
SELECT 
    lf.numero_ligne,
    lf.designation,
    lf.quantite,
    lf.prix_unitaire_ht,
    lf.taux_tva,
    lf.total_ht_ligne,
    lf.total_tva_ligne
FROM LigneFacture lf
JOIN Facture f ON lf.id_facture = f.id_facture
WHERE f.reference = '2022-0025'
ORDER BY lf.numero_ligne;