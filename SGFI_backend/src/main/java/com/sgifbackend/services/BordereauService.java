package com.sgifbackend.services;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
@Service
public class BordereauService {

    public byte[] genererBordereauMultiple(Map<String, Object> payload) throws DocumentException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, out);
        document.open();

        // Extraction des données du payload
        String destinataire = (String) payload.get("destinataire");
        String cour = (String) payload.get("cour");
        String adresse = (String) payload.get("adresse");
        String ville = (String) payload.get("ville");
        String observation = (String) payload.get("observation");
        List<Map<String, Object>> designations = (List<Map<String, Object>>) payload.get("designations");
        List<Map<String, Object>> dossiersDetails = (List<Map<String, Object>>) payload.get("dossiersDetails");

        // Polices
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        
        // Gris clair pour les en-têtes de tableau
        Color grayColor = new Color(230, 230, 230);

        // ========== EN-TÊTE DU CHU ==========
        // Ligne 1: ROYAUME DU MAROC - MINISTERE DE LA SANTE
        Paragraph header1 = new Paragraph("ROYAUME DU MAROC", headerFont);
        header1.setAlignment(Element.ALIGN_CENTER);
        document.add(header1);
        
        Paragraph header2 = new Paragraph("MINISTERE DE LA SANTE ET DE LA PROTECTION SOCIAL", headerFont);
        header2.setAlignment(Element.ALIGN_CENTER);
        document.add(header2);
        
        Paragraph header3 = new Paragraph("CENTRE HOSPITALO UNIVERSITAIRE HASSAN II", headerFont);
        header3.setAlignment(Element.ALIGN_CENTER);
        document.add(header3);
        
        Paragraph header4 = new Paragraph("SERVICE DES AFFAIRES JURIDIQUES ET SOCIALES", headerFont);
        header4.setAlignment(Element.ALIGN_CENTER);
        document.add(header4);
        
        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));

        // ========== RÉFÉRENCE ET DATE ==========
        String ref = "Réf : /" + LocalDate.now().getYear();
        Paragraph refPara = new Paragraph(ref, normalFont);
        refPara.setAlignment(Element.ALIGN_RIGHT);
        document.add(refPara);
        
        document.add(new Paragraph(" "));

        // ========== DESTINATAIRE ==========
        Paragraph destPara = new Paragraph("DIRECTRICE GENERALE", boldFont);
        destPara.setAlignment(Element.ALIGN_LEFT);
        document.add(destPara);
        
        document.add(new Paragraph("DU CENTRE HOSPITALO-UNIVERSITAIRE HASSAN II", normalFont));
        document.add(new Paragraph("A", normalFont));
        
        document.add(new Paragraph(destinataire, boldFont));
        document.add(new Paragraph("AVOCAT.", normalFont));
        document.add(new Paragraph("AGREE PRES DE LA COUR. DE CASSATION", normalFont));
        document.add(new Paragraph(adresse, normalFont));
        document.add(new Paragraph(ville.toUpperCase(), normalFont));
        
        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));

        // ========== OBJET ==========
        Paragraph objet = new Paragraph("OBJET : Recouvrement de l'ordre de recette", boldFont);
        objet.setAlignment(Element.ALIGN_LEFT);
        document.add(objet);
        
        // Ligne soulignée (alternative à ALIGN_UNDERLINE)
        Paragraph underline = new Paragraph("_______________________________________________", normalFont);
        underline.setAlignment(Element.ALIGN_LEFT);
        document.add(underline);
        
        document.add(new Paragraph(" "));

        // ========== TABLEAU DES DÉSIGNATIONS ==========
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{60f, 15f, 25f});

        // En-têtes du tableau
        PdfPCell cell1 = new PdfPCell(new Phrase("Désignation", headerFont));
        cell1.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell1.setBackgroundColor(grayColor);
        table.addCell(cell1);
        
        PdfPCell cell2 = new PdfPCell(new Phrase("Quantité", headerFont));
        cell2.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell2.setBackgroundColor(grayColor);
        table.addCell(cell2);
        
        PdfPCell cell3 = new PdfPCell(new Phrase("Observation", headerFont));
        cell3.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell3.setBackgroundColor(grayColor);
        table.addCell(cell3);

        // Ajout des désignations prédéfinies
        for (Map<String, Object> des : designations) {
            String nom = (String) des.get("nom");
            Object quantiteObj = des.get("quantite");
            String quantite = quantiteObj != null ? String.valueOf(quantiteObj) : "1";
            
            table.addCell(new Phrase(nom, normalFont));
            table.addCell(new Phrase(quantite, normalFont));
            table.addCell(new Phrase("", normalFont));
        }

        // Ajout des désignations par dossier (factures + RAP)
        for (Map<String, Object> dossierDetail : dossiersDetails) {
            String numeroFacture = (String) dossierDetail.get("numeroFacture");
            Object rapObj = dossierDetail.get("rap");
            String rap = rapObj != null ? String.valueOf(rapObj) : "0";
            
            String designation = "Facture N° " + numeroFacture + " d'un montant de " + rap + " DH";
            table.addCell(new Phrase(designation, normalFont));
            table.addCell(new Phrase("01", normalFont));
            table.addCell(new Phrase("Soit transmis pour engager la procédure de recouvrement", normalFont));
        }

        document.add(table);
        document.add(new Paragraph(" "));

        // ========== OBSERVATION ==========
        if (observation != null && !observation.trim().isEmpty()) {
            Paragraph obsPara = new Paragraph("Observation : " + observation, normalFont);
            document.add(obsPara);
            document.add(new Paragraph(" "));
        }

        // ========== LIEU ET DATE ==========
        Paragraph lieuDate = new Paragraph("Fait à Fès, le " + 
            LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), normalFont);
        lieuDate.setAlignment(Element.ALIGN_RIGHT);
        document.add(lieuDate);
        
        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));

        // ========== SIGNATURE ==========
        Paragraph signature = new Paragraph("La Directrice Générale", boldFont);
        signature.setAlignment(Element.ALIGN_RIGHT);
        document.add(signature);

        document.close();
        return out.toByteArray();
    }
}