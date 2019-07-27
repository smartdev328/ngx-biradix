import * as rg4js from 'raygun4js';
import { ErrorHandler } from '@angular/core';

export class RaygunErrorHandler implements ErrorHandler {
  handleError(e: any) {
    rg4js('send', {
      error: e,
    });
  }
}
