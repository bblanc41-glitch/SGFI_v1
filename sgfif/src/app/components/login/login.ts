import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { AuthService }        from '../../services/auth.service';
import { Router }             from '@angular/router';
 

@Component({
  selector:    'app-login',
  standalone:  true,
  imports:     [ReactiveFormsModule, CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl:    './login.css',
})

export class Login {

   loginForm:    FormGroup;
  errorMessage = '';
  chargement   = false;
 
  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.loginForm = this.fb.group({ username: [''], password: [''] });
  }

  onSubmit() {
    this.chargement   = true;
    this.errorMessage = '';
 
    this.auth.login(this.loginForm.value).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);//Stokcage du token pour les autres vue
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.chargement   = false;
        this.errorMessage = 'Identifiants invalides. Vérifiez votre nom d\'utilisateur et mot de passe.';
      }
    });
  }
}