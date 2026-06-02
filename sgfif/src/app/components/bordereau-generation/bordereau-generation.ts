import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { Dossier } from '../../models/dossier';

@Component({
  selector: 'app-bordereau-generation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bordereau-generation.html',
  styleUrls: ['./bordereau-generation.css']
})
export class BordereauGeneration implements OnInit {
  dossiers: Dossier[] = [];
  dossiersFiltres: Dossier[] = [];
  recherche: string = '';
  selectionnes: Set<number> = new Set();
  chargement = true;

  // Informations du bordereau
  destinataire: string = '';
  cour: string = 'INSTANCE';
  adresse: string = '';
  ville: string = '';
  
  observation: string = '';

  // Désignations par défaut
  designations: Designation[] = [
  { nom: 'Copies des lettres envoyées à l\'intéressé(e) pour régularisation de la situation administrative', quantite: 1, editable: false },
  { nom: 'Copie CNIE de l\'intéressé(e)', quantite: 1, editable: false }
];
  /*designations: Designation[] = [
    { nom: 'Recouvrement de l\'ordre de recette', quantite: 1, editable: false },
    { nom: 'Copies des lettres envoyées à l\'intéressé(e) pour régularisation de la situation administrative', quantite: 1, editable: false },
    { nom: 'Copie CNIE de l\'intéressé(e)', quantite: 1, editable: false }
  ];*/

  // Nouvelle désignation à ajouter
  nouvelleDesignation: string = '';
  nouvelleQuantite: number = 1;

  // Liste des villes du Maroc
  villes: string[] = [
    'Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Agadir', 'Tanger', 'Meknès',
    'Oujda', 'Kénitra', 'Tétouan', 'Safi', 'El Jadida', 'Nador', 'Settat',
    'Khouribga', 'Béni Mellal', 'Laâyoune', 'Taza', 'Guelmim', 'Berrechid',
    'Temara', 'Khemisset', 'Mohammédia', 'Ouarzazate', 'Errachidia', 'Tiznit',
    'Essaouira', 'Larache', 'Chefchaouen', 'Al Hoceïma', 'Dakhla', 'Smara'
  ];

  cours: string[] = ['INSTANCE', 'APPEL', 'CASSATION'];

  constructor(
    private dossierService: DossierService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.dossierService.getDossiers().subscribe({
      next: (data) => {
        this.dossiers = data;
        this.dossiersFiltres = data;
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement dossiers', err);
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  filtrer(): void {
    if (!this.recherche.trim()) {
      this.dossiersFiltres = this.dossiers;
    } else {
      const t = this.recherche.toLowerCase();
      this.dossiersFiltres = this.dossiers.filter(d =>
        d.ip?.toLowerCase().includes(t) ||
        d.beneficiaire?.toLowerCase().includes(t) ||
        d.referenceInterne?.toLowerCase().includes(t)
      );
    }
    this.cdr.detectChanges();
  }

  toggleSelection(d: Dossier, event: any): void {
    if (event.target.checked) {
      this.selectionnes.add(d.idDossier!);
    } else {
      this.selectionnes.delete(d.idDossier!);
    }
  }

  toggleAll(event: any): void {
    if (event.target.checked) {
      this.dossiersFiltres.forEach(d => this.selectionnes.add(d.idDossier!));
    } else {
      this.dossiersFiltres.forEach(d => this.selectionnes.delete(d.idDossier!));
    }
  }

  ajouterDesignation(): void {
    if (this.nouvelleDesignation.trim()) {
      this.designations.push({
        nom: this.nouvelleDesignation.trim(),
        quantite: this.nouvelleQuantite,
        editable: true
      });
      this.nouvelleDesignation = '';
      this.nouvelleQuantite = 1;
    }
  }

  supprimerDesignation(index: number): void {
    this.designations.splice(index, 1);
  }

  getDossiersSelectionnes(): Dossier[] {
    return this.dossiers.filter(d => this.selectionnes.has(d.idDossier!));
  }

  genererBordereau(): void {
    if (this.selectionnes.size === 0) {
      alert('Veuillez sélectionner au moins un dossier.');
      return;
    }

    // Validation des champs obligatoires
    if (!this.destinataire.trim()) {
      alert('Veuillez renseigner le nom du destinataire (avocat).');
      return;
    }
    if (!this.adresse.trim()) {
      alert('Veuillez renseigner l\'adresse.');
      return;
    }
    if (!this.ville) {
      alert('Veuillez sélectionner la ville.');
      return;
    }

    const dossiersSelectionnes = this.getDossiersSelectionnes();
    const ids = Array.from(this.selectionnes);

    // Construction du payload
    const payload = {
      ids: ids,
      destinataire: this.destinataire,
      cour: this.cour,
      adresse: this.adresse,
      ville: this.ville,
      observation: this.observation,
      designations: this.designations,
      dossiersDetails: dossiersSelectionnes.map(d => ({
        referenceInterne: d.referenceInterne,
        ip: d.ip,
        beneficiaire: d.beneficiaire,
        cin: d.cin,
        numeroFacture: d.numeroFacture,
        montant: d.montant,
        rap: d.rap
      }))
    };

    this.dossierService.genererBordereauEnvoi(payload).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bordereau_envoi_${new Date().toISOString().slice(0,19)}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        alert('Bordereau généré avec succès.');
        // Réinitialiser la sélection
        this.selectionnes.clear();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        alert('Erreur lors de la génération du bordereau.');
      }
    });
  }
}

interface Designation {
  nom: string;
  quantite: number;
  editable: boolean;
}