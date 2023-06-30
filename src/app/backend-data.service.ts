import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BackendDataService {
  modelDataUrl: string = 'https://python-backend.ajapro.com/model-data';
  fetchDataUrl: string = 'https://python-backend.ajapro.com/fetch-data';
  valuesPostUrl: string = 'https://python-backend.ajapro.com/feed-data';

  constructor(private http: HttpClient) {}

  // get model data
  getModelData(): any {
    return this.http.get(this.modelDataUrl);
  }

  // get fetch data
  getfetchData(): any {
    return this.http.get(this.fetchDataUrl);
  }

  // get the data with the help of region city year
  getValuesForRCY(region: any, city: string, year: any) {
    return this.http.request('POST', this.valuesPostUrl, {
      params: { city, region, year },
    });
  }
}
