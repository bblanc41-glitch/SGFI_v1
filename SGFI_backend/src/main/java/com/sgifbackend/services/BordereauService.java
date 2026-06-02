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
        
        // ==================== TEXTE ARABE/AMAZIGH ====================
        String[] arabicLines = {
            "المملكة المغربية",
            "ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ",
            "وزارة الصحة والحماية الاجتماعية",
            "ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⴰⵎⵓⵔⵜ ⵏ ⵓⴼⵔⴰⴳ ⴰⵏⴰⵎⵓⵏ",
            "المركز الاستشفائي الجامعي الحسن الثاني",
            "ⵙⴱⵉⵟⴰⵔ ⴰⵙⴷⴰⵡⴰⵏ ⵍⵃⴰⵙⴰⵏ ⵡⵉⵙⵙ ⵙⵉⵏ",
            "مصلحة الشؤون القانونية والاجتماعية"
        };
        
        String[] frenchLines = {
            "ROYAUME DU MAROC",
            "MINISTERE DE LA SANTE",
            "ET DE LA PROTECTION SOCIAL",
            "CENTRE HOSPITALO UNIVERSITAIRE HASSAN II",
            "SERVICE DES AFFAIRES JURIDIQUES ET SOCIALES"
        };

        // ==================== EN-TÊTE ====================
        PdfPTable headerTable = new PdfPTable(3);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{216.6f, 189.8f, 188.4f});
        headerTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

        // Colonne gauche - Texte français
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setVerticalAlignment(Element.ALIGN_TOP);
        leftCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        Paragraph leftText = new Paragraph();
        for (int i = 0; i < frenchLines.length; i++) {
            Font f = (i == 0 || i == 3) ? frenchBoldFont : frenchFont;
            leftText.add(new Chunk(frenchLines[i] + (i < frenchLines.length - 1 ? "\n" : ""), f));
        }
        leftCell.addElement(leftText);
        headerTable.addCell(leftCell);

        // Colonne centre - Logo
        PdfPCell centerCell = new PdfPCell();
        centerCell.setBorder(Rectangle.NO_BORDER);
        centerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        centerCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        
        try {
            ClassPathResource imgResource = new ClassPathResource("images/chu_logo.jpg");
            InputStream imgStream = imgResource.getInputStream();
            Image logo = Image.getInstance(imgStream.readAllBytes());
            logo.scaleToFit(100, 60);
            centerCell.addElement(logo);
        } catch (IOException e) {
            Paragraph fallbackLogo = new Paragraph("C\nHASSAN II\nU", frenchBoldFont);
            fallbackLogo.setAlignment(Element.ALIGN_CENTER);
            centerCell.addElement(fallbackLogo);
        }
        headerTable.addCell(centerCell);

        // Colonne droite - Texte arabe/amazigh
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setVerticalAlignment(Element.ALIGN_TOP);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph rightText = new Paragraph();
        for (int i = 0; i < arabicLines.length; i++) {
            rightText.add(new Chunk(arabicLines[i] + (i < arabicLines.length - 1 ? "\n" : ""), frenchFont));
        }
        rightCell.addElement(rightText);
        headerTable.addCell(rightCell);

        document.add(headerTable);
        document.add(new Paragraph(" "));
        
        // Ligne de séparation
        Paragraph separator = new Paragraph("_________________________________________________________________________________", frenchFont);
        separator.setAlignment(Element.ALIGN_CENTER);
        document.add(separator);
        document.add(new Paragraph(" "));

        // ==================== RÉFÉRENCE ====================
        String ref = "Réf : /" + LocalDate.now().getYear();
        Paragraph refPara = new Paragraph(ref, frenchFont);
        refPara.setAlignment(Element.ALIGN_RIGHT);
        document.add(refPara);
        document.add(new Paragraph(" "));

        // ==================== DESTINATAIRE ====================
        String destinataire = (String) payload.get("destinataire");
        String adresse = (String) payload.get("adresse");
        String ville = (String) payload.get("ville");
        String cour = (String) payload.get("cour");
        
        Paragraph destTitle = new Paragraph("\t\tDIRECTRICE GENERALE", frenchBoldFont);
        destTitle.setAlignment(Element.ALIGN_LEFT);
        document.add(destTitle);
        
        document.add(new Paragraph("\tDU CENTRE HOSPITALO-UNIVERSITAIRE HASSAN II", frenchFont));
        document.add(new Paragraph("\t\t\tA", frenchFont));
        document.add(new Paragraph(" "));
        
        document.add(new Paragraph(destinataire, frenchBoldFont));
        document.add(new Paragraph("\t\tAVOCAT.", frenchFont));
        document.add(new Paragraph("AGREE PRES DE LA COUR " + cour, frenchFont)); 
        document.add(new Paragraph(adresse, frenchFont));
        document.add(new Paragraph(ville.toUpperCase(), frenchFont));
        document.add(new Paragraph(" "));

        // ==================== OBJET ====================
        Paragraph objet = new Paragraph("OBJET : Recouvrement de l'ordre de recette", frenchBoldFont);
        objet.setAlignment(Element.ALIGN_LEFT);
        document.add(objet);
        document.add(new Paragraph(" "));

        // ==================== TABLEAU DES DÉSIGNATIONS ====================
        List<Map<String, Object>> designations = (List<Map<String, Object>>) payload.get("designations");
        List<Map<String, Object>> dossiersDetails = (List<Map<String, Object>>) payload.get("dossiersDetails");
        String observation = (String) payload.get("observation");
        
        // Calcul du nombre total de lignes
        int nombreDesignations = designations.size();
        int nombreDossiers = dossiersDetails.size();
        int nombreTotalLignes = nombreDesignations + (nombreDossiers > 0 ? 1 : 0); // 1 ligne récapitulative pour les dossiers
        
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
            table.addCell(new Phrase("", frenchFont)); // Observation vide pour ces lignes
        }

        // Ligne récapitulative pour tous les dossiers (une seule ligne)
        if (nombreDossiers > 0) {
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
            observationCell.setRowspan(nombreTotalLignes);
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
}

