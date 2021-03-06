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

import { StockDetailComponent } from './stock.detail.component';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [SearchService, StockDetailComponent]
})
export class AppComponent implements OnInit {
  symbol_value: String; /* value of symbol changed in input area*/
  symbol_text;          /* double bind ngmodel*/
  fake_count: number;   /* signal to stock.detail.component*/
  ifClear = false;    /* if click clear button*/
  autodatas: Observable<Autodata[]>; /* arrays of autocomplete data*/
  myValidate = false; /* if input validate*/
  private searchTerms = new Subject<string>(); /* new Subject to get search box change*/

  form = new FormGroup({
    symbol: new FormControl('', [
      Validators.required,
    ]),
  });
  get symbol(): any { return this.form.get('symbol'); }
  constructor(private http: HttpClient, private searchService: SearchService, private stockdetail: StockDetailComponent) {
    this.fake_count = 0;
  }

  /*
  * search function
  * @param {string} symbol value of input box
  * */
  search(value: string): void {
    length = this.symbol.value.replace(/\s/g, '').length;
    console.log(length);
    if (length === 0) {
      this.myValidate = false;
    } else {
      this.myValidate = true;
    }
      this.searchTerms.next(value);
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

  /*
   * click Get Quote button
   * @param {string} symbol value of input box
   * */
  onSubmit(value: string): void {
    this.ifClear = false;
    console.log(value);
    this.symbol_value = value.toUpperCase();
    this.fake_count++;
    this.stockdetail.price_tag = false;
  }
  /*
  * judge if input is validated
  * @return {boolean} iif input is validated for more than one space
  * */
  isDisable(): boolean {
    length = this.symbol.value.replace(/\s/g, '').length;
    console.log(length);
    if (length === 0) {
      return true;
    }
    return false;
  }
  /*
   * click clear button
   * */
  ClickClear() {
    console.log('clear');
    this.symbol.reset();
    // this.stockdetail.ClickClear();
    this.ifClear = true;
    this.fake_count++;
  }


}
