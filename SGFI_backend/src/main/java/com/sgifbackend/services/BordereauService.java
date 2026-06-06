package com.sgifbackend.services;

import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class BordereauService {

    public byte[] genererBordereauMultiple(Map<String, Object> payload) throws DocumentException, IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, out);
        document.open();

        // ==================== CHARGEMENT DE LA POLICE TIMES NEW ROMAN ====================
        BaseFont baseFontTimes;
        try {
            // Essayer de charger Times New Roman depuis le système
            baseFontTimes = BaseFont.createFont("c:/windows/fonts/times.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            System.out.println("Police Times New Roman chargée avec succès !");
        } catch (Exception e1) {
            try {
                // Alternative: Times New Roman (souvent sous un autre nom)
                baseFontTimes = BaseFont.createFont("c:/windows/fonts/times new roman.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                System.out.println("Police Times New Roman chargée avec succès !");
            } catch (Exception e2) {
                try {
                    // Fallback: charger depuis les ressources
                    InputStream fontStream = getClass().getResourceAsStream("/fonts/times.ttf");
                    if (fontStream != null) {
                        byte[] fontData = fontStream.readAllBytes();
                        baseFontTimes = BaseFont.createFont("times.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, fontData, null);
                        System.out.println("Police Times New Roman chargée depuis resources !");
                    } else {
                        throw new Exception("Police non trouvée");
                    }
                } catch (Exception e3) {
                    System.err.println("Times New Roman non trouvée, utilisation de Helvetica par défaut");
                    baseFontTimes = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.EMBEDDED);
                }
            }
        }
        
        // Polices pour le destinataire (14 gras)
        Font destBoldFont = new Font(baseFontTimes, 14, Font.BOLD);
        Font destNormalFont = new Font(baseFontTimes, 14, Font.NORMAL);
        
        // Police pour le tableau (13 normal)
        Font tableFont = new Font(baseFontTimes, 13, Font.NORMAL);
        Font tableHeaderFont = new Font(baseFontTimes, 13, Font.BOLD);
        
        // Police pour le reste du document
        Font normalFont = new Font(baseFontTimes, 11, Font.NORMAL);
        Font boldFont = new Font(baseFontTimes, 11, Font.BOLD);

        // ==================== EN-TÊTE AVEC IMAGE ====================
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);
        headerTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);
        headerTable.getDefaultCell().setPadding(0);

        try {
            ClassPathResource imgResource = new ClassPathResource("images/ServiceJuridqueHeader.png");
            InputStream imgStream = imgResource.getInputStream();
            Image headerImage = Image.getInstance(imgStream.readAllBytes());
            
            float pageWidth = document.getPageSize().getWidth() - document.leftMargin() - document.rightMargin();
            headerImage.scaleToFit(pageWidth, 150);
            headerImage.setAlignment(Element.ALIGN_CENTER);
            
            PdfPCell imageCell = new PdfPCell(headerImage);
            imageCell.setBorder(Rectangle.NO_BORDER);
            imageCell.setPadding(0);
            imageCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            headerTable.addCell(imageCell);
            
            document.add(headerTable);
            document.add(new Paragraph(" "));
            
        } catch (IOException e) {
            System.err.println("Image d'en-tête non trouvée: " + e.getMessage());
            Paragraph fallbackHeader = new Paragraph("CENTRE HOSPITALO-UNIVERSITAIRE HASSAN II\nSERVICE DES AFFAIRES JURIDIQUES ET SOCIALES", boldFont);
            fallbackHeader.setAlignment(Element.ALIGN_CENTER);
            document.add(fallbackHeader);
            document.add(new Paragraph(" "));
        }

        // ==================== RÉFÉRENCE ====================
        String ref = "Réf :\t/" + LocalDate.now().getYear();
        Paragraph refPara = new Paragraph(ref, normalFont);
        refPara.setAlignment(Element.ALIGN_RIGHT);
        document.add(refPara);
        document.add(new Paragraph(" "));

        // ==================== DESTINATAIRE (Times New Roman 14) ====================
        String destinataire = (String) payload.get("destinataire");
        String adresse = (String) payload.get("adresse");
        String ville = (String) payload.get("ville");
        String cour = (String) payload.get("cour");

        Paragraph destBlock = new Paragraph();
        destBlock.setAlignment(Element.ALIGN_CENTER);

        destBlock.add(new Chunk("DIRECTRICE GENERALE\n", destBoldFont));
        destBlock.add(new Chunk("DU CENTRE HOSPITALO-UNIVERSITAIRE HASSAN II\n", destNormalFont));
        destBlock.add(new Chunk("A\n\n", destNormalFont));
        destBlock.add(new Chunk(destinataire + "\n", destBoldFont));
        destBlock.add(new Chunk("AVOCAT.\n", destNormalFont));

        if (cour != null && !cour.trim().isEmpty()) {
            destBlock.add(new Chunk("AGREE PRES DE LA COUR " + cour + "\n", destNormalFont));
        } else {
            destBlock.add(new Chunk("AGREE PRES DE LA COUR DE CASSATION\n", destNormalFont));
        }

        destBlock.add(new Chunk(adresse + "\n", destNormalFont));
        destBlock.add(new Chunk(ville.toUpperCase() + "\n", destNormalFont));

        document.add(destBlock);
        document.add(new Paragraph(" "));

        // ==================== OBJET ====================
        Paragraph objet = new Paragraph("OBJET : Recouvrement de l'ordre de recette", boldFont);
        objet.setAlignment(Element.ALIGN_LEFT);
        document.add(objet);
        document.add(new Paragraph(" "));

        // ==================== TABLEAU DES DÉSIGNATIONS (Times New Roman 13) ====================
        List<Map<String, Object>> designations = (List<Map<String, Object>>) payload.get("designations");
        List<Map<String, Object>> dossiersDetails = (List<Map<String, Object>>) payload.get("dossiersDetails");
        String observation = (String) payload.get("observation");
        
        int nombreDesignations = designations != null ? designations.size() : 0;
        int nombreDossiers = dossiersDetails != null ? dossiersDetails.size() : 0;
        int nombreTotalLignes = nombreDesignations + (nombreDossiers > 0 ? 1 : 0);
        
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{55f, 10f, 35f});
        
        // En-têtes du tableau (Times New Roman 13 gras)
        String[] headers = {"Désignation", "Quantité", "Observation"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, tableHeaderFont));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setBackgroundColor(new Color(220, 220, 220));
            cell.setPadding(5);
            table.addCell(cell);
        }

        // Ajout des désignations (Times New Roman 13)
        if (designations != null) {
            for (Map<String, Object> des : designations) {
                String nom = (String) des.get("nom");
                
                if (nom != null && nom.contains("Recouvrement")) {
                    continue;
                }
                
                Object quantiteObj = des.get("quantite");
                String quantite = quantiteObj != null ? String.valueOf(quantiteObj) : "1";
                
                table.addCell(new Phrase(nom, tableFont));
                table.addCell(new Phrase(quantite, tableFont));
                table.addCell(new Phrase("", tableFont));
            }
        }

        // Ligne récapitulative (Times New Roman 13)
        if (nombreDossiers > 0 && dossiersDetails != null) {
            int totalFactures = nombreDossiers;
            double totalRap = 0;
            for (Map<String, Object> dossierDetail : dossiersDetails) {
                Object rapObj = dossierDetail.get("rap");
                double rap = rapObj != null ? Double.parseDouble(rapObj.toString()) : 0;
                totalRap += rap;
            }
            
            String designationRecap = "Factures concernées (" + totalFactures + " dossier" + (totalFactures > 1 ? "s" : "") + ") pour un montant total de " + String.format("%.2f", totalRap) + " DH";
            table.addCell(new Phrase(designationRecap, tableFont));
            table.addCell(new Phrase(String.valueOf(totalFactures), tableFont));
            
            PdfPCell observationCell = new PdfPCell(new Phrase("Soit transmis pour engager la procédure de recouvrement", tableFont));
            observationCell.setRowspan(nombreTotalLignes);
            observationCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            observationCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(observationCell);
        } else {
            PdfPCell observationCell = new PdfPCell(new Phrase("", tableFont));
            observationCell.setRowspan(Math.max(1, nombreTotalLignes));
            table.addCell(observationCell);
        }

        document.add(table);
        document.add(new Paragraph(" "));

        // ==================== OBSERVATION ====================
        if (observation != null && !observation.trim().isEmpty()) {
            Paragraph obsTitle = new Paragraph("Observation :", boldFont);
            obsTitle.setAlignment(Element.ALIGN_LEFT);
            document.add(obsTitle);
            
            Paragraph obsContent = new Paragraph(observation, normalFont);
            obsContent.setAlignment(Element.ALIGN_LEFT);
            document.add(obsContent);
            document.add(new Paragraph(" "));
        }

        // ==================== LIEU ET DATE ====================
        Paragraph lieuDate = new Paragraph("Fait à Fès, le " + 
            LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), normalFont);
        lieuDate.setAlignment(Element.ALIGN_RIGHT);
        document.add(lieuDate);
        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));

        // ==================== SIGNATURE ====================
        Paragraph signature = new Paragraph("La Directrice Générale", boldFont);
        signature.setAlignment(Element.ALIGN_RIGHT);
        document.add(signature);

        document.close();
        return out.toByteArray();
    }
}

