import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { saveAs } from 'file-saver';
import { Subject } from 'rxjs';

const API_URL = "http://127.0.0.1:5000/api/v1.0/raspored";

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {

  private fileConversionDone = new Subject<boolean>();
  private internalServerError = new Subject<string>();
  public raspored = [];
  private generiraniRaspored = new Subject<[]>();

  constructor(private http: HttpClient) { }

  getfileConversionDoneListener() {
    return this.fileConversionDone.asObservable();
  }
  getinternalServerErrorListener() {
    return this.internalServerError.asObservable();
  }
  getgeneriraniRasporedListener() {
    return this.generiraniRaspored.asObservable();
  }

  sendData(data) {
    this.saveToFilesSystem(data, "input");
    this.http.post<any>(API_URL + '', data).subscribe(
      (result) => {
        console.log(result);
        if (result.error) {
          this.internalServerError.next(result.error);
          return;
        }
        this.fileConversionDone.next(true);
        this.generiraniRaspored.next(result);
        this.saveToFilesSystem(result, "rezultat");
        this.raspored = result;

      }
    );
  }

  private saveToFilesSystem(response: any[], name) {
    var jsonse = JSON.stringify(response);
    const blob = new Blob([jsonse], { type: 'application/json' });
    saveAs(blob, name + ".json");
  }
}
