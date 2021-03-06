import {Component, Input, Output, AfterViewInit, ChangeDetectorRef} from '@angular/core';
import {SymbolInfo} from './symbolInfo';
import {Newsfeed} from './newsfeed';
import {HttpClient} from '@angular/common/http';
import {HttpParams, HttpHeaders} from '@angular/common/http';
import {OnInit} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import 'rxjs/add/observable/timer';
import {SimpleChanges, OnChanges} from '@angular/core';
import {StockData} from './stockData';
import {SaveData} from './saveData';
import {
  FacebookService,
  LoginResponse,
  LoginOptions,
  UIResponse,
  UIParams,
  FBVideoComponent,
  InitParams
} from 'ngx-facebook';
import {trigger, state, style, transition, animate, keyframes} from '@angular/animations';
import * as moment from 'moment-timezone';
declare var jquery: any;
declare var $: any;
@Component({
  selector: 'stock-detail',
  templateUrl: './stock.detail.component.html',
  styleUrls: ['./stock.detail.component.css'],
  animations: [
    trigger('rightToright', [
      state('in', style({transform: 'translateX(0)'})),
      transition('void => in', [
        style({transform: 'translateX(100%)'}),
        animate(500)
      ]),
    ]),
    trigger('leftToright', [
      state('in', style({transform: 'translateX(0)'})),
      transition('void => in', [
        style({transform: 'translateX(-100%)'}),
        animate(500)
      ])
    ]),
  ]
  // providers: [SearchService]
})

export class StockDetailComponent implements OnChanges, AfterViewInit {
  @Input() symbol: string;
  @Input() fake_count: number;
  @Input() ifClear: boolean;
  chart;
  options: Object; /* options of Price and Volume chart */
  highStockoptions: Object; /* options of highStock */
  newsfeeds: Newsfeed[] = []; /* arrays of newsfeed */
  ops: Object[] = []; /* arrays of options for indicator charts */
  tags: boolean[] = []; /* arrays of tags, if get data successfully */
  error_tags: boolean[] = []; /* arrays of error_tags, if get data unsuccessfully*/
  price_tag: boolean; /* if get price data successfully */
  price_error_tag = false; /* if get price data unsuccessfully */
  table_tag: boolean; /* if get symbol data successfully */
  table_error_tag = false; /* if get symbol data unsuccessfully */
  news_tag: boolean; /* if get news data successfully */
  news_error_tag = false; /* if get news data unsuccessfully */
  symbol_info: SymbolInfo = new SymbolInfo(); /* completed symbol information*/
  temp_array: number[] = []; /*an temp array*/
  tag_number = 9; /* current number of tags*/
  state: string = 'first'; /* initialize annimation sliding state*/
  left: boolean = true; /* judge slide direction, true -> from left, false -> from right*/
  myStorage = window.localStorage; /* local storage */
  save_symbol; /* saving symbol's name */
  save_datas: SaveData[]; /* datas of save_symbol */
  chosenOption = 'Default'; /*order options*/
  chosenOrder = 'Adcending';/* Adcending or descending */
  disableOrder = true; /* if can excute sort*/
  isAbleSlide = true; /* if able to slide*/
  checkboxValue = false; /* auto fresh state*/
  ifBindToggle = true; /* binding toggle every time change to favorite list*/
  sub: Subscription; /* Subscription */
  timer; /* timer */

  constructor(private http: HttpClient, private fb: FacebookService, private cdr: ChangeDetectorRef) {
    // this. bindToggle();
    this.isAbleSlide = true;
    this.options = new Object();
    for (let i = 0; i < 10; i++) {
      this.ops.push(new Object());
    }
    for (let i = 0; i < 10; i++) {
      this.tags.push(false);
      this.error_tags.push(false);
    }
    this.price_tag = false;
    this.news_tag = false;
    this.table_tag =false;
    let initParams: InitParams = {
      appId: '260545224469898',
      xfbml: true,
      version: 'v2.8'
    };

    fb.init(initParams);

    if (localStorage.getItem('save_symbol') == null) {
      this.save_symbol = [];
    } else {
      this.save_symbol = JSON.parse(localStorage.getItem('save_symbol'));
    }
    console.log(this.save_symbol);

    if (localStorage.getItem('save_datas') == null) {
      this.save_datas = [];
    } else {
      this.save_datas = JSON.parse(localStorage.getItem('save_datas'));
    }
  }

  private searchTerms = new Subject<string>();

