package com.sgifbackend.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class FileStorageUtil {
	
	///////CONFIGURATION INJECTÉE DEPUIS application.properties
	
	@Value("${file.upload-dir}")
    private String uploadDir;// Chemin du dossier ou les fichiers seront sauvegardes sur le serveur.
    
	
	@Value("${file.max-file-size:10485760}")
    private long maxFileSize;//Taille maximale autorisée en octets. 10485760 = 10 Mo (valeur par défaut).
	   
	
	///////TYPES DE FICHIERS AUTORISÉS POUR LES PIÈCES JUSTIFICATIVES DU DOSSIER
    
	// Extensions autorisees : PDF (jugements, contrats), images (scans factures),
    // Word (courriers). Adaptées au contexte juridique du CHU.
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"
    );
    
    // Types MIME correspondants : vérification côté serveur (plus fiable que l'extension seule)
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "application/pdf",                                                          // PDF
            "image/jpeg",                                                               // JPG
            "image/png",                                                                // PNG
            "application/msword",                                                       // .doc
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"  // .docx
    );
    
    ///////MÉTHODE PRINCIPALE : stocker un fichier lié à un dossier
     
    /* Stocke un fichier (scan, jugement, contrat…) dans le répertoire du dossier.
     Organisation sur le disque : uploadDir / idDossier / fichier-uuid.pdf
 
      @param file       Le fichier envoyé par Angular (FormData)
      @param idDossier  L'identifiant du dossier juridique auquel appartient ce fichier
      @return           Le chemin relatif du fichier (ex: "42/uuid.pdf") → stocké en BDD
     */
    public String stockerFichier(MultipartFile file, Long idDossier) throws Exception {
        try {
            validerFichier(file);//Vérifie taille, extension et type MIME avant tout stockage.
           

            Path dossierDir = Paths.get(uploadDir, idDossier.toString());
            /*Construit le chemin du sous-dossier : ex "C:/sgfi-documents/42"
              Un sous-dossier par dossier juridique → organisation claire des pieces.*/

            Files.createDirectories(dossierDir);//Creation le dossier (et tous ses parents) s'il n'existe pas encore. Pas d'erreur si le dossier existe déjà.

            String nomOriginal = file.getOriginalFilename();//Recuperation du nom original du fichier envoye par le navigateur (ex: "facture.pdf")

            String extension = getExtension(nomOriginal);//Extrait uniquement l'extension (ex: ".pdf")

            String nomUnique = UUID.randomUUID().toString() + extension;//Genere un nom de fichier unique (ex: "a3f7c2d1-…-4b8e.pdf")


            Path destination = dossierDir.resolve(nomUnique);//Construit le chemin complet : ex "C:/sgfi-documents/42/a3f7c2d1…pdf"

            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);//Copie le contenu du fichier uploadé vers le disque.
            //   REPLACE_EXISTING = ecrase si un fichier du même nom existe (cas rare avec UUID)

            return idDossier + "/" + nomUnique;
            /*Retourne le chemin RELATIF (ex: "42/a3f7…pdf")
            //   C'est CE chemin qui sera sauvegardé dans la base de données MySQL.*/

        } catch (Exception ex) {
            throw new Exception(
                "Impossible de stocker le fichier : " + file.getOriginalFilename(), ex
            );
        }
    }
    
    
    //////MÉTHODE : supprimer un fichier
    /* Supprime une pièce justificative du serveur.
      Appelée lors de la clôture d'un dossier ou d'un remplacement de document.
      @param cheminRelatif Le chemin relatif stocké en BDD (ex: "42/a3f7c2d1…pdf")
     */
    public void supprimerFichier(String cheminRelatif) throws Exception {
        try {
            Path cheminFichier = Paths.get(uploadDir).resolve(cheminRelatif).normalize();//normalize() resout les ".." et "." dans le chemin
   
            if (!cheminFichier.startsWith(Paths.get(uploadDir))) {
                throw new Exception("Chemin de fichier non autorisé : " + cheminRelatif);
                // ↑ SÉCURITÉ CRITIQUE : Path Traversal Attack
                //   Un attaquant pourrait envoyer "../../etc/passwd" pour atteindre
                //   des fichiers système. On vérifie que le chemin reste dans uploadDir.
            }

            Files.deleteIfExists(cheminFichier);// Supprime le fichier s'il existe. Pas d'exception si absent.

        } catch (Exception ex) {
            throw new Exception("Impossible de supprimer le fichier : " + cheminRelatif, ex);
        }
    }
    
    
    //////// MÉTHODE : charger un fichier en mémoire (pour le télécharger)
    /**
     * Charge le contenu d'un fichier en bytes pour l'envoyer au navigateur.
     * Utilisé pour télécharger un jugement, un scan de facture, etc.
     *
     * @param cheminRelatif Le chemin relatif du fichier (stocké en BDD)
     * @return Le contenu du fichier sous forme de tableau d'octets
     */
    public byte[] chargerFichier(String cheminRelatif) throws Exception {
        try {
            Path cheminFichier = Paths.get(uploadDir).resolve(cheminRelatif).normalize();

            if (!cheminFichier.startsWith(Paths.get(uploadDir))) {
                // ↑ Même protection contre Path Traversal que dans supprimerFichier
                throw new Exception("Chemin de fichier non autorisé : " + cheminRelatif);
            }

            if (!Files.exists(cheminFichier)) {
                throw new Exception("Fichier introuvable : " + cheminRelatif);
            }

            return Files.readAllBytes(cheminFichier);// Lit tout le contenu du fichier en mémoire.
        } catch (Exception ex) {
            throw new Exception("Impossible de charger le fichier : " + cheminRelatif, ex);
        }
    }
    
    
    ///////// MÉTHODE : vérifier l'existence d'un fichier
    /* Vérifie si un fichier existe sur le disque.
     * Utile avant de générer un lien de téléchargement dans l'interface Angular.
     */
    public boolean fichierExiste(String cheminRelatif) {
        try {
            Path cheminFichier = Paths.get(uploadDir).resolve(cheminRelatif).normalize();
            return Files.exists(cheminFichier) && cheminFichier.startsWith(Paths.get(uploadDir));
            // ↑ Double vérification : le fichier existe ET il est dans le bon répertoire
        } catch (Exception e) {
            return false;// En cas d'erreur inattendue, on retourne false (sécurité par défaut)
        }
    }

    /////// MÉTHODE : supprimer toutes les pièces d'un dossier
    /**
     * Supprime tous les fichiers liés à un dossier juridique.
     * Appelée lors de la suppression définitive d'un dossier (clôture totale).
     *
     * @param idDossier L'identifiant du dossier dont on supprime les pièces
     */
    public void supprimerFichiersDossier(Long idDossier) throws Exception {
        try {
            Path dossierDir = Paths.get(uploadDir, idDossier.toString());
            // ↑ ex: "C:/sgfi-documents/42"

            if (Files.exists(dossierDir)) {
                Files.walk(dossierDir)//Parcourt récursivement tous les fichiers dans ce dossier
                        .filter(Files::isRegularFile)
                        // ↑ Ne garde que les fichiers (ignore les sous-dossiers)
                        .forEach(fichier -> {
                            try {
                                Files.delete(fichier);
                                // ↑ Supprime chaque fichier trouvé
                            } catch (IOException e) {
                                System.err.println("Erreur suppression : " + fichier);
                            }
                        });

                // Supprime le répertoire du dossier s'il est maintenant vide
                if (Files.list(dossierDir).findAny().isEmpty()) {
                    Files.delete(dossierDir);
                }
            }
        } catch (Exception ex) {
            throw new Exception(
                "Impossible de supprimer les fichiers du dossier " + idDossier, ex
            );
        }
    }
    
    
    /////// MÉTHODE PRIVÉE : validation du fichier
    /**
     * Valide le fichier avant stockage : taille, extension, type MIME.
     * @throws Exception Si une règle de validation est violée
     */
    private void validerFichier(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new Exception("Le fichier est vide");
        }

        if (file.getSize() > maxFileSize) {
            throw new Exception(
                "Le fichier dépasse la taille maximale autorisée (" + maxFileSize + " octets)"
            );
            // ↑ Protège contre l'envoi de fichiers trop volumineux qui
            //   satureraient le disque du serveur.
        }

        String nomFichier = file.getOriginalFilename();
        if (nomFichier == null || nomFichier.trim().isEmpty()) {
            throw new Exception("Nom de fichier invalide");
        }

        String extension = getExtension(nomFichier).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new Exception(
                "Type de fichier non autorisé. Types acceptés : " + ALLOWED_EXTENSIONS
            );
            // ↑ On n'accepte que PDF/images/Word pour les pièces justificatives.
            //   Interdit les .exe, .sh, .js etc. qui pourraient être dangereux.
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new Exception("Type MIME non autorisé : " + contentType);
            // ↑ Double vérification avec le type MIME (plus fiable que l'extension seule).
            //   Un attaquant pourrait renommer un .exe en .pdf → le MIME l'expose.
        }
    }

    ////// MÉTHODE PRIVÉE : extraction de l'extension
    private String getExtension(String nomFichier) {
        if (nomFichier == null || nomFichier.isEmpty()) return "";
        int dernierPoint = nomFichier.lastIndexOf(".");
        // ↑ Cherche la position du dernier point dans le nom du fichier
        if (dernierPoint == -1 || dernierPoint == nomFichier.length() - 1) return "";
        // ↑ Pas de point trouvé (-1), ou point en toute fin → pas d'extension
        return nomFichier.substring(dernierPoint);
        // ↑ Retourne l'extension avec le point : ex ".pdf", ".jpg"
    }
    
}
