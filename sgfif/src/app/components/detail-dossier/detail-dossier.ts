import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { Dossier, getBadgeClass, getLibelle, PieceJointe, HistoriqueDossier } from '../../models/dossier';
import { SuiviJuridique } from '../../models/suivi-juridique';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-detail-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './detail-dossier.html',
  styleUrls: ['./detail-dossier.css']
})
export class DetailDossier implements OnInit {
  dossierId!: number;
  dossier: Dossier | null = null;
  modeEdition = false;
  chargement = true;
  erreur = '';
  fichierUpload: File | null = null;
  uploadMessage = '';
  pieces: PieceJointe[] = [];
  historique: HistoriqueDossier[] = [];

  // Onglets
  activeTab: 'info' | 'suivi' | 'pieces' | 'historique' = 'info';

  // Workflow
  statutSelectionne: string = '';
  transitions: string[] = [];
  motifRequis: string = '';
  showMotifField: boolean = false;

  // Visualisation des pièces jointes
  modalVisible = false;
  modalSafeUrl: SafeResourceUrl | null = null;
  modalType: 'image' | 'pdf' | 'autre' = 'autre';
  modalNomFichier: string = '';

  // Suivi juridique
  suivis: SuiviJuridique[] = [];
  typeAudienceOptions = ['INSTANCE', 'APPEL', 'CASSATION'];
  suiviEnEdition: SuiviJuridique | null = null;
  nouveauSuivi: SuiviJuridique = {
    referenceInterne: '',
    referenceExterne: '',
    typeAudience: 'INSTANCE',
    jugement: '',
    dateAudience: ''
  };

  erreurSuivi: string = '';
  showForm: boolean = false;
  
  // Formulaire de modification avec tous les champs
  formModif: FormGroup;
  modif: any = {}; // Objet temporaire pour la modification

  // Ordre des statuts pour la timeline
  tousLesStatuts: string[] = [
    'IMPORTE_CCR', 'EN_ATTENTE_PRISE_EN_CHARGE', 'EN_ATTENTE_VALIDATION',
    'INCOMPLET', 'VALIDE_POUR_TRANSMISSION', 'ENVOYE_AVOCAT',
    'EN_INSTANCE', 'EN_APPEL', 'EN_CASSATION', 'CLOTURE'
  ];

  // Liste des pôles hospitaliers
  poles: string[] = [
    'Hôpital des Spécialités',
    'Hôpital Mère-Enfant',
    'Hôpital d\'Oncologie',
    'Hôpital Ibn Al Hassan',
    'Hôpital Omar Drissi'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dossierService: DossierService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {
    // Formulaire avec tous les champs modifiables
    this.formModif = this.fb.group({
      beneficiaire: [''],
      cin: [''],
      telephone: [''],
      pole: [''],
      dateDebut: [''],
      dateFin: [''],
      montant: [0],
      paiements: [0],
      rap: [0],
      relance1: [''],
      dateRelance1: [''],
      relance2: [''],
      dateRelance2: [''],
      observationJuridique: ['']
    });
    
    // Initialiser l'objet modif
    this.modif = this.formModif.value;
  }

  ngOnInit(): void {
    this.dossierId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.dossierId) {
      this.erreur = "ID de dossier manquant";
      this.chargement = false;
      return;
    }
    this.chargerDossier();
    this.chargerListeFichiers();
    this.chargerHistorique();
  }

