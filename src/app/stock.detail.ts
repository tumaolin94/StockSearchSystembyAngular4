import { Component, Input, Output} from '@angular/core';
import {SymbolInfo} from './symbolInfo';
import {Newsfeed} from './newsfeed';
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
import 'rxjs/add/operator/toPromise';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/timer';
import { SimpleChanges, OnChanges } from '@angular/core';
import {StockData} from './stockData';

@Component({
  selector: 'stock-detail',
  templateUrl: './stock.detail.html',
   styleUrls: ['./stock.detail.css'],
  // providers: [SearchService]
})

export class StockDetailComponent implements OnChanges {
  @Input() symbol: string;
  @Input() fake_count: number;
  chart;
  smachart;
  options: Object;
  highStockoptions: Object;
  smaOptions: Object;
  newsfeeds: Newsfeed[] = [];
  ops: Object[] = [];
  tags: boolean[] = [];
  price_tag: boolean ;
  news_tag: boolean;
  symbol_info: SymbolInfo = new SymbolInfo();
  temp_array: number[] = [];
  constructor(private http: HttpClient ) {
    this.options = new Object();
    for (let i = 0; i < 10; i++) {
      this.ops.push(new Object());
    }
    for (let i = 0; i < 10; i++) {
      this.tags.push(false);
    }
    this.price_tag = false;
    this.news_tag = false;
  }

  private searchTerms = new Subject<string>();
  tableTest(term: string): void {
    this.searchTerms.next(term);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.symbol_info = this.test(this.symbol);
    console.log(this.symbol_info.price_array);
    // let timer = Observable.timer(600);
    // timer.subscribe(t => {
    //   this.testSMA(0, this.symbol, 'SMA', 1);
    //   this.testSMA(1, this.symbol, 'EMA', 1);
    //   this.testStOCH(2, this.symbol, 'STOCH', 2);
    // });
    // let timer2 = Observable.timer(300);
    // timer2.subscribe(t => {
    //   this.testSMA(3, this.symbol, 'RSI', 1);
    //   this.testThree(6, this.symbol, 'BBANDS', 3);
    //   this.testThree(7, this.symbol, 'MACD', 3);
    // });
    //
    // this.testSMA(4, this.symbol, 'ADX', 1);
    // this.testSMA(5, this.symbol, 'CCI', 1);
    this.testNews(this.symbol);

  }