  tableTest(term: string): void {
    this.searchTerms.next(term);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.ifClear) {
      this.ClickClear();
    } else {
      this.test(this.symbol);
      this.symbol_info = this.fetchSymbolTable(this.symbol);
      console.log(this.symbol_info.price_array);
      let timer = Observable.timer(600);
      timer.subscribe(t => {
        this.fetchOnelinedata(0, this.symbol, 'SMA', 1);
        this.fetchOnelinedata(1, this.symbol, 'EMA', 1);
        this.fetchTwolinedata(2, this.symbol, 'STOCH', 2);
      });
      let timer2 = Observable.timer(300);
      timer2.subscribe(t => {
        this.fetchOnelinedata(3, this.symbol, 'RSI', 1);
        this.fetchThreelinedata(6, this.symbol, 'BBANDS', 3);
        this.fetchThreelinedata(7, this.symbol, 'MACD', 3);
      });

      this.fetchOnelinedata(4, this.symbol, 'ADX', 1);
      this.fetchOnelinedata(5, this.symbol, 'CCI', 1);
      this.fetchNews(this.symbol);
    }


  }

  /*
  * fetch news feed
  * @param {string} value, symbol name
  * */
  fetchNews(value: string) {
    this.news_tag = false;
    this.news_error_tag = false;
    if (value == null) {
      return;
    }
    if (this.left === true) {
      this.animateMe();
    }
    value = value.toUpperCase();
    // const url = 'http://localhost:3000/news?symbol=' + value;
    const url = 'http://maolintustock.azurewebsites.net/news?symbol=' + value;
    console.log(url);
    this.news_tag = false;
    this.http.get(url).subscribe(data => {
      this.newsfeeds = [];
      console.log(data);
      let array_values = data['rss'];
      console.log(array_values);
      let item_values = array_values['channel'][0]['item'];
      console.log(item_values);
      let count = 0;
      for (let key in item_values) {
        if (item_values[key]['link'][0].includes('article')) {
          const title = item_values[key]['title'][0];
          const link = item_values[key]['link'][0];
          let date = item_values[key]['pubDate'][0];
          date = this.formatTimeZone(date, 'US/Eastern');
          const author = item_values[key]['sa:author_name'][0];
          console.log(item_values[key]['title'][0]);
          this.newsfeeds.push((new Newsfeed(title, link, author, date)));
          count++;
          if (count === 5) break;
        }
      }
      this.news_tag = true;
      this.news_error_tag = false;
    }, err => {
      console.log(value + ' news');
      console.log(err);
      this.news_error_tag = true;
    });
  }
  /*
  * fetch chart data with three lines and export charts
  * @param {number} option, chart option numbers
  * @param {string} value, symbol name
  * @param {string} indicator, indicator name
  * @param {number} number, line number
  * */
  fetchThreelinedata(option: number, value: string, indicator: string, number: number) {
    console.log(option);
    this.tags[option] = false;
    this.error_tags[option] = false;
    if (value == null) {
      return;
    }
    value = value.toUpperCase();
    const url = 'http://maolintustock.azurewebsites.net/indicator?indicator=' + indicator + '&symbol=' + value + '&number=3';
    // const url = 'http://localhost:3000/test?indicator=' + indicator + '&symbol=' + value + '&number=2';
    console.log(url);
    this.http.get(url).subscribe(data => {
        if (data == null || !data.hasOwnProperty('Meta Data')) {
          this.error_tags[option] = true;
          return;
        }
        console.log(data);
        let meta = data['Meta Data'];
        let symbol = meta['1: Symbol'];
        let fullname = meta['2: Indicator']; //full name
        let data_values = data['Technical Analysis: ' + indicator]; //full size data
        let meta_date = meta['3: Last Refreshed'];
        let date: string[] = [];
        let key_array = new Array();
        let data_array = new Array();
        let max = -1000000000;
        let min = 1000000000;
        let volume_max = -1000000000;
        let count = 0;
        for (let i = 0; i < number; i++) {
          data_array[i] = new Array();
        }
        for (let key in data_values[meta_date]) {
          console.log(key);
          key_array.push(key);
        }
        for (let key in data_values) {
          let temp_date = key.substring(5).replace(/-/g, '\/');
          if (temp_date.length > 5) {
            temp_date = temp_date.substr(0, 5);
          }
          date.push(temp_date);
          for (let i = 0; i < number; i++) {
            data_array[i].push(parseFloat(data_values[key][key_array[i]]));
          }
          if (count === 126) {
            break;
          }
          count++;
        }
        date.reverse();

        for (let i = 0; i < number; i++) {
          data_array[i].reverse();
        }
        // let temp_options: Object = this.smaOptions;
        this.ops[option] = {
          responsive: {
            rules: [{
              condition: {
                maxWidth: 500
              },
              chartOptions: {
                xAxis: {
                  categories: date,
                  tickInterval: 15,
                  tickPositioner: function () {
                    let res = [];
                    for (let i = 0; i < this.categories.length; i++) {
                      if (i % 15 === 0) {
                        res.push(this.categories.length - i - 1);
                      }
                    }
                    return res;
                  }
                }
              }
            }]
          },
          chart: {
            zoomType: 'x'
          },
          title: {
            text: fullname
          },
          subtitle: {
            useHTML: true,
            text: '<a style=\' text-decoration: none\' target=\'_blank\' href=\'https://www.alphavantage.co/\' >Source: Alpha Vantage</a>'
          },
          xAxis: {
            categories: date,
            tickInterval: 5,
            tickPositioner: function () {
              let res = [];
              for (let i = 0; i < this.categories.length; i++) {
                if (i % 5 === 0) {
                  res.push(this.categories.length - i - 1);
                }
              }
              return res;
            }
          },
          yAxis: [{
            title: {
              text: indicator
            },
            labels: {},
          }],
          series: [{
            threshold: null,
            lineWidth: 1.5,
            name: symbol + ' ' + key_array[0],
            data: data_array[0],
            marker: {
              enabled: false,
            },
          }, {
            threshold: null,
            lineWidth: 1.5,
            name: symbol + ' ' + key_array[1],
            data: data_array[1],
            marker: {
              enabled: false,
            },
          }, {
            threshold: null,
            lineWidth: 1.5,
            name: symbol + ' ' + key_array[2],
            data: data_array[2],
            marker: {
              enabled: false,
            },
          }],
          legend: {},
        };
        console.log(data_array[0]);
        this.temp_array = data_array[0];
        this.tags[option] = true;
        this.error_tags[option] = false;
      },
      err => {
        console.log(indicator);
        console.log(err);
        this.error_tags[option] = true;
      });
  }
  /*
  * fetch chart data with two lines and export charts
  * @param {number} option, chart option numbers
  * @param {string} value, symbol name
  * @param {string} indicator, indicator name
  * @param {number} number, line number
  * */
  fetchTwolinedata(option: number, value: string, indicator: string, number: number) {
    console.log(option);
    this.tags[option] = false;
    this.error_tags[option] = false;
    if (value == null) {
      return;
    }
    value = value.toUpperCase();
    const url = 'http://maolintustock.azurewebsites.net/indicator?indicator=' + indicator + '&symbol=' + value + '&number=2';
    // const url = 'http://localhost:3000/test?indicator=' + indicator + '&symbol=' + value + '&number=2';
    console.log(url);
    this.http.get(url).subscribe(data => {
        if (data == null || !data.hasOwnProperty('Meta Data')) {
          this.error_tags[option] = true;
          return;
        }
        console.log(data);
        let meta = data['Meta Data'];
        let symbol = meta['1: Symbol'];
        let fullname = meta['2: Indicator']; //full name
        let data_values = data['Technical Analysis: ' + indicator]; //full size data
        let meta_date = meta['3: Last Refreshed'];
        let date: string[] = [];
        let key_array = new Array();
        let data_array = new Array();
        let max = -1000000000;
        let min = 1000000000;
        let volume_max = -1000000000;
        let count = 0;
        for (let i = 0; i < number; i++) {
          data_array[i] = new Array();
        }
        for (let key in data_values[meta_date]) {
          console.log(key);
          key_array.push(key);
        }
        for (let key in data_values) {
          let temp_date = key.substring(5).replace(/-/g, '\/');
          if (temp_date.length > 5) {
            temp_date = temp_date.substr(0, 5);
          }
          date.push(temp_date);
          for (let i = 0; i < number; i++) {
            data_array[i].push(parseFloat(data_values[key][key_array[i]]));
          }
          if (count === 126) {
            break;
          }
          count++;
        }
        date.reverse();

        for (let i = 0; i < number; i++) {
          data_array[i].reverse();
        }
        // let temp_options: Object = this.smaOptions;
        this.ops[option] = {
          responsive: {
            rules: [{
              condition: {
                maxWidth: 500
              },
              chartOptions: {
                xAxis: {
                  categories: date,
                  tickInterval: 15,
                  tickPositioner: function () {
                    let res = [];
                    for (let i = 0; i < this.categories.length; i++) {
                      if (i % 15 === 0) {
                        res.push(this.categories.length - i - 1);
                      }
                    }
                    return res;
                  }
                }
              }
            }]
          },
          chart: {
            zoomType: 'x'
          },
          title: {
            text: fullname
          },
          subtitle: {
            useHTML: true,
            text: '<a style=\' text-decoration: none\' target=\'_blank\' href=\'https://www.alphavantage.co/\' >Source: Alpha Vantage</a>'
          },
          xAxis: {
            categories: date,
            tickInterval: 5,
            tickPositioner: function () {
              let res = [];
              for (let i = 0; i < this.categories.length; i++) {
                if (i % 5 === 0) {
                  res.push(this.categories.length - i - 1);
                }
              }
              return res;
            }
          },
          yAxis: [{
            title: {
              text: indicator
            },
            labels: {},
          }],
          series: [{
            threshold: null,
            lineWidth: 1.5,
            name: symbol + ' ' + key_array[0],
            data: data_array[0],
            marker: {
              enabled: false,
            },
          }, {
            threshold: null,
            lineWidth: 1.5,
            name: symbol + ' ' + key_array[1],
            data: data_array[1],
            marker: {
              enabled: false,
            },
          }],
          legend: {},
        };
        console.log(data_array[0]);
        this.temp_array = data_array[0];
        this.tags[option] = true;
        this.error_tags[option] = false;
      },
      err => {
        console.log(indicator);
        console.log(err);
        this.error_tags[option] = true;
      });
  }
  /*
  * fetch chart data with one lines and export charts
  * @param {number} option, chart option numbers
  * @param {string} value, symbol name
  * @param {string} indicator, indicator name
  * @param {number} number, line number
  * */
  fetchOnelinedata(option: number, value: string, indicator: string, number: number) {
    console.log(option);
    this.tags[option] = false;
    this.error_tags[option] = false;
    if (value == null) {
      return;
    }
    value = value.toUpperCase();
    const url = 'http://maolintustock.azurewebsites.net/indicator?indicator=' + indicator + '&symbol=' + value + '&number=1';
    console.log(url);
    this.http.get(url).subscribe(data => {
        if (data == null || !data.hasOwnProperty('Meta Data')) {
          this.error_tags[option] = true;
          return;
        }
        console.log(data);
        let meta = data['Meta Data'];
        let symbol = meta['1: Symbol'];
        let fullname = meta['2: Indicator']; //full name
        let data_values = data['Technical Analysis: ' + indicator]; //full size data
        let meta_date = meta['3: Last Refreshed'];
        let date: string[] = [];
        let key_array = new Array();
        let data_array = new Array();
        let max = -1000000000;
        let min = 1000000000;
        let volume_max = -1000000000;
        let count = 0;
        for (let i = 0; i < number; i++) {
          data_array[i] = new Array();
        }
        for (let key in data_values[meta_date]) {
          console.log(key);
          key_array.push(key);
        }
        for (let key in data_values) {
          let temp_date = key.substring(5).replace(/-/g, '\/');
          if (temp_date.length > 5) {
            temp_date = temp_date.substr(0, 5);
          }
          date.push(temp_date);
          for (let i = 0; i < key_array.length; i++) {
            data_array[i].push(parseFloat(data_values[key][key_array[i]]));
          }
          if (count === 126) {
            break;
          }
          count++;
        }
        date.reverse();

        for (let i = 0; i < number; i++) {
          data_array[i].reverse();
        }
        // let temp_options: Object = this.smaOptions;
        this.ops[option] = {
          responsive: {
            rules: [{
              condition: {
                maxWidth: 500
              },
              chartOptions: {
                xAxis: {
                  categories: date,
                  tickInterval: 15,
                  tickPositioner: function () {
                    let res = [];
                    for (let i = 0; i < this.categories.length; i++) {
                      if (i % 15 === 0) {
                        res.push(this.categories.length - i - 1);
                      }
                    }
                    return res;
                  }
                }
              }
            }]
          },
          chart: {
            zoomType: 'x'
          },
          title: {
            text: fullname
          },
          subtitle: {
            useHTML: true,
            text: '<a style=\' text-decoration: none\' target=\'_blank\' href=\'https://www.alphavantage.co/\' >Source: Alpha Vantage</a>'
          },
          xAxis: {
            categories: date,
            tickInterval: 5,
            tickPositioner: function () {
              let res = [];
              for (let i = 0; i < this.categories.length; i++) {
                if (i % 5 === 0) {
                  res.push(this.categories.length - i - 1);
                }
              }
              return res;
            }
          },
          yAxis: [{
            title: {
              text: indicator
            },
            labels: {},
          }],
          series: [{
            threshold: null,
            lineWidth: 1.5,
            name: symbol + ' ' + key_array[0],
            data: data_array[0],
            marker: {
              enabled: false,
            }
          }],
          legend: {},
        };
        console.log(data_array[0]);
        this.temp_array = data_array[0];
        this.tags[option] = true;
        this.error_tags[option] = false;
      },
      err => {
        console.log(indicator);
        console.log(err);
        this.error_tags[option] = true;
      });
    console.log(this.temp_array);
  }
  /*
  * fetch symbol information
  * @param {string} value, symbol name
  * */
  test(value: string) {
    if (value == null) {
      return;
    }
    this.price_tag = false;
    this.price_error_tag = false;
    this.isAbleSlide = false;
    this.ifBindToggle = false;
    value = value.toUpperCase();
    console.log('symbol ' + value);
    const url = `http://maolintustock.azurewebsites.net/symbol?symbol=` + value;
    // const url = 'http://localhost:3000/testsymbol';
    console.log(url);
    this.http.get(url).subscribe(data => {
        // Read the result field from the JSON response.
        console.log(data);
        if ( data.hasOwnProperty('Error Message')) {
          this.price_error_tag = true;
          return;
        }
        const meta = data['Meta Data'];
        console.log('meta');
        console.log(meta);
        const array_values = data['Time Series (Daily)'];
        const symbol = meta['2. Symbol'];
        let timestamp = meta['3. Last Refreshed'];
        if ( timestamp.length < 12) {
          timestamp = timestamp + ' 16:00:00';
        }
        console.log(array_values);
        let open = '';
        let close = '';
        let low = '';
        let high = '';
        let volume = '';
        let count = 0;
        let pre_close = 0;
        let max = -1000000000;
        let min = 1000000000;
        let volume_max = -1000000000;
        let date: string[] = [];
        let price_array: number[] = [];
        let volume_array: number[] = [];
        let timestampData = [];
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
          if (count === 1) {
            pre_close = array_values[key]['4. close'];
          }
          let temp_date = key.substring(5).replace(/-/g, '\/');
          if (temp_date.length > 5) {
            temp_date = temp_date.substr(0, 5);
          }
          timestampData.push([new Date(key).getTime(), parseFloat(array_values[key]['4. close'])]);
          if (count < 126) {
            // break;
            date.push(temp_date);
            price_array.push(parseFloat(array_values[key]['4. close']));
            volume_array.push(parseFloat(array_values[key]['5. volume']));
            max = Math.max(parseFloat(array_values[key]['4. close']), max);
            min = Math.min(parseFloat(array_values[key]['4. close']), min);
            volume_max = Math.max(parseFloat(array_values[key]['5. volume']), volume_max);
          }
          count++;
        }
        price_array.reverse();
        volume_array.reverse();
        date.reverse();
        timestampData.reverse();
        low = parseFloat(low).toFixed(2);
        high = parseFloat(high).toFixed(2);

        const temp_change = (parseFloat(close) - pre_close);

        const charTitle = symbol + ' Stock Price and Volume';
        this.options = {
          responsive: {
            rules: [{
              condition: {
                maxWidth: 500
              },
              chartOptions: {
                xAxis: {
                  categories: date,
                  tickInterval: 15,
                  tickPositioner: function () {
                    let res = [];
                    for (let i = 0; i < this.categories.length; i++) {
                      if (i % 15 === 0) {
                        res.push(this.categories.length - i - 1);
                      }
                    }
                    return res;
                  }
                }
              }
            }]
          },
          chart: {
            // Explicitly tell the width and height of a chart
            width: null,
            height: null,
            zoomType: 'x'
          },
          title: {text: charTitle},
          subtitle: {
            useHTML: true,
            text: '<a style=\' text-decoration: none\' target=\'_blank\' href=\'https://www.alphavantage.co/\' >Source: Alpha Vantage</a>'
          },
          xAxis: {
            categories: date,
            tickInterval: 5,
            tickPositioner: function () {
              let res = [];
              for (let i = 0; i < this.categories.length; i++) {
                if (i % 5 === 0) {
                  res.push(this.categories.length - i - 1);
                }
              }
              return res;
            }
          },
          yAxis: [{
            title: {
              text: 'Stock Price'
            },

            min: min * 0.8,
          }, {
            title: {
              text: 'Volume'
            },

            opposite: true,
            max: volume_max * 2
          }],
          series: [{
            name: 'Price',
            type: 'area',
            threshold: null,
            lineWidth: 1,
            lineColor: 'blue',
            data: price_array,
            fillOpacity: 0.5,
            marker: {
              enabled: false
            },
            tooltip: {
              valueDecimals: 2
            }

          }, {
            name: ' Volume',
            type: 'column',
            color: 'red',
            yAxis: 1,
            data: volume_array
          }],
        };
        console.log('stock_date');
        console.log((timestampData));
        this.highStockoptions = {
          chart: {
            zoomType: 'x'
          },
          title: {text: value + ' Stock Value'},
          series: [{
            name: value + ' Stock Value',
            type: 'area',
            data: timestampData,
            tooltip: {
              valueDecimals: 2
            }
          }]
        }
        this.price_tag = true;
        this.price_error_tag = false;
      },
      err => {
        console.log(value);
        console.log(err);
        this.price_error_tag = true;
      });
  }

  /*
* fetch symbol Table show information
* @param {string} value, symbol name
* */
  fetchSymbolTable(value: string): SymbolInfo {
    if (value == null) {
      return this.symbol_info;
    }
    this.table_tag = false;
    this.table_error_tag = false;
    value = value.toUpperCase();
    console.log('symbol ' + value);
    const url = `http://maolintustock.azurewebsites.net/symbol?symbol=` + value;
    // const url = 'http://localhost:3000/testsymbol';
    console.log(url);
    this.http.get(url).subscribe(data => {
        // Read the result field from the JSON response.
        console.log('fetchSymbolTable');
        console.log(data);
        if (data == null ||  data.hasOwnProperty('Error Message')) {
          console.log('data error');
          this.table_error_tag = true;
          return;
        }
        const meta = data['Meta Data'];
        console.log('meta');
        console.log(meta);
        const array_values = data['Time Series (Daily)'];
        const symbol = meta['2. Symbol'];
        let timestamp = meta['3. Last Refreshed'];
        if ( timestamp.length < 12) {
          timestamp = timestamp + ' 16:00:00';
        }
        console.log(array_values);
        let open = '';
        let close = '';
        let low = '';
        let high = '';
        let volume = '';
        let count = 0;
        let pre_close = 0;
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
          if (count === 1) {
            pre_close = array_values[key]['4. close'];
            break;
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
        const temp_change = (parseFloat(close) - pre_close);
        this.symbol_info.change = temp_change.toFixed(2);
        this.symbol_info.change_per = (temp_change / pre_close * 100).toFixed(2);
        this.symbol_info.volume = volume;
        this.symbol_info.new_volume = volume.replace(/\B(?=(?:\d{3})+\b)/g, ',');
        this.symbol_info.range = low + '-' + high;
        console.log(this.symbol_info.price_array);
        this.table_tag = true;
        this.table_error_tag = false;
      },
      err => {
        console.log(value);
        console.log(err);
        this.table_error_tag = true;
      });
    return this.symbol_info;
  }

  saveChart(chartInstance) {
    this.chart = chartInstance;
  }

  addPoint() {
    console.log(this.temp_array);
    this.chart.addSeries({
      data: this.temp_array
    }, true);
  }

  /**
   * This is a convenience method for the sake of this example project.
   * Do not use this in production, it's better to handle errors separately.
   * @param error
   */
  private handleError(error) {
    console.error('Error processing action', error);
    alert('Not Posted!');
  }

  share() {
    let dataString = '';
    if (this.tag_number === 9) {
      dataString = encodeURIComponent(JSON.stringify(this.options));
      console.log( JSON.stringify(this.options));
      // dataString = encodeURI('async=false&type=jpeg&width=600&options=' + JSON.stringify(this.options));
    } else {
      dataString = encodeURIComponent(JSON.stringify(this.ops[this.tag_number]));
      // dataString = encodeURI('async=false&type=jpeg&width=600&options=' + JSON.stringify(this.ops[this.tag_number]));
    }
    // const Url = 'http://localhost:3000/fb';
    const Url = 'https://maolintustock.azurewebsites.net/fb';
    const exportUrl = 'http://export.highcharts.com/';

    console.log( dataString);
    this.http.get(Url + '?options=' + dataString, { responseType: 'text'}).subscribe( data => {
            console.log(data);
            console.log(exportUrl + data);
            const options: UIParams = {
              method: 'feed',
              link: exportUrl + data,
            };

            this.fb.ui(options)
              .then((res: UIResponse) => {
                alert('Posted Successful!');
              })
              .catch(this.handleError);
      },
      err => {
        console.log('error');
        console.log(err);
      });
  }
  /*
  * change current tag number
  * @param {string} value, indicator name
  * */
  changeTagNumber(value: string) {
    switch (value) {
      case 'Price': {
        this.tag_number = 9;
        break;
      }
      case 'SMA': {
        this.tag_number = 0;
        break;
      }
      case 'EMA': {
        this.tag_number = 1;
        break;
      }
      case 'STOCH': {
        this.tag_number = 2;
        break;
      }
      case 'RSI': {
        this.tag_number = 3;
        break;
      }
      case 'ADX': {
        this.tag_number = 4;
        break;
      }
      case 'CCI': {
        this.tag_number = 5;
        break;
      }
      case 'BBANDS': {
        this.tag_number = 6;
        break;
      }
      case 'MACD': {
        this.tag_number = 7;
        break;
      }
    }
    console.log((this.tag_number));
  }

  isFBVaild(): boolean {
    if (this.tag_number === 9) {
      return this.price_tag&&this.table_tag;
    } else {
      return this.tags[this.tag_number];
    }
  }

  /*
  * slide between two views
  * */
  animateMe() {
    console.log($('#toggle-one').bootstrapToggle());
    if (this.state === 'first') {
      this.state = 'in';
    }
    this.tag_number = 9;
    this.ifBindToggle = false;
    console.log('animateMe');
    this.left = (this.left ? false : true);
  }

  bookmark2() {
    let save_symbol;
    if (localStorage.getItem('save_symbol') == null) {
      save_symbol = [];
    } else {
      save_symbol = JSON.parse(localStorage.getItem('save_symbol'));
    }
    save_symbol.push(this.symbol.toUpperCase());
    this.save_symbol.push(this.symbol.toUpperCase());

    localStorage.setItem('save_symbol', JSON.stringify(save_symbol));
    console.log(this.myStorage.getItem('save_symbol'));
  }
  /*
  * join current symbol to bookmark
  * */
  bookmark() {
    let save_datas: SaveData[];
    if (localStorage.getItem('save_datas') == null) {
      save_datas = [];
    } else {
      save_datas = JSON.parse(localStorage.getItem('save_datas'));
    }
    save_datas.push(new SaveData(this.symbol.toUpperCase(), parseFloat(this.symbol_info.close),
      parseFloat(this.symbol_info.change), parseFloat(this.symbol_info.change_per), parseInt(this.symbol_info.volume), Date.now().toString()));
    this.save_datas.push(new SaveData(this.symbol.toUpperCase(), parseFloat(this.symbol_info.close),
      parseFloat(this.symbol_info.change), parseFloat(this.symbol_info.change_per), parseInt(this.symbol_info.volume), Date.now().toString()));
    localStorage.setItem('save_datas', JSON.stringify(save_datas));
    console.log(this.myStorage.getItem('save_datas'));
  }
  /*
  * delete current symbol from bookmark
  * @param {string} value, symbol name
  * */
  delete(symbol: String) {
    console.log('delete' + symbol);
    for (let key in this.save_datas) {
      console.log(this.save_datas[key].save_name);
      if (this.save_datas[key].save_name === symbol) {
        console.log('delete' + symbol);
        this.save_datas.splice(parseInt(key), 1);
        console.log(this.save_datas);
        localStorage.setItem('save_datas', JSON.stringify(this.save_datas));
        break;
      }
    }
  }
  /*
  * click save symbol
  * @param {string} value, symbol name
  * */
  clickSaveSymbol(symbol: string) {
    console.log(symbol + ' ' + this.symbol);
    this.isAbleSlide = false;
    this.animateMe();
    if (symbol === this.symbol) {
    } else {
      this.tag_number = 9;
      this.symbol = symbol;
      this.test(symbol);
      this.symbol_info = this.fetchSymbolTable(this.symbol);
      let timer = Observable.timer(600);
      timer.subscribe(t => {
      this.fetchOnelinedata(0, this.symbol, 'SMA', 1);
        this.fetchOnelinedata(1, this.symbol, 'EMA', 1);
        this.fetchTwolinedata(2, this.symbol, 'STOCH', 2);
      });
      let timer2 = Observable.timer(300);
      timer2.subscribe(t => {
        this.fetchOnelinedata(3, this.symbol, 'RSI', 1);
        this.fetchThreelinedata(6, this.symbol, 'BBANDS', 3);
        this.fetchThreelinedata(7, this.symbol, 'MACD', 3);
      });

      this.fetchOnelinedata(4, this.symbol, 'ADX', 1);
      this.fetchOnelinedata(5, this.symbol, 'CCI', 1);
      this.fetchNews(this.symbol);
    }

  }
  /*
  * choosing sort catalog
  * */
  chooseOrderby() {

    console.log('choosing:' + this.chosenOption);
    if (this.chosenOption === 'Default') {
      this.disableOrder = true;
    } else {
      this.disableOrder = false;
    }
  }
  /*
  * choosing sort order
  * */
  orderby(): string {
    // console.log('orderby:' + this.chosenOption);
    this.bindToggle();
    switch (this.chosenOption) {
      case 'Default': {
        return 'save_time';
      }
      case 'Symbol': {
        return 'save_name';
      }
      case 'Price': {
        return 'save_price';
      }
      case 'Change': {
        return 'save_change';
      }
      case 'Change Percent': {
        return 'save_change_per';
      }
      case 'Volume': {
        return 'save_volume';
      }
    }
  }
  /*
  * adcending or decsending
  * @return {boolean} if adcending
  * */
  isAdcending(): boolean {
    // console.log(this.chosenOrder);
    if (this.chosenOrder === 'Adcending') {
      return false;
    } else {
      return true;
    }
  }
  /*
* bind toggle button
* */
  bindToggle() {
    if (this.ifBindToggle === false) {
      console.log('ifBindToggle' + false);
      $('#toggle-one').bootstrapToggle();
      $('#toggle-one').change((event) => {
        this.toggleValueChanged(event.target.checked);
      });
      this.ifBindToggle = true;
    }

  }
  /*
* refresh save symbol
* */
  refresh() {
    // this.bindToggle();
    console.log('before refresh');
    console.log(this.save_datas);
    for (let i in this.save_datas) {
      const url = `http://maolintustock.azurewebsites.net/symbol?symbol=` + this.save_datas[i].save_name;
      // const url = 'http://localhost:3000/testsymbol';
      console.log(url);
    this.refreshData(i, url);

    }
    console.log('after refresh');
    console.log(this.save_datas);
  }
  /*
* refresh save refreshData
* */
  refreshData(index: string, url: string ) {
    this.http.get(url).subscribe( data => {
        const meta = data['Meta Data'];
        const array_values = data['Time Series (Daily)'];
        const symbol = meta['2. Symbol'];
        const timestamp = meta['3. Last Refreshed'];
        let open = '';
        let close = '';
        let volume = '';
        let count = 0;
        let pre_close = 0;
        for (let key in array_values) {
          // console.log(key);
          if (count === 0) {
            open = array_values[key]['1. open'];
            console.log(open);
            close = array_values[key]['4. close'];
            volume = array_values[key]['5. volume'];
          }
          if (count === 1) {
            pre_close = array_values[key]['4. close'];
          }
          count++;
        }
        const temp_change = (parseFloat(close) - pre_close);
        this.save_datas[index].save_change = parseFloat(temp_change.toFixed(2));
        this.save_datas[index].save_change_per = parseFloat((temp_change / pre_close * 100).toFixed(2));
        this.save_datas[index].save_price = parseFloat(close).toFixed(2);
        this.save_datas[index].save_volume = parseInt(volume);
        this.save_datas[index].save_new_volume = volume.replace(/\B(?=(?:\d{3})+\b)/g, ',');
        console.log('refresh ' + this.save_datas[index].save_name);
        console.log('refresh ' + this.save_datas[index].save_price);
      },
      err => {
        console.log(err);
      });
  }

  ngAfterViewInit() {
    this.tag_number = 9;
    $('#toggle-one').bootstrapToggle();
    $('#toggle-one').change((event) => {
      this.toggleValueChanged(event.target.checked);
    });
  }
  /*
  * auto refresh
  * @param {boolean} toggleValue, if permit auto refresh
  * */
  toggleValueChanged(toggleValue: boolean) {
    this.checkboxValue = toggleValue;

    console.log('toggle changed', this.checkboxValue);
    if (this.checkboxValue === true) {
      console.log('toggle inner ', this.checkboxValue);
      console.log(this.save_datas);
      this.timer = Observable.timer(0, 5000); //delay, period
      this.sub = this.timer.subscribe(t => {
        this.refresh();
        this.cdr.detectChanges();
      });

    } else {
      console.log('toggle inner ', this.checkboxValue);
      this.sub.unsubscribe();
    }
  }
  /*
  * if show yellow star or not
  * @return {boolean} toggleValue, if show yellow star or not
  * */
  isYellowStar(): boolean {
    // console.log(this.symbol);
    for (let key in this.save_datas) {
      if (this.save_datas[key].save_name === this.symbol) {
        // console.log('isYellowStar' + this.symbol_info.symbol);
        return true;
      }
    }
    return false;
  }
  /*
   * formatTimeZone
   * @return {string} date, date from news feed data
   * @return {string} timezone, 'US/Eastern'
   * */
  formatTimeZone(date, timezone) {
    let comma = date.indexOf(",");
    console.log(date);
    date = date.substring(0, comma) + date.substring(comma + 1);
    let time = moment.tz(date, timezone).format('ddd, DD MMM YYYY HH:mm:ss');
    let timeZoneName = moment.tz(date, timezone).format('zz');
    let newTime = time + ' ' + timeZoneName;
    console.log(newTime);
    return newTime;
  }
  /*
   * click clear button
   * */
  ClickClear() {
    this.tag_number = 9;
    console.log('clearinner');
    if (this.symbol == null ) {
      console.log(this.price_tag);
    } else {
      console.log('not null');
      this.left = true;
      this.isAbleSlide = true;
    }
  }

}
