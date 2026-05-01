import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';



import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';


import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  standalone:true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})


export class Login {

  loginForm: FormGroup;
  errorMessage='';

  constructor(private fb:FormBuilder,  private auth:AuthService , private router:Router){
    this.loginForm=this.fb.group({
      username:[''],
      password:['']
    });
  }

  onSubmit(){
    this.auth.login(this.loginForm.value)
    .subscribe({
        next: (res: any) => {
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.errorMessage = 'Identifiants invalides';
        }
      });
  }
}