  // Raccourcis clavier
  @HostListener('document:keydown.control.s', ['$event'])
  onCtrlS(event: any): void {
    event.preventDefault();
    if (this.showForm && this.suiviEnEdition) {
      this.modifierSuivi();
    } else if (this.showForm) {
      this.ajouterSuivi();
    } else if (this.modeEdition) {
      this.enregistrerModifications();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: any): void {
    event.preventDefault();
    if (this.showForm) {
      this.annulerEdition();
    }
    if (this.modeEdition) {
      this.basculerEdition();
    }
  }

  // Calcul du RAP - version améliorée inspirée de saisie-dossier
  calculerRap(): void {
    let montant = this.modif.montant || 0;
    if (montant < 0) { montant = -montant; }
    let paiements = this.modif.paiements || 0;
    if (paiements < 0) { paiements = -paiements; }
    const resultat = (montant < paiements ? 0 : montant - paiements);
    this.modif.rap = resultat;
    this.formModif.patchValue({ rap: resultat }, { emitEvent: false });
  }

  // Méthode appelée quand montant ou paiements changent
  onRapChange(): void {
    this.calculerRap();
  }

  chargerDossier(): void {
    this.dossierService.getById(this.dossierId).subscribe({
      next: (data) => {
        this.dossier = data;
        if (this.dossier?.referenceInterne) {
          this.chargerSuivis();
        }
        this.mettreAJourTransitions();
        
        // Remplir l'objet modif avec toutes les données
        this.modif = {
          beneficiaire: data.beneficiaire || '',
          cin: data.cin || '',
          telephone: data.telephone || '',
          pole: data.pole || '',
          dateDebut: data.dateDebut || '',
          dateFin: data.dateFin || '',
          montant: data.montant || 0,
          paiements: data.paiements || 0,
          rap: data.rap || 0,
          relance1: data.relance1 || '',
          dateRelance1: data.dateRelance1 || '',
          relance2: data.relance2 || '',
          dateRelance2: data.dateRelance2 || '',
          observationJuridique: data.observationJuridique || ''
        };
        
        // Mettre à jour le formulaire
        this.formModif.patchValue(this.modif);
        
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erreur = "Impossible de charger le dossier";
        this.chargement = false;
        console.error(err);
      }
    });
  }

  chargerHistorique(): void {
    this.dossierService.getHistorique(this.dossierId).subscribe({
      next: (data: HistoriqueDossier[]) => {
        this.historique = data;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error(err)
    });
  }

  // ========== SUIVI JURIDIQUE ==========
  chargerSuivis(): void {
    if (this.dossier?.referenceInterne) {
      this.dossierService.getSuivis(this.dossier.referenceInterne).subscribe({
        next: (data: SuiviJuridique[]) => {
          this.suivis = data.sort((a, b) => {
            if (!a.dateAudience && !b.dateAudience) return 0;
            if (!a.dateAudience) return 1;
            if (!b.dateAudience) return -1;
            return new Date(b.dateAudience).getTime() - new Date(a.dateAudience).getTime();
          });
          this.cdr.detectChanges();   
        },
        error: (err: any) => console.error(err)
      });
    }
  }

  afficherFormulaireAjout(): void {
    this.annulerEdition();
    this.showForm = true;
    this.erreurSuivi = '';
  }

  editerSuivi(suivi: SuiviJuridique): void {
    this.suiviEnEdition = { ...suivi };
    this.nouveauSuivi = { ...suivi };
    this.showForm = true;
    this.erreurSuivi = '';
  }

  ajouterSuivi(): void {
    if (!this.dossier?.referenceInterne) return;

    const suivi = this.nouveauSuivi;
    if (!suivi.referenceExterne?.trim()) {
      this.erreurSuivi = 'La référence externe est obligatoire.';
      return;
    }

    if (this.suivis.some(s => s.typeAudience === suivi.typeAudience)) {
      this.erreurSuivi = `Un suivi pour le type ${suivi.typeAudience} existe déjà.`;
      return;
    }

    this.dossierService.createSuivi(this.dossier.referenceInterne, suivi).subscribe({
      next: () => {
        this.chargerSuivis();
        this.annulerEdition();
        this.erreurSuivi = '';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.erreurSuivi = err.error?.message || 'Erreur lors de l\'ajout.';
        this.cdr.detectChanges();
      }
    });
  }

  modifierSuivi(): void {
    if (!this.dossier?.referenceInterne || !this.suiviEnEdition) return;

    const suivi = {
      referenceInterne: this.dossier.referenceInterne,
      referenceExterne: this.nouveauSuivi.referenceExterne,
      typeAudience: this.nouveauSuivi.typeAudience,
      jugement: this.nouveauSuivi.jugement,
      dateAudience: this.nouveauSuivi.dateAudience
    };

    if (!suivi.referenceExterne?.trim()) {
      this.erreurSuivi = 'La référence externe est obligatoire.';
      return;
    }

    this.dossierService.updateSuivi(this.dossier.referenceInterne, suivi).subscribe({
      next: () => {
        this.chargerSuivis();
        this.annulerEdition();
        this.erreurSuivi = '';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur modification:', err);
        this.erreurSuivi = err.error?.message || 'Erreur lors de la modification.';
        this.cdr.detectChanges();
      }
    });
  }

  annulerEdition(): void {
    this.suiviEnEdition = null;
    this.nouveauSuivi = {
      referenceInterne: this.dossier?.referenceInterne || '',
      referenceExterne: '',
      typeAudience: 'INSTANCE',
      jugement: '',
      dateAudience: ''
    };
    this.showForm = false;
    this.erreurSuivi = '';
  }

  supprimerSuivi(suivi: SuiviJuridique): void {
    if (!this.dossier?.referenceInterne) return;
    if (confirm(`Supprimer le suivi pour ${suivi.typeAudience} ?`)) {
      this.dossierService.deleteSuivi(
        this.dossier.referenceInterne, 
        suivi.referenceExterne, 
        suivi.typeAudience
      ).subscribe({
        next: () => this.chargerSuivis(),
        error: (err: any) => console.error(err)
      });
    }
  }

  // ========== WORKFLOW ==========
  mettreAJourTransitions(): void {
    if (this.dossier && this.dossier.statut) {
      this.transitions = this.tousLesStatuts.filter(s => s !== this.dossier!.statut);
      this.statutSelectionne = this.transitions[0] || '';
      this.onStatutChange();
    }
  }

  changerStatut(nouveauStatut: string, motif?: string): void {
    this.dossierService.changerStatut(this.dossierId, nouveauStatut, motif).subscribe({
      next: () => this.chargerDossier(),
      error: (err: any) => alert("Erreur : " + (err.error?.message || err.message))
    });
  }

  onStatutChange(): void {
    this.showMotifField = (this.statutSelectionne === 'CLOTURE' || this.statutSelectionne === 'INCOMPLET');
    if (!this.showMotifField) this.motifRequis = '';
  }

  appliquerChangementStatut(): void {
    if (!this.statutSelectionne) return;
    let motif: string | undefined = undefined;
    if (this.showMotifField) {
      if (!this.motifRequis.trim()) {
        alert(`Un motif est requis pour passer en ${this.statutSelectionne}.`);
        return;
      }
      motif = this.motifRequis.trim();
    }
    this.changerStatut(this.statutSelectionne, motif);
    this.motifRequis = '';
    this.showMotifField = false;
  }

  // ========== MODIFICATION DES INFOS DOSSIER ==========
  basculerEdition(): void {
    this.modeEdition = !this.modeEdition;
    if (!this.modeEdition && this.dossier) {
      // Réinitialiser l'objet modif avec les données actuelles
      this.modif = {
        beneficiaire: this.dossier.beneficiaire || '',
        cin: this.dossier.cin || '',
        telephone: this.dossier.telephone || '',
        pole: this.dossier.pole || '',
        dateDebut: this.dossier.dateDebut || '',
        dateFin: this.dossier.dateFin || '',
        montant: this.dossier.montant || 0,
        paiements: this.dossier.paiements || 0,
        rap: this.dossier.rap || 0,
        relance1: this.dossier.relance1 || '',
        dateRelance1: this.dossier.dateRelance1 || '',
        relance2: this.dossier.relance2 || '',
        dateRelance2: this.dossier.dateRelance2 || '',
        observationJuridique: this.dossier.observationJuridique || ''
      };
      this.formModif.patchValue(this.modif);
    }
  }

  enregistrerModifications(): void {
    if (!this.dossier) return;
    
    // Calculer le RAP une dernière fois
    this.calculerRap();
    
    // Préparer les données à envoyer
    const updatedData = {
      beneficiaire: this.modif.beneficiaire,
      cin: this.modif.cin,
      telephone: this.modif.telephone,
      pole: this.modif.pole,
      dateDebut: this.modif.dateDebut,
      dateFin: this.modif.dateFin,
      montant: this.modif.montant,
      paiements: this.modif.paiements,
      rap: this.modif.rap,
      relance1: this.modif.relance1,
      dateRelance1: this.modif.dateRelance1,
      relance2: this.modif.relance2,
      dateRelance2: this.modif.dateRelance2,
      observationJuridique: this.modif.observationJuridique
    };

    this.dossierService.update(this.dossierId, updatedData).subscribe({
      next: (updated: Dossier) => {
        this.dossier = updated;
        this.modeEdition = false;
        this.chargerDossier();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        alert("Erreur lors de la modification: " + (err.error?.message || err.message));
      }
    });
  }

  // ========== GESTION DES FICHIERS ==========
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fichierUpload = input.files[0];
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.fichierUpload = event.dataTransfer.files[0];
    }
  }

