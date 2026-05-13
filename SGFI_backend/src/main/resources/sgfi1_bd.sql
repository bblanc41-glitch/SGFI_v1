-- Création de la base de données
CREATE DATABASE IF NOT EXISTS sgfi1_bd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sgfi1_bd;

-- Table des utilisateurs 
CREATE TABLE IF NOT EXISTS utilisateurs (
    idAgent BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, 
    role VARCHAR(20) DEFAULT 'INSTRUCTEUR'
);

-- Insertion du compte de test
INSERT INTO utilisateurs (username, password, role) 
VALUES ('billy', 'admin123', 'ADMIN');

-- Table des dossiers importés (Données brutes du CCR)
-- On utilise 'ip' + 'numeroFacture' comme clé pour identifier un dossier unique
CREATE TABLE IF NOT EXISTS dossiersImportes (
    idImport BIGINT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(20) NOT NULL,          -- Identifiant Patient
    beneficiaire VARCHAR(150),
    cin VARCHAR(20),
    dateD DATE,                       -- Date début soins
    dateF DATE,                       -- Date fin soins
    numeroFacture VARCHAR(15)NOT NULL,
    montant DECIMAL(15, 2),
    paiement DECIMAL(15, 2) DEFAULT 0,
    RAP DECIMAL(15, 2),               -- Reste à Payer
    relance1 INT,
    dateRelance1 DATE,
    relance2 INT,
    dateRelance2 DATE,
    observations TEXT,
    date_importation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_ip_facture UNIQUE (ip, numeroFacture)
);

/* CONTRIANTE UNIQUE SUR LE numero de facture pour eviter l'importation de la meme facture plusieurs fois pou un meme patient
ALTER TABLE dossiersImportes ADD CONSTRAINT unique_ip_facture UNIQUE (ip,numeroFacture);
*/

