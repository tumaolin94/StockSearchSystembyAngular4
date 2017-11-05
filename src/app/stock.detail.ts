import { Component, Input, Output} from '@angular/core';
import {SymbolInfo} from './symbolInfo';
import { HttpClient } from '@angular/common/http';
import { OnInit } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import { SimpleChanges, OnChanges } from '@angular/core';
@Component({
  selector: 'stock-detail',
  templateUrl: './stock.detail.html',
   // styleUrls: ['./stock.detail.css'],
  // providers: [SearchService]
})

export class StockDetailComponent implements OnChanges {
  @Input() symbol: string;
  symbol_value = '123';
  symbol_info: SymbolInfo = new SymbolInfo();
  constructor(private http: HttpClient ) {
  }

  private searchTerms = new Subject<string>();
  tableTest(term: string): void {
    this.searchTerms.next(term);
  }
  ngOnChanges(changes: SimpleChanges) {
    this.symbol_info = this.test(this.symbol);
  }
  test2() {
    this.symbol_value = this.symbol_value;
  }
  test(value: string): SymbolInfo {
    if (value == null) {
      return this.symbol_info;
    }
    console.log('symbol ' + value);
    this.symbol_value = '456';
    console.log('symbol_value' + this.symbol_value);
    const url = `http://localhost:3000/symbol?symbol=` + value ;
    console.log(url);
    this.http.get(url).subscribe(data => {
      // Read the result field from the JSON response.
      console.log(data);
      const meta = data['Meta Data'];
      console.log('meta');
      console.log(meta);
      const array_values = data['Time Series (Daily)'];
      const symbol = meta['2. Symbol'];
      const timestamp = meta['3. Last Refreshed'];
      console.log(array_values);
      let open = '';
      let close = '';
      let low = '';
      let high = '';
      let volume = '';
      let count = 0;
      for (let key in array_values) {
        // console.log(key);
          if (count === 0) {
            open = array_values[key]['1. open'];
            console.log(open);
            close = array_values[key]['4. close'];
            low = array_values[key]['3. low'];
            high = array_values[key]['2. high'];
            volume = array_values[key]['5. volume'];
          }
          count++;
      }
      low = parseFloat(low).toFixed(2);
      high = parseFloat(high).toFixed(2);
      this.symbol_info.open = parseFloat(open).toFixed(2);
      this.symbol_info.close = parseFloat(close).toFixed(2);
      this.symbol_info.low = low;
      this.symbol_info.high = high;
      this.symbol_info.symbol = symbol;
      this.symbol_info.timestamp = timestamp;
      const temp_change = parseFloat(high) - parseFloat(low) ;
      this.symbol_info.change = temp_change.toFixed(2);
      this.symbol_info.change_per = (temp_change / 100).toFixed(2);
      this.symbol_info.volume = volume ;
      this.symbol_info.range = low + '-' + high;
      console.log(open);
      console.log(close);
      console.log(low);
      console.log(high);
      console.log(volume);
      // this.testData.push(data[0]);
      // console.log(this.testData);
    });
    return this.symbol_info;
  }
}
