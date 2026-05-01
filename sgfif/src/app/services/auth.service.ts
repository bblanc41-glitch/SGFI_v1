// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// CORRECTION : import { Token } from '@angular/compiler' supprimé
// Token est un type interne du compilateur Angular, il n'a rien à faire ici.
// Cet import erroné peut provoquer des conflits de types inattendus.

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private loginUrl = 'http://localhost:8080/api/auth/login';

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(this.loginUrl, credentials);
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}

/*import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Token } from '@angular/compiler';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loginUrl= 'http://localhost:8080/api/auth/login';

  constructor(private http: HttpClient) { }
  
  //Envoie les identifiants au Backend pour verification en base de donnees
  login(credentials: { username: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(this.loginUrl, credentials);
  }

  logout(): void {
    localStorage.removeItem('token');
  }
 
  getToken(): string | null {
    return localStorage.getItem('token');
  }
 
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}*/
