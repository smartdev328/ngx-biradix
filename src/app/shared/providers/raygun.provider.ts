import * as rg4js from 'raygun4js';
import { ErrorHandler } from '@angular/core';

export class RaygunErrorHandler implements ErrorHandler {
  handleError(e: any) {
    console.error(e);

    // Only send to raygun if not localhost
    if (location.origin.indexOf("localhost") === -1) {
      rg4js('send', {
        error: e,
      });
    }
  }
}