  uploadPiece(): void {
    if (!this.fichierUpload) return;
    const formData = new FormData();
    formData.append('file', this.fichierUpload);
    this.dossierService.uploadPiece(this.dossierId, formData).subscribe({
      next: () => {
        this.uploadMessage = "Fichier uploadé avec succès";
        this.fichierUpload = null;
        this.chargerListeFichiers();
        setTimeout(() => this.uploadMessage = '', 3000);
      },
      error: (err: any) => {
        this.uploadMessage = "Erreur upload : " + (err.error?.message || err.message);
        setTimeout(() => this.uploadMessage = '', 3000);
      }
    });
  }

  chargerListeFichiers(): void {
    this.dossierService.getPieces(this.dossierId).subscribe({
      next: (data: PieceJointe[]) => this.pieces = data,
      error: (err: any) => console.error(err)
    });
  }

  telechargerPiece(chemin: string, nom: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.dossierService.downloadPiece(this.dossierId, chemin).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nom;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  supprimerPiece(id: number, event?: Event): void {
    if (event) event.stopPropagation();
    if (confirm('Supprimer ce fichier ?')) {
      this.dossierService.deletePiece(this.dossierId, id).subscribe(() => {
        this.pieces = this.pieces.filter(p => p.id !== id);
      });
    }
  }

  voirPiece(chemin: string, nom: string): void {
    const extension = nom.split('.').pop()?.toLowerCase();
    this.modalNomFichier = nom;
    this.dossierService.downloadPiece(this.dossierId, chemin).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      this.modalSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.modalType = ['jpg','jpeg','png','gif','bmp','webp'].includes(extension || '') ? 'image'
                      : extension === 'pdf' ? 'pdf' : 'autre';
      this.modalVisible = true;
    });
  }

  fermerModal(): void {
    this.modalVisible = false;
    this.modalSafeUrl = null;
  }

  genererBordereau(): void {
    this.dossierService.genererBordereau(this.dossierId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bordereau_${this.dossier?.referenceInterne}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => alert('Impossible de générer le bordereau.')
    });
  }

  // ========== MÉTHODES D'AFFICHAGE ==========
  getBadgeClass(statut?: string): string { 
    return getBadgeClass(statut); 
  }
  
  getLibelle(statut?: string): string { 
    return getLibelle(statut); 
  }

  getStatusIcon(statut?: string): string {
    const icons: Record<string, string> = {
      'IMPORTE_CCR': 'bi-cloud-upload',
      'EN_ATTENTE_PRISE_EN_CHARGE': 'bi-hourglass-split',
      'EN_ATTENTE_VALIDATION': 'bi-hourglass-top',
      'INCOMPLET': 'bi-exclamation-triangle',
      'VALIDE_POUR_TRANSMISSION': 'bi-check2-circle',
      'ENVOYE_AVOCAT': 'bi-send',
      'EN_INSTANCE': 'bi-bank',
      'EN_APPEL': 'bi-graph-up',
      'EN_CASSATION': 'bi-shield-shaded',
      'CLOTURE': 'bi-check-circle'
    };
    return icons[statut || ''] || 'bi-question-circle';
  }

  isStatusCompleted(status: string): boolean {
    const statusOrder = this.tousLesStatuts;
    const currentIndex = statusOrder.indexOf(this.dossier?.statut || '');
    const targetIndex = statusOrder.indexOf(status);
    return currentIndex >= targetIndex && currentIndex !== -1;
  }

  getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'pdf': return 'bi-file-pdf-fill text-danger';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'bi-file-image-fill text-primary';
      case 'doc':
      case 'docx':
        return 'bi-file-word-fill text-primary';
      default: return 'bi-file-earmark-fill';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

  setTypeAudience(type: string): void {
    this.nouveauSuivi.typeAudience = type as 'INSTANCE' | 'APPEL' | 'CASSATION';
  }

  truncate(text: string, limit: number): string {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }
}