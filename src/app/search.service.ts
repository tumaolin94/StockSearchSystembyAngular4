import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import {Autodata} from './autoData';
@Injectable()
export class SearchService {

  constructor(private http: Http, private httpc: HttpClient ) {}

  search(term: string): Observable<Autodata[]> {
    const url = `http://localhost:3000/auto?input=` + term ;
    return this.http
      .get(url)
      .map(response => response.json().data as Autodata[]);
  }
  search2(term: string): Observable<Autodata[]> {
    console.log(term);
    const url = `http://localhost:3000/auto?input=` + term ;
    console.log(url);
    // this.http.get(url).subscribe(data => {
    //   // Read the result field from the JSON response.
    //   console.log(data[0]);
    //   // this.testData.push(data[0]);
    //   // console.log(this.testData);
    // });
    return this.httpc
      .get(url)
      .map(data => data as Autodata[]);

  }
}