-- Table des dossiers (Enrichissement par le Service Juridique)
CREATE TABLE IF NOT EXISTS dossiers (
    idDossier BIGINT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(20) NOT NULL,
    numeroFacture VARCHAR(15) NOT NULL,
    beneficiaire VARCHAR(150),
    telephone VARCHAR(20),
    statut VARCHAR(50) DEFAULT 'Importé CCR',
    reference_interne VARCHAR(50) UNIQUE,
    observation_juridique TEXT,
    date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
   -- Relation composite : On lie le dossier Juridique au dossier Importe
    CONSTRAINT fk_dossier_unique FOREIGN KEY (ip, numeroFacture) REFERENCES dossiersImportes(ip, numeroFacture) ON DELETE CASCADE
    );
    
    
    --  CONSTRAINT fk_beneficiaire FOREIGN KEY (beneficiaire) REFERENCES dossiersImportes (beneficiaire) ON DELETE CASCADE
    
    -- Les tables sont toutes dependance coté suppression à modifer
    -- Désactiver temporairement les vérifications de clés étrangères
		/*
		SET FOREIGN_KEY_CHECKS = 0;
		
		-- Vider les tables dans l'ordre (dépendances → parents)
		TRUNCATE TABLE historique_dossiers;
		TRUNCATE TABLE pieces_jointes;      -- si vous avez créé cette table
		TRUNCATE TABLE dossiers;
		TRUNCATE TABLE dossiers_importes;
		TRUNCATE TABLE utilisateurs;        -- optionnel, gardez l'admin
		
		-- Réactiver les vérifications
		SET FOREIGN_KEY_CHECKS = 1;
	    */
	    
	    
	    
	    -- Table des pièces justificatives attachées aux dossiers
		CREATE TABLE IF NOT EXISTS pieces_jointes (
		    id BIGINT AUTO_INCREMENT PRIMARY KEY,
		    nom_fichier VARCHAR(255) NOT NULL,
		    chemin_stockage VARCHAR(500) NOT NULL,
		    taille BIGINT NOT NULL,
		    id_dossier BIGINT NOT NULL,
		    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		    CONSTRAINT fk_pieces_dossier FOREIGN KEY (id_dossier) REFERENCES dossiers(id_dossier) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		
		
		-- table Notification
		CREATE TABLE IF NOT EXISTS `notifications` (
		    `id` BIGINT NOT NULL AUTO_INCREMENT,
		    `message` VARCHAR(255) NOT NULL,
		    `type` VARCHAR(50) DEFAULT NULL,
		    `id_dossier` BIGINT DEFAULT NULL,
		    `lu` TINYINT(1) DEFAULT 0,
		    `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
		    PRIMARY KEY (`id`)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;	    
	    
	    
	    
    
    /*
  		Version 2
-- SGFI — Système de Gestion des Factures Impayées
-- CHU Hassan II — Fès
-- Schéma MySQL complet (version 2 — correspond aux entités JPA)

CREATE DATABASE IF NOT EXISTS sgfi_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE sgfi_db;

-- 1. Utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
    id_agent  BIGINT       AUTO_INCREMENT PRIMARY KEY,
    username  VARCHAR(50)  NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,   -- À hacher avec BCrypt en production
    role      VARCHAR(30)  DEFAULT 'INSTRUCTEUR'
);

-- Compte de test (mot de passe en clair — remplacer par un hash BCrypt en prod)
INSERT IGNORE INTO utilisateurs (username, password, role)
VALUES ('billy', 'admin123', 'ADMIN');

-- 2. Données brutes importées depuis le fichier Excel CCR
--    Table en lecture seule pour le service juridique.
--    Nom de table = dossiers_importes (convention Hibernate snake_case)
CREATE TABLE IF NOT EXISTS dossiers_importes (
    id_import       BIGINT          AUTO_INCREMENT PRIMARY KEY,
    ip              VARCHAR(30)     NOT NULL,          -- Identifiant Patient
    beneficiaire    VARCHAR(150),
    cin             VARCHAR(20),
    date_d          DATE,                              -- Début de séjour
    date_f          DATE,                              -- Fin de séjour
    numero_facture  VARCHAR(30)     NOT NULL,
    montant         DECIMAL(15, 2),
    paiement        DECIMAL(15, 2)  DEFAULT 0.00,
    rap             DECIMAL(15, 2),                   -- Reste À Payer
    CONSTRAINT uq_import_ip_facture UNIQUE (ip, numero_facture)
);

-- 3. Dossiers juridiques (enrichis par le Service Juridique)
CREATE TABLE IF NOT EXISTS dossiers (
    id_dossier              BIGINT        AUTO_INCREMENT PRIMARY KEY,

    -- Clé métier composite (liée à dossiers_importes si l'entrée provient d'un import)
    ip                      VARCHAR(30)   NOT NULL,
    numero_facture          VARCHAR(30)   NOT NULL,

    -- Informations patient (dupliquées pour accès rapide sans jointure)
    beneficiaire            VARCHAR(150),
    cin                     VARCHAR(20),
    telephone               VARCHAR(20),

    -- Workflow
    statut                  VARCHAR(50)   NOT NULL DEFAULT 'EN_ATTENTE_PRISE_EN_CHARGE',
    motif                   TEXT,                    -- Motif de clôture / incomplet

    -- Références
    reference_interne       VARCHAR(50)   UNIQUE,    -- Ex : REF-JUR-2025-0001
    bordereau               VARCHAR(255),            -- Nom du PDF bordereau généré

    -- Suivi judiciaire
    jugement                VARCHAR(100),            -- 1ère instance, Appel, Cassation
    date_audience           VARCHAR(50),             -- Format libre

    -- Observations
    observation_juridique   TEXT,

    -- Horodatage automatique
    date_creation           DATETIME      DEFAULT CURRENT_TIMESTAMP,
    date_mise_a_jour        DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- La liaison vers dossiers_importes est gérée en lecture seule par JPA (@JoinColumns)
    -- PAS de FK SQL ici pour permettre la saisie manuelle sans entrée CCR correspondante
    INDEX idx_statut (statut),
    INDEX idx_ip     (ip)
);

-- 4. Historique des actions (remplace les triggers MySQL)
--    Trace chaque changement de statut avec auteur et commentaire.
CREATE TABLE IF NOT EXISTS historique_dossiers (
    id              BIGINT    AUTO_INCREMENT PRIMARY KEY,
    id_dossier      BIGINT    NOT NULL,
    ancien_statut   VARCHAR(50),
    nouveau_statut  VARCHAR(50) NOT NULL,
    auteur          VARCHAR(100),
    commentaire     TEXT,
    date_action     DATETIME  DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historique_dossier
        FOREIGN KEY (id_dossier) REFERENCES dossiers (id_dossier) ON DELETE CASCADE
);

--5. Données de test
-- Quelques imports CCR de démonstration
INSERT IGNORE INTO dossiers_importes
    (ip, beneficiaire, cin, date_d, date_f, numero_facture, montant, paiement, rap)
VALUES
    ('IP2024001', 'Ahmed Benali',    'AB123456', '2024-01-10', '2024-01-18', 'FACT2024001', 15000.00, 5000.00, 10000.00),
    ('IP2024002', 'Fatima Zerrouki', 'FZ789012', '2024-02-05', '2024-02-12', 'FACT2024002', 8500.00,  0.00,    8500.00),
    ('IP2024003', 'Mohamed Tazi',    'MT345678', '2024-03-20', '2024-03-25', 'FACT2024003', 22000.00, 10000.00,12000.00);

-- Dossiers juridiques correspondants
INSERT IGNORE INTO dossiers
    (ip, numero_facture, beneficiaire, cin, statut, reference_interne)
VALUES
    ('IP2024001', 'FACT2024001', 'Ahmed Benali',    'AB123456', 'IMPORTE_CCR',                   'REF-JUR-2024-0001'),
    ('IP2024002', 'FACT2024002', 'Fatima Zerrouki', 'FZ789012', 'EN_ATTENTE_PRISE_EN_CHARGE',    'REF-JUR-2024-0002'),
    ('IP2024003', 'FACT2024003', 'Mohamed Tazi',    'MT345678', 'ENVOYE_AVOCAT',                 'REF-JUR-2024-0003');*/