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
  referenceExterne: string = '';
  chargement = true;

  constructor(
    private dossierService: DossierService,
    private cdr: ChangeDetectorRef   // ← injecté
  ) {}

  ngOnInit(): void {
    this.dossierService.getDossiers().subscribe({
      next: (data) => {
        this.dossiers = data;
        this.dossiersFiltres = data;
        this.chargement = false;
        this.cdr.detectChanges();   // ← force l’affichage
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
    // Force la mise à jour après filtrage
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

  genererBordereau(): void {
    if (this.selectionnes.size === 0) {
      alert('Veuillez sélectionner au moins un dossier.');
      return;
    }
    const ids = Array.from(this.selectionnes);
    const payload = { ids, referenceExterne: this.referenceExterne };
    this.dossierService.genererBordereauEnvoi(payload).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bordereau_envoi.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        alert('Bordereau généré. Les dossiers ont été marqués "Envoyé à l\'avocat".');
        // Recharger la liste
        this.ngOnInit();
      },
      error: (err: any) => {
        console.error(err);
        alert('Erreur lors de la génération.');
      }
    });
  }
}