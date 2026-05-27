import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter }                          from '@angular/router';
import { provideHttpClient, withInterceptors }    from '@angular/common/http';
import { provideAnimationsAsync }                 from '@angular/platform-browser/animations/async';

import { routes }         from './app.routes';
import { jwtInterceptor } from './services/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),                          // ← Angular Material animations
    provideHttpClient(withInterceptors([jwtInterceptor])) // ← JWT sur tous les appels HTTP
  ]
};