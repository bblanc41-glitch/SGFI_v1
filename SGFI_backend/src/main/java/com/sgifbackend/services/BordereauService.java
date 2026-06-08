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
            baseFontTimes = BaseFont.createFont("c:/windows/fonts/times.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            System.out.println("Police Times New Roman chargée avec succès !");
        } catch (Exception e1) {
            try {
                baseFontTimes = BaseFont.createFont("c:/windows/fonts/times new roman.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                System.out.println("Police Times New Roman chargée avec succès !");
            } catch (Exception e2) {
                try {
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
        
        // Police pour le tableau
        Font tableHeaderFont = new Font(baseFontTimes, 11, Font.BOLD);  // En-tête 11 gras
        Font tableContentFont = new Font(baseFontTimes, 10, Font.NORMAL); // Contenu 10 normal
        Font tableBoldFont = new Font(baseFontTimes, 10, Font.BOLD); // Gras pour l'objet
        
        // Police pour le reste du document
        Font normalFont = new Font(baseFontTimes, 11, Font.NORMAL);
        Font boldFont = new Font(baseFontTimes, 11, Font.BOLD);

        // ==================== EN-TÊTE AVEC IMAGE ====================
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);
        headerTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);
        headerTable.getDefaultCell().setPadding(0);

        try {
            ClassPathResource imgResource = new ClassPathResource("images/ServiceJuridqueHead.png");//er
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
        String ref = "Réf :     /" + LocalDate.now().getYear();
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

     // ==================== TABLEAU DES DÉSIGNATIONS ====================
        List<Map<String, Object>> designations = (List<Map<String, Object>>) payload.get("designations");
        List<Map<String, Object>> dossiersDetails = (List<Map<String, Object>>) payload.get("dossiersDetails");
        String observation = (String) payload.get("observation");

        int nombreDesignations = designations != null ? designations.size() : 0;
        int nombreDossiers = dossiersDetails != null ? dossiersDetails.size() : 0;

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{55f, 10f, 35f});

        // En-têtes du tableau
        String[] headers = {"Désignation", "Quantité", "Observation"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, tableHeaderFont));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setBackgroundColor(new Color(220, 220, 220));
            cell.setPadding(5);
            cell.setBorder(Rectangle.BOX);
            table.addCell(cell);
        }

        // Construction de la cellule Désignation dans l'ordre : OBJET -> Puis liste à puce (Factures + Autres désignations)
        Paragraph designationPara = new Paragraph();
        designationPara.setLeading(1.5f * 10, 1.5f);  // Interligne 1.5

        // 1. OBJET en gras
        designationPara.add(new Chunk("Recouvrement de l'ordre de recette concernant :\n\n", tableBoldFont));

        // 2. Liste à puce pour toutes les désignations (Factures + Autres)

        // 2.1 Désignation des factures (avec puce)
        if (nombreDossiers > 0 && dossiersDetails != null) {
            int totalFactures = nombreDossiers;
            double totalRap = 0;
            
            // Vérifier si un seul dossier
            if (nombreDossiers == 1) {
                // Cas d'un seul dossier : afficher le numéro de facture et le montant
                Map<String, Object> dossierDetail = dossiersDetails.get(0);
                String numeroFacture = (String) dossierDetail.get("numeroFacture");
                Object rapObj = dossierDetail.get("rap");
                double rap = rapObj != null ? Double.parseDouble(rapObj.toString()) : 0;
                
                String facturesText = "Facture N° " + numeroFacture + " d'un montant de " + String.format("%.2f", rap) + " DH";
                designationPara.add(new Chunk("• " + facturesText + "\n", tableContentFont));
            } else {
                // Cas de plusieurs dossiers : afficher le récapitulatif global
                for (Map<String, Object> dossierDetail : dossiersDetails) {
                    Object rapObj = dossierDetail.get("rap");
                    double rap = rapObj != null ? Double.parseDouble(rapObj.toString()) : 0;
                    totalRap += rap;
                }
                
                String facturesText = "Factures concernées (" + totalFactures + " dossiers) pour un montant total de " + String.format("%.2f", totalRap) + " DH";
                designationPara.add(new Chunk("• " + facturesText + "\n", tableContentFont));
            }
        }

        // 2.2 Autres désignations (avec puce)
        if (designations != null) {
            for (Map<String, Object> des : designations) {
                String nom = (String) des.get("nom");
                
                // Ignorer la ligne "Recouvrement de l'ordre de recette"
                if (nom != null && nom.contains("Recouvrement")) {
                    continue;
                }
                
                designationPara.add(new Chunk("• " + nom + "\n", tableContentFont));
            }
        }

        // Ajout de deux lignes vides à la fin du contenu Désignation
        designationPara.add(new Chunk("\n\n", tableContentFont));

        // Construction de la cellule Quantité dans le même ordre
        Paragraph quantityPara = new Paragraph();
        quantityPara.setAlignment(Element.ALIGN_CENTER);
        quantityPara.setLeading(1.5f * 10, 1.5f);  // Interligne 1.5

        // 1. Quantité pour l'OBJET (espace)
        quantityPara.add(new Chunk(" \n\n", tableContentFont));

        // 2. Quantité pour les factures
        if (nombreDossiers > 0 && dossiersDetails != null) {
            if (nombreDossiers == 1) {
                // Un seul dossier : quantité = 1
                quantityPara.add(new Chunk("1\n", tableContentFont));
            } else {
                // Plusieurs dossiers : quantité = nombre de dossiers
                quantityPara.add(new Chunk(String.valueOf(nombreDossiers) + "\n", tableContentFont));
            }
        }

        // 3. Quantités pour les autres désignations
        if (designations != null) {
            for (Map<String, Object> des : designations) {
                String nom = (String) des.get("nom");
                if (nom != null && nom.contains("Recouvrement")) {
                    continue;
                }
                Object quantiteObj = des.get("quantite");
                String quantite = quantiteObj != null ? String.valueOf(quantiteObj) : "1";
                quantityPara.add(new Chunk(quantite + "\n", tableContentFont));
            }
        }

        // Ajout de deux lignes vides à la fin du contenu Quantité
        quantityPara.add(new Chunk("\n\n", tableContentFont));

        // Construction de la cellule Observation
        Paragraph observationPara = new Paragraph();
        observationPara.setLeading(1.5f * 10, 1.5f);  // Interligne 1.5
        observationPara.add(new Chunk(observation != null && !observation.trim().isEmpty() ? observation : "", tableContentFont));
        // Ajout de deux lignes vides à la fin du contenu Observation
        observationPara.add(new Chunk("\n\n", tableContentFont));

        // Cellule Désignation
        PdfPCell designationCell = new PdfPCell();
        designationCell.setBorder(Rectangle.LEFT + Rectangle.RIGHT + Rectangle.BOTTOM);
        designationCell.setPadding(5);
        designationCell.setVerticalAlignment(Element.ALIGN_TOP);
        designationCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        designationCell.addElement(designationPara);
        table.addCell(designationCell);

        // Cellule Quantité
        PdfPCell quantityCell = new PdfPCell();
        quantityCell.setBorder(Rectangle.LEFT + Rectangle.RIGHT + Rectangle.BOTTOM);
        quantityCell.setPadding(5);
        quantityCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        quantityCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        quantityCell.addElement(quantityPara);
        table.addCell(quantityCell);

        // Cellule Observation
        PdfPCell observationCell = new PdfPCell();
        observationCell.setBorder(Rectangle.LEFT + Rectangle.RIGHT + Rectangle.BOTTOM);
        observationCell.setPadding(5);
        observationCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        observationCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        observationCell.addElement(observationPara);
        table.addCell(observationCell);

        document.add(table);
        document.add(new Paragraph(" "));

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