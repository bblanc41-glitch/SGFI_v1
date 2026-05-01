import { Component } from '@angular/core';
import { DossierService } from '../../services/dossier.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-importation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './importation.html',
  styleUrl: './importation.css',
})
export class Importation {
  selectedFile: File | null = null;
  isUploading: boolean = false; // Indicateur d'état

  constructor(private dossierService: DossierService) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  /*uploadFile() {
    if (this.selectedFile) {
      // on utilise FormData pour envoyer le fichier au Backend (de facon pro)
      this.isUploading = true;
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      // Appel réel au service
      this.dossierService.importCcr(formData).subscribe({
        next: (response) => {
          alert('Importation réussie ! Les dossiers CCR ont été intégrés.');
          this.isUploading = false;
          this.selectedFile = null;
        },
        error: (err) => {
          console.error('Erreur importation:', err);
          alert('Erreur lors de l\'importation du fichier Excel.');
          this.isUploading = false;
        }
      });
    }else {
      alert('Veuillez sélectionner un fichier Excel.');
    }
  }*/
}