/*
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

        // ==================== CHARGEMENT DE LA POLICE UNICODE ====================
        BaseFont baseFont;
        try {
            // Charger DejaVuSans.ttf depuis resources/fonts/
            InputStream fontStream = getClass().getResourceAsStream("/fonts/DejaVuSans.ttf");
            if (fontStream != null) {
                byte[] fontData = fontStream.readAllBytes();
                baseFont = BaseFont.createFont("DejaVuSans.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, fontData, null);
                System.out.println("Police DejaVuSans chargée avec succès !");
            } else {
                System.err.println("Fichier DejaVuSans.ttf non trouvé, utilisation d'Arial");
                baseFont = BaseFont.createFont("c:/windows/fonts/arial.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            }
        } catch (Exception e) {
            System.err.println("Erreur chargement police: " + e.getMessage());
            baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.EMBEDDED);
        }
        
        Font frenchFont = new Font(baseFont, 8, Font.NORMAL);
        Font frenchBoldFont = new Font(baseFont, 8, Font.BOLD);
        Font headerFont = new Font(baseFont, 8, Font.BOLD);
        
        // ==================== TEXTE ARABE/AMAZIGH ====================
        String[] arabicLines = {
            "\tالمملكة المغربية",
            "ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ",
            "وزارة الصحة والحماية الاجتماعية",
            "ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⴰⵎⵓⵔⵜ ⵏ ⵓⴼⵔⴰⴳ ⴰⵏⴰⵎⵓⵏ",
            "المركز الاستشفائي الجامعي الحسن الثاني",
            "ⵙⴱⵉⵟⴰⵔ ⴰⵙⴷⴰⵡⴰⵏ ⵍⵃⴰⵙⴰⵏ ⵡⵉⵙⵙ ⵙⵉⵏ",
            "مصلحة الشؤون القانونية والاجتماعية"
        };
        
        String[] frenchLines = {
            "ROYAUME DU MAROC",
            "MINISTERE DE LA SANTE",
            "ET DE LA PROTECTION SOCIAL",
            "CENTRE HOSPITALO UNIVERSITAIRE HASSAN II",
            "SERVICE DES AFFAIRES JURIDIQUES ET SOCIALES"
        };

        // ==================== EN-TÊTE ====================
        PdfPTable headerTable = new PdfPTable(3);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{216.6f, 189.8f, 188.4f});
        headerTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

        // Colonne gauche - Texte français
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        //leftCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        leftCell.setVerticalAlignment(Element.ALIGN_TOP);
        Paragraph leftText = new Paragraph();
        for (int i = 0; i < frenchLines.length; i++) {
            Font f = (i == 0 || i == 3) ? frenchBoldFont : frenchFont;
            leftText.add(new Chunk(frenchLines[i] + (i < frenchLines.length - 1 ? "\n" : ""), f));
        }
        leftCell.addElement(leftText);
        headerTable.addCell(leftCell);

        // Colonne centre - Logo
        PdfPCell centerCell = new PdfPCell();
        centerCell.setBorder(Rectangle.NO_BORDER);
        centerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        centerCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        
        try {
            ClassPathResource imgResource = new ClassPathResource("images/chu_logo.jpg");
            InputStream imgStream = imgResource.getInputStream();
            Image logo = Image.getInstance(imgStream.readAllBytes());
            logo.scaleToFit(120, 100);
            centerCell.addElement(logo);
        } catch (IOException e) {
            Paragraph fallbackLogo = new Paragraph("C\nHASSAN II\nU", frenchBoldFont);
            fallbackLogo.setAlignment(Element.ALIGN_CENTER);
            centerCell.addElement(fallbackLogo);
        }
        headerTable.addCell(centerCell);

        // Colonne droite - Texte arabe/amazigh
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        //rightCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        rightCell.setVerticalAlignment(Element.ALIGN_TOP);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph rightText = new Paragraph();
        for (int i = 0; i < arabicLines.length; i++) {
            rightText.add(new Chunk(arabicLines[i] + (i < arabicLines.length - 1 ? "\n" : ""), frenchFont));
        }
        rightCell.addElement(rightText);
        headerTable.addCell(rightCell);

        document.add(headerTable);
        document.add(new Paragraph(" "));
        
        // Ligne de séparation
        /*Paragraph separator = new Paragraph("_________________________________________________________________________________", frenchFont);
        separator.setAlignment(Element.ALIGN_CENTER);
        document.add(separator);
        document.add(new Paragraph(" "));*/

       /* // ==================== RÉFÉRENCE ====================
        String ref = "Réf : /" + LocalDate.now().getYear();
        Paragraph refPara = new Paragraph(ref, frenchFont);
        refPara.setAlignment(Element.ALIGN_RIGHT);
        document.add(refPara);
        document.add(new Paragraph(" "));

        // ==================== DESTINATAIRE ====================
        String destinataire = (String) payload.get("destinataire");
        String adresse = (String) payload.get("adresse");
        String ville = (String) payload.get("ville");
        
        Paragraph destTitle = new Paragraph("DIRECTRICE GENERALE", frenchBoldFont);
        destTitle.setAlignment(Element.ALIGN_LEFT);
        document.add(destTitle);
        
        document.add(new Paragraph("DU CENTRE HOSPITALO-UNIVERSITAIRE HASSAN II", frenchFont));
        document.add(new Paragraph("A", frenchFont));
        document.add(new Paragraph(" "));
        
        document.add(new Paragraph(destinataire, frenchBoldFont));
        document.add(new Paragraph("AVOCAT.", frenchFont));
        document.add(new Paragraph("AGREE PRES DE LA COUR. DE CASSATION", frenchFont));
        document.add(new Paragraph(adresse, frenchFont));
        document.add(new Paragraph(ville.toUpperCase(), frenchFont));
        document.add(new Paragraph(" "));

        // ==================== OBJET ====================
        Paragraph objet = new Paragraph("OBJET : Recouvrement de l'ordre de recette", frenchBoldFont);
        objet.setAlignment(Element.ALIGN_LEFT);
        document.add(objet);
        document.add(new Paragraph(" "));

        // ==================== TABLEAU ====================
        List<Map<String, Object>> designations = (List<Map<String, Object>>) payload.get("designations");
        List<Map<String, Object>> dossiersDetails = (List<Map<String, Object>>) payload.get("dossiersDetails");
        String observation = (String) payload.get("observation");
        
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{55f, 10f, 35f});
        
        String[] headers = {"Désignation", "Quantité", "Observation"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setBackgroundColor(new Color(220, 220, 220));
            cell.setPadding(5);
            table.addCell(cell);
        }

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

        for (Map<String, Object> dossierDetail : dossiersDetails) {
            String numeroFacture = (String) dossierDetail.get("numeroFacture");
            Object rapObj = dossierDetail.get("rap");
            String rap = rapObj != null ? String.valueOf(rapObj) : "0";
            
            String designation = "Facture N° " + numeroFacture + " d'un montant de " + rap + " DH";
            table.addCell(new Phrase(designation, frenchFont));
            table.addCell(new Phrase("01", frenchFont));
            table.addCell(new Phrase("Soit transmis pour engager la procédure de recouvrement", frenchFont));
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
/*
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

        // ==================== CHARGEMENT DES POLICES ====================
        BaseFont baseFont = BaseFont.createFont("c:/windows/fonts/arial.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
        Font frenchFont = new Font(baseFont, 8, Font.NORMAL);
        Font frenchBoldFont = new Font(baseFont, 8, Font.BOLD);
        Font headerFont = new Font(baseFont, 8, Font.BOLD);
        
        // ==================== EN-TÊTE ====================
        PdfPTable headerTable = new PdfPTable(3);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{216.6f, 189.8f, 188.4f});
        headerTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

        // Colonne gauche - Texte français
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        Paragraph leftText = new Paragraph();
        leftText.add(new Chunk("ROYAUME DU MAROC\n", frenchBoldFont));
        leftText.add(new Chunk("MINISTERE DE LA SANTE\n", frenchFont));
        leftText.add(new Chunk("ET DE LA PROTECTION SOCIAL\n", frenchFont));
        leftText.add(new Chunk("CENTRE HOSPITALO UNIVERSITAIRE HASSAN II\n", frenchBoldFont));
        leftText.add(new Chunk("SERVICE DES AFFAIRES JURIDIQUES ET SOCIALES", frenchFont));
        leftCell.addElement(leftText);
        headerTable.addCell(leftCell);

        // Colonne centre - Logo
        PdfPCell centerCell = new PdfPCell();
        centerCell.setBorder(Rectangle.NO_BORDER);
        centerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        centerCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        
        try {
            ClassPathResource imgResource = new ClassPathResource("images/chu_logo.jpg");
            InputStream imgStream = imgResource.getInputStream();
            Image logo = Image.getInstance(imgStream.readAllBytes());
            logo.scaleToFit(120, 70);
            centerCell.addElement(logo);
        } catch (IOException e) {
            Paragraph fallbackLogo = new Paragraph("C\nHASSAN II\nU", frenchBoldFont);
            fallbackLogo.setAlignment(Element.ALIGN_CENTER);
            centerCell.addElement(fallbackLogo);
        }
        headerTable.addCell(centerCell);

        // Colonne droite - Texte arabe/amazigh (copié-collé exact)
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph rightText = new Paragraph();
        rightText.add(new Chunk("المملكة المغربية\n", frenchFont));
        rightText.add(new Chunk("ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ\n", frenchFont));
        rightText.add(new Chunk("وزارة الصحة والحماية الاجتماعية\n", frenchFont));
        rightText.add(new Chunk("ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⴰⵎⵓⵔⵜ ⵏ ⵓⴼⵔⴰⴳ ⴰⵏⴰⵎⵓⵏ\n", frenchFont));
        rightText.add(new Chunk("المركز الاستشفائي الجامعي الحسن الثاني\n", frenchFont));
        rightText.add(new Chunk("ⵙⴱⵉⵟⴰⵔ ⴰⵙⴷⴰⵡⴰⵏ ⵍⵃⴰⵙⴰⵏ ⵡⵉⵙⵙ ⵙⵉⵏ\n", frenchFont));
        rightText.add(new Chunk("مصلحة الشؤون القانونية والاجتماعية", frenchFont));
        rightCell.addElement(rightText);
        headerTable.addCell(rightCell);

        document.add(headerTable);
        document.add(new Paragraph(" "));
        
        // Ligne de séparation
        Paragraph separator = new Paragraph("_________________________________________________________________________________", frenchFont);
        separator.setAlignment(Element.ALIGN_CENTER);
        document.add(separator);
        document.add(new Paragraph(" "));

        // ==================== RÉFÉRENCE ====================
        String ref = "Réf : /" + LocalDate.now().getYear();
        Paragraph refPara = new Paragraph(ref, frenchFont);
        refPara.setAlignment(Element.ALIGN_RIGHT);
        document.add(refPara);
        document.add(new Paragraph(" "));

        // ==================== DESTINATAIRE ====================
        String destinataire = (String) payload.get("destinataire");
        String adresse = (String) payload.get("adresse");
        String ville = (String) payload.get("ville");
        
        Paragraph destTitle = new Paragraph("DIRECTRICE GENERALE", frenchBoldFont);
        destTitle.setAlignment(Element.ALIGN_LEFT);
        document.add(destTitle);
        
        document.add(new Paragraph("DU CENTRE HOSPITALO-UNIVERSITAIRE HASSAN II", frenchFont));
        document.add(new Paragraph("A", frenchFont));
        document.add(new Paragraph(" "));
        
        document.add(new Paragraph(destinataire, frenchBoldFont));
        document.add(new Paragraph("AVOCAT.", frenchFont));
        document.add(new Paragraph("AGREE PRES DE LA COUR. DE CASSATION", frenchFont));
        document.add(new Paragraph(adresse, frenchFont));
        document.add(new Paragraph(ville.toUpperCase(), frenchFont));
        document.add(new Paragraph(" "));

        // ==================== OBJET ====================
        Paragraph objet = new Paragraph("OBJET : Recouvrement de l'ordre de recette", frenchBoldFont);
        objet.setAlignment(Element.ALIGN_LEFT);
        document.add(objet);
        document.add(new Paragraph(" "));

        // ==================== TABLEAU ====================
        List<Map<String, Object>> designations = (List<Map<String, Object>>) payload.get("designations");
        List<Map<String, Object>> dossiersDetails = (List<Map<String, Object>>) payload.get("dossiersDetails");
        String observation = (String) payload.get("observation");
        
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{55f, 10f, 35f});
        
        String[] headers = {"Désignation", "Quantité", "Observation"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setBackgroundColor(new Color(220, 220, 220));
            cell.setPadding(5);
            table.addCell(cell);
        }

        for (Map<String, Object> des : designations) {
            String nom = (String) des.get("nom");
            Object quantiteObj = des.get("quantite");
            String quantite = quantiteObj != null ? String.valueOf(quantiteObj) : "1";
            
            table.addCell(new Phrase(nom, frenchFont));
            table.addCell(new Phrase(quantite, frenchFont));
            table.addCell(new Phrase("", frenchFont));
        }

        for (Map<String, Object> dossierDetail : dossiersDetails) {
            String numeroFacture = (String) dossierDetail.get("numeroFacture");
            Object rapObj = dossierDetail.get("rap");
            String rap = rapObj != null ? String.valueOf(rapObj) : "0";
            
            String designation = "Facture N° " + numeroFacture + " d'un montant de " + rap + " DH";
            table.addCell(new Phrase(designation, frenchFont));
            table.addCell(new Phrase("01", frenchFont));
            table.addCell(new Phrase("Soit transmis pour engager la procédure de recouvrement", frenchFont));
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
}
*/