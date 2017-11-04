import { Component } from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {NgForm} from '@angular/forms';
import {Observable} from 'rxjs/Observable';
import { OnInit } from '@angular/core';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import { Jsonp, Headers, Http, Response} from '@angular/http';
import { HttpClient } from '@angular/common/http';
import {Autodata} from './autoData';
import { SearchService } from './search.service';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [SearchService]
})
export class AppComponent implements OnInit {
  private headers = new Headers({'Content-Type': 'application/json',
    'Access-Control-Allow-Origin' : '*'});
  symbol_text;
  form = new FormGroup({
    symbol: new FormControl('', [
      Validators.required,
    ]),
  });
  get symbol(): any { return this.form.get('symbol'); }
  autodatas: Observable<Autodata[]>;
  testData: Autodata[] = [] ;
  private searchTerms = new Subject<string>();
  constructor(private http: HttpClient, private searchService: SearchService) {
  }

  search(term: string): void {
    this.searchTerms.next(term);
  }

  ngOnInit(): void {
    this.autodatas = this.searchTerms
      .debounceTime(300)        // wait 300ms after each keystroke before considering the term
      .switchMap(term => term   // switch to new observable each time the term changes
        // return the http search observable
        ? this.searchService.search2(term)
        // or the observable of empty heroes if there was no search term
        : Observable.of<Autodata[]>([]))
      .catch(error => {
        // TODO: add real error handling
        console.log(error);
        return Observable.of<Autodata[]>([]);
      });
  }


}
