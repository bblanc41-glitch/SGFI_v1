package com.sgifbackend.services;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.sgifbackend.models.Dossier;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class BordereauService {

	
	public byte[] genererBordereauMultiple(List<Dossier> dossiers) throws DocumentException {
	    ByteArrayOutputStream out = new ByteArrayOutputStream();
	    Document document = new Document(PageSize.A4);
	    PdfWriter.getInstance(document, out);
	    document.open();

	    Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
	    Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
	    Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

	    Paragraph title = new Paragraph("BORDEREAU D'ENVOI À L'AVOCAT - Récapitulatif", titleFont);
	    title.setAlignment(Element.ALIGN_CENTER);
	    document.add(title);
	    document.add(new Paragraph(" "));
	    document.add(new Paragraph("Généré le : " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), normalFont));
	    document.add(new Paragraph(" "));

	    for (Dossier d : dossiers) {
	        document.add(new Paragraph("Dossier N° : " + d.getIdDossier(), boldFont));
	        document.add(new Paragraph("Référence interne : " + d.getReferenceInterne(), normalFont));
	        document.add(new Paragraph("IP Patient : " + d.getIp(), normalFont));
	        document.add(new Paragraph("Bénéficiaire : " + (d.getBeneficiaire() != null ? d.getBeneficiaire() : "—"), normalFont));
	        document.add(new Paragraph("CIN : " + (d.getCin() != null ? d.getCin() : "—"), normalFont));
	        document.add(new Paragraph("Numéro facture : " + d.getNumeroFacture(), normalFont));
	        document.add(new Paragraph("Montant : " + (d.getMontant() != null ? d.getMontant() : "0") + " DH", normalFont));
	        document.add(new Paragraph("Reste à payer : " + (d.getRap() != null ? d.getRap() : "0") + " DH", normalFont));
	        document.add(new Paragraph("Statut actuel : " + d.getStatut().getLibelle(), normalFont));
	        document.add(new Paragraph(" "));
	        document.add(new Paragraph("--------------------------------------------------", normalFont));
	        document.add(new Paragraph(" "));
	    }

	    document.close();
	    return out.toByteArray();
	}
	
	
	/* Generation du border de 1 dossier
    public byte[] genererBordereau(Dossier dossier) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, out);
        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

        Paragraph title = new Paragraph("BORDEREAU D'ENVOI À L'AVOCAT", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        document.add(new Paragraph(" "));
        document.add(new Paragraph("Généré le : " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), normalFont));
        document.add(new Paragraph(" "));

        document.add(new Paragraph("Dossier N° : " + dossier.getIdDossier(), boldFont));
        document.add(new Paragraph("Référence interne : " + dossier.getReferenceInterne(), normalFont));
        document.add(new Paragraph("IP Patient : " + dossier.getIp(), normalFont));
        document.add(new Paragraph("Bénéficiaire : " + (dossier.getBeneficiaire() != null ? dossier.getBeneficiaire() : "—"), normalFont));
        document.add(new Paragraph("CIN : " + (dossier.getCin() != null ? dossier.getCin() : "—"), normalFont));
        document.add(new Paragraph("Téléphone : " + (dossier.getTelephone() != null ? dossier.getTelephone() : "—"), normalFont));
        document.add(new Paragraph("Numéro facture : " + dossier.getNumeroFacture(), normalFont));
        document.add(new Paragraph("Montant : " + (dossier.getMontant() != null ? dossier.getMontant() : "0") + " DH", normalFont));
        document.add(new Paragraph("Reste à payer : " + (dossier.getRap() != null ? dossier.getRap() : "0") + " DH", normalFont));
        document.add(new Paragraph("Statut actuel : " + dossier.getStatut().getLibelle(), normalFont));
        document.add(new Paragraph("Observation juridique : " + (dossier.getObservationJuridique() != null ? dossier.getObservationJuridique() : "—"), normalFont));

        document.close();
        return out.toByteArray();
    }*/
    
    
    
}