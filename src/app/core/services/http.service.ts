import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface apiUrlModel {
  apiUrl: string;
}

@Injectable()
export class HttpService {
  apiUrl: string;


  constructor(private http:HttpClient){
  }

  async lookupApiUrl() {
    const apiUrlModel = await this.http.get<apiUrlModel>(environment.baseUrl + "apiUrl").toPromise();
    this.apiUrl = apiUrlModel.apiUrl;
  }

  getApiUrl() {
    return this.apiUrl;
  }
}