/*Version 1
 * package com.sgifbackend.services;


import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class BordereauService {

    public byte[] genererBordereauMultiple(Map<String, Object> payload) throws DocumentException, IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, out);
        document.open();

        // ==================== CHARGEMENT DE LA POLICE UNICODE ====================
        BaseFont baseFont;
        try {
            InputStream fontStream = getClass().getResourceAsStream("/fonts/DejaVuSans.ttf");
            if (fontStream != null) {
                byte[] fontData = fontStream.readAllBytes();
                baseFont = BaseFont.createFont("DejaVuSans.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, fontData, null);
                System.out.println("Police DejaVuSans chargée avec succès !");
            } else {
                baseFont = BaseFont.createFont("c:/windows/fonts/arial.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            }
        } catch (Exception e) {
            baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.EMBEDDED);
        }
        
        Font frenchFont = new Font(baseFont, 8, Font.NORMAL);
        Font frenchBoldFont = new Font(baseFont, 8, Font.BOLD);
        Font headerFont = new Font(baseFont, 8, Font.BOLD);

        // ==================== EN-TÊTE AVEC IMAGE ====================
        // Table à 1 colonne pour l'image d'en-tête
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);
        headerTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);
        headerTable.getDefaultCell().setPadding(0);

        try {
            // Utilisation de l'image d'en-tête fournie
            ClassPathResource imgResource = new ClassPathResource("images/ServiceJuridqueHeader.png");
            InputStream imgStream = imgResource.getInputStream();
            Image headerImage = Image.getInstance(imgStream.readAllBytes());
            
            // Ajuster la largeur de l'image à 100% de la page
            float pageWidth = document.getPageSize().getWidth() - document.leftMargin() - document.rightMargin();
            headerImage.scaleToFit(pageWidth, 150); // Hauteur max 150
            headerImage.setAlignment(Element.ALIGN_CENTER);
            
            PdfPCell imageCell = new PdfPCell(headerImage);
            imageCell.setBorder(Rectangle.NO_BORDER);
            imageCell.setPadding(0);
            imageCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            headerTable.addCell(imageCell);
            
            document.add(headerTable);
            document.add(new Paragraph(" "));
            
        } catch (IOException e) {
            System.err.println("Image d'en-tête non trouvée: " + e.getMessage());
            // Fallback: afficher un texte simple
            Paragraph fallbackHeader = new Paragraph("CENTRE HOSPITALO-UNIVERSITAIRE HASSAN II\nSERVICE DES AFFAIRES JURIDIQUES ET SOCIALES", frenchBoldFont);
            fallbackHeader.setAlignment(Element.ALIGN_CENTER);
            document.add(fallbackHeader);
            document.add(new Paragraph(" "));
        }

        // ==================== RÉFÉRENCE ====================
        String ref = "Réf :		/" + LocalDate.now().getYear();
        Paragraph refPara = new Paragraph(ref, frenchFont);
        refPara.setAlignment(Element.ALIGN_RIGHT);
        document.add(refPara);
        document.add(new Paragraph(" "));

        
     // ==================== DESTINATAIRE ====================
        String destinataire = (String) payload.get("destinataire");
        String adresse = (String) payload.get("adresse");
        String ville = (String) payload.get("ville");
        String cour = (String) payload.get("cour");

        // Création d'un paragraphe centré pour tout le bloc destinataire
        Paragraph destBlock = new Paragraph();
        destBlock.setAlignment(Element.ALIGN_CENTER);

        destBlock.add(new Chunk("DIRECTRICE GENERALE\n", frenchBoldFont));
        destBlock.add(new Chunk("DU CENTRE HOSPITALO-UNIVERSITAIRE HASSAN II\n", frenchFont));
        destBlock.add(new Chunk("A\n\n", frenchFont));
        destBlock.add(new Chunk(destinataire + "\n", frenchBoldFont));
        destBlock.add(new Chunk("AVOCAT.\n", frenchFont));

        if (cour != null && !cour.trim().isEmpty()) {
            destBlock.add(new Chunk("AGREE PRES DE LA COUR " + cour + "\n", frenchFont));
        } else {
            destBlock.add(new Chunk("AGREE PRES DE LA COUR DE CASSATION\n", frenchFont));
        }

        destBlock.add(new Chunk(adresse + "\n", frenchFont));
        destBlock.add(new Chunk(ville.toUpperCase() + "\n", frenchFont));

        document.add(destBlock);
        document.add(new Paragraph(" "));
        // ==================== DESTINATAIRE ====================
        /*String destinataire = (String) payload.get("destinataire");
        String adresse = (String) payload.get("adresse");
        String ville = (String) payload.get("ville");
        String cour = (String) payload.get("cour");
        
        Paragraph destTitle = new Paragraph("DIRECTRICE GENERALE", frenchBoldFont);
        destTitle.setAlignment(Element.ALIGN_LEFT);
        document.add(destTitle);
        
        document.add(new Paragraph("DU CENTRE HOSPITALO-UNIVERSITAIRE HASSAN II", frenchFont));
        document.add(new Paragraph("\t\t\tA", frenchFont));
        document.add(new Paragraph(" "));
        
        document.add(new Paragraph(destinataire, frenchBoldFont));
        document.add(new Paragraph("\t\tAVOCAT.", frenchFont));
        if (cour != null && !cour.trim().isEmpty()) {
            document.add(new Paragraph("AGREE PRES DE LA COUR " + cour, frenchFont));
        } else {
            document.add(new Paragraph("AGREE PRES DE LA COUR DE CASSATION", frenchFont));
        }
        document.add(new Paragraph(adresse, frenchFont));
        document.add(new Paragraph(ville.toUpperCase(), frenchFont));
        document.add(new Paragraph(" "));*/

      // ==================== OBJET ====================
   /*       Paragraph objet = new Paragraph("OBJET : Recouvrement de l'ordre de recette", frenchBoldFont);
        objet.setAlignment(Element.ALIGN_LEFT);
        document.add(objet);
        document.add(new Paragraph(" "));

        // ==================== TABLEAU DES DÉSIGNATIONS ====================
        List<Map<String, Object>> designations = (List<Map<String, Object>>) payload.get("designations");
        List<Map<String, Object>> dossiersDetails = (List<Map<String, Object>>) payload.get("dossiersDetails");
        String observation = (String) payload.get("observation");
        
        // Calcul du nombre total de lignes
        int nombreDesignations = designations != null ? designations.size() : 0;
        int nombreDossiers = dossiersDetails != null ? dossiersDetails.size() : 0;
        int nombreTotalLignes = nombreDesignations + (nombreDossiers > 0 ? 1 : 0);
        
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{55f, 10f, 35f});
        
        // En-têtes du tableau
        String[] headers = {"Désignation", "Quantité", "Observation"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setBackgroundColor(new Color(220, 220, 220));
            cell.setPadding(5);
            table.addCell(cell);
        }

        // Ajout des désignations prédéfinies (sans "Recouvrement")
        if (designations != null) {
            for (Map<String, Object> des : designations) {
                String nom = (String) des.get("nom");
                
                // Ignorer la ligne "Recouvrement de l'ordre de recette"
                if (nom != null && nom.contains("Recouvrement")) {
                    continue;
                }
                
                Object quantiteObj = des.get("quantite");
                String quantite = quantiteObj != null ? String.valueOf(quantiteObj) : "1";
                
                table.addCell(new Phrase(nom, frenchFont));
                table.addCell(new Phrase(quantite, frenchFont));
                table.addCell(new Phrase("", frenchFont));
            }
        }

        // Ligne récapitulative pour tous les dossiers (une seule ligne)
        if (nombreDossiers > 0 && dossiersDetails != null) {
            int totalFactures = nombreDossiers;
            double totalRap = 0;
            for (Map<String, Object> dossierDetail : dossiersDetails) {
                Object rapObj = dossierDetail.get("rap");
                double rap = rapObj != null ? Double.parseDouble(rapObj.toString()) : 0;
                totalRap += rap;
            }
            
            String designationRecap = "Factures concernées (" + totalFactures + " dossier" + (totalFactures > 1 ? "s" : "") + ") pour un montant total de " + String.format("%.2f", totalRap) + " DH";
            table.addCell(new Phrase(designationRecap, frenchFont));
            table.addCell(new Phrase(String.valueOf(totalFactures), frenchFont));
            
            // Observation fusionnée sur toute la hauteur
            PdfPCell observationCell = new PdfPCell(new Phrase("Soit transmis pour engager la procédure de recouvrement", frenchFont));
            observationCell.setRowspan(nombreTotalLignes);
            observationCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            observationCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(observationCell);
        } else {
            // Pas de dossier, on ajoute une cellule d'observation vide
            PdfPCell observationCell = new PdfPCell(new Phrase("", frenchFont));
            observationCell.setRowspan(Math.max(1, nombreTotalLignes));
            table.addCell(observationCell);
        }

        document.add(table);
        document.add(new Paragraph(" "));

        // ==================== OBSERVATION ====================
        if (observation != null && !observation.trim().isEmpty()) {
            Paragraph obsTitle = new Paragraph("Observation :", frenchBoldFont);
            obsTitle.setAlignment(Element.ALIGN_LEFT);
            document.add(obsTitle);
            
            Paragraph obsContent = new Paragraph(observation, frenchFont);
            obsContent.setAlignment(Element.ALIGN_LEFT);
            document.add(obsContent);
            document.add(new Paragraph(" "));
        }

        // ==================== LIEU ET DATE ====================
        Paragraph lieuDate = new Paragraph("Fait à Fès, le " + 
            LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), frenchFont);
        lieuDate.setAlignment(Element.ALIGN_RIGHT);
        document.add(lieuDate);
        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));

        // ==================== SIGNATURE ====================
        Paragraph signature = new Paragraph("La Directrice Générale", frenchBoldFont);
        signature.setAlignment(Element.ALIGN_RIGHT);
        document.add(signature);

        document.close();
        return out.toByteArray();
    }
}*/