  // getOption(indicator: String): Object {
  //   return this.smaOptions;
  // }
  // testIncluding() {
  //   this.testSMA(this.smaOptions, this.symbol, 'SMA', 1);
  //     // console.log(this.temp_array);
  //     // this.addPoint();
  //
  // }
  testNews(value: string) {
    if (value == null) {
      return ;
    }
    value = value.toUpperCase();
    const url = 'http://localhost:3000/news?symbol=' + value;
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
        // console.log(item_values[key]['link'][0]);
        if (item_values[key]['link'][0].includes('article')) {
          const title = item_values[key]['title'][0];
          const link = item_values[key]['link'][0];
          const date = item_values[key]['pubDate'][0].substr(0, item_values[key]['pubDate'][0].length - 6);
          const author = item_values[key]['sa:author_name'][0];
          // console.log(item_values[key]['link'][0]);
          console.log(item_values[key]['title'][0]);
          // console.log(item_values[key]['pubDate'][0]);
          // console.log(item_values[key]['pubDate'][0].substr(0, item_values[key]['pubDate'][0].length - 6));
          // console.log(item_values[key]['sa:author_name'][0]);
          this.newsfeeds.push((new Newsfeed(title, link, author, date)));
          count++;
          if ( count === 5 ) break;
          // item_values[key]['pubDate'][0]['pubDate'].substr( 0, -6);
        }
      }
      this.news_tag = true;
    }, err => {
      console.log(value + ' news');
      console.log(err);
    });
  }
  testThree(option: number, value: string, indicator: string, number: number) {
    console.log(option);
    this.tags[option] = false;
    if (value == null) {
      return;
    }
    value = value.toUpperCase();
    const url = 'http://localhost:3000/indicator?indicator=' + indicator + '&symbol=' + value + '&number=3';
    // const url = 'http://localhost:3000/test?indicator=' + indicator + '&symbol=' + value + '&number=2';
    console.log(url);
    this.http.get(url).subscribe(data => {
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
        for (let key in data_values[meta_date]){
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

        for (let i = 0 ; i < number; i++) {
          data_array[i].reverse();
        }
        // let temp_options: Object = this.smaOptions;
        this.ops[option] = {
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
            tickPositioner: function() {
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
            labels: {

            },
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
          legend: {
          },
        };
        console.log(data_array[0]);
        this.temp_array = data_array[0];
        // for (let i = 0 ; i < number; i++) {
        //   this.chart.addSeries({
        //     data: this.temp_array
        //   }, true);
        // }
        // this.addPoint();
        this.tags[option] = true;
      },
      err => {
        console.log(indicator);
        console.log(err);
      });
  }
  testStOCH(option: number, value: string, indicator: string, number: number) {
    console.log(option);
    this.tags[option] = false;
    if (value == null) {
      return;
    }
    value = value.toUpperCase();
    const url = 'http://localhost:3000/indicator?indicator=' + indicator + '&symbol=' + value + '&number=2';
    // const url = 'http://localhost:3000/test?indicator=' + indicator + '&symbol=' + value + '&number=2';
    console.log(url);
    this.http.get(url).subscribe(data => {
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
        for (let key in data_values[meta_date]){
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

        for (let i = 0 ; i < number; i++) {
          data_array[i].reverse();
        }
        // let temp_options: Object = this.smaOptions;
        this.ops[option] = {
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
            tickPositioner: function() {
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
            labels: {

            },
          }],
          series: [{
            threshold: null,
            lineWidth: 1.5,
            name: symbol + ' ' + key_array[0],
            data: data_array[0],
            marker: {
              enabled: false,
            },
          },{
            threshold: null,
            lineWidth: 1.5,
            name: symbol + ' ' + key_array[1],
            data: data_array[1],
            marker: {
              enabled: false,
            },
          }],
          legend: {


          },
        };
        console.log(data_array[0]);
        this.temp_array = data_array[0];
        // for (let i = 0 ; i < number; i++) {
        //   this.chart.addSeries({
        //     data: this.temp_array
        //   }, true);
        // }
        // this.addPoint();
        this.tags[option] = true;
      },
      err => {
        console.log(indicator);
        console.log(err);
      });
  }
  testSMA(option: number, value: string, indicator: string, number: number) {
    console.log(option);
    this.tags[option] = false;
    if (value == null) {
      return;
    }
    value = value.toUpperCase();
    const url = 'http://localhost:3000/indicator?indicator=' + indicator + '&symbol=' + value + '&number=1';
    console.log(url);
    this.http.get(url).subscribe(data => {
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
      for (let key in data_values[meta_date]){
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

      for (let i = 0 ; i < number; i++) {
        data_array[i].reverse();
      }
      // let temp_options: Object = this.smaOptions;
      this.ops[option] = {
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
          tickPositioner: function() {
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
          labels: {

          },
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
        legend: {


        },
      };
      console.log(data_array[0]);
      this.temp_array = data_array[0];
      this.tags[option] = true;
      // for (let i = 0 ; i < number; i++) {
      //   this.chart.addSeries({
      //     data: this.temp_array
      //   }, true);
      // }
      // this.addPoint();
    },
    err => {
      console.log(indicator);
      console.log(err);
    });
    console.log(this.temp_array);
    // this.addPoint();
  }
  test(value: string): SymbolInfo {
    this.price_tag = false;
    if (value == null) {
      return this.symbol_info;
    }
    value = value.toUpperCase();
    console.log('symbol ' + value);
    // const url = `http://localhost:3000/symbol?symbol=` + value ;
    const url = 'http://localhost:3000/testsymbol';
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
          temp_date = temp_date.substr(0, 5 );
        }
        // date.push(temp_date);
        // price_array.push(parseFloat(array_values[key]['4. close']));
        // volume_array.push(parseFloat(array_values[key]['5. volume']));
        // max = Math.max(parseFloat(array_values[key]['4. close']), max);
        // min = Math.min(parseFloat(array_values[key]['4. close']), min);
        // volume_max = Math.max(parseFloat(array_values[key]['5. volume']), volume_max);
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
      this.symbol_info.open = parseFloat(open).toFixed(2);
      this.symbol_info.close = parseFloat(close).toFixed(2);
      this.symbol_info.low = low;
      this.symbol_info.high = high;
      this.symbol_info.symbol = symbol;
      this.symbol_info.timestamp = timestamp;
      const temp_change = (parseFloat(close) - pre_close);
      this.symbol_info.change = temp_change.toFixed(2);
      this.symbol_info.change_per = (temp_change / 100).toFixed(2);
      this.symbol_info.volume = volume ;
      this.symbol_info.range = low + '-' + high;
      console.log(this.symbol_info.price_array);
      const charTitle = symbol + ' Stock Price and Volume';
      this.options = {
        chart: {
          // Explicitly tell the width and height of a chart
          width: null,
          height: null,
          zoomType: 'x'
        },
        title : { text : charTitle },
        subtitle: {
          useHTML: true,
          text: '<a style=\' text-decoration: none\' target=\'_blank\' href=\'https://www.alphavantage.co/\' >Source: Alpha Vantage</a>'
        },
        xAxis: {
          categories: date,
          tickInterval: 5,
          tickPositioner: function() {
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
          max: volume_max * 4
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
      // this.chart.series[0].setData(this.symbol_info.price_array);
      // this.chart.series[1].setData(this.symbol_info.volume_array);
      // this.testData.push(data[0]);
      // console.log(this.testData);
        console.log('stock_date');
        console.log((timestampData));
        this.highStockoptions = {
          chart: {
            zoomType: 'x'
          },
        title : { text : value + 'Stock Value' },
        series : [{
          name : value + 'Stock Value',
          type: 'area',
          data : timestampData,
          tooltip: {
            valueDecimals: 2
          }
        }]
      }
        this.price_tag = true;
    },
      err => {
        console.log(value);
        console.log(err);
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
}
