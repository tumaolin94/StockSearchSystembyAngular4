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
  selector: 'app-price',
  templateUrl: './price.value.component.html',
  // styleUrls: ['./stock.detail.component.css'],
  // providers: [SearchService]
})

export class PriceVolumeComponent {
  @Input() symbol_info: SymbolInfo;
  chart;
  options: Object;
  constructor() {
    this.options = {
      title : { text : 'angular2-highcharts example' },
      series: [{
        name: 's1',
        data: [2,3,5,8,13],
        allowPointSelect: true
      },{
        name: 's2',
        data: [-2,-3,-5,-8,-13],
        allowPointSelect: true
      }]
    };
  }

  saveInstance(chartInstance) {
    this.chart = chartInstance;
  }

  addPoint() {
    this.chart.series[0].addPoint(Math.random() * 10);
    this.chart.series[1].addPoint(Math.random() * -10);
  }
  onPointSelect(point) {
    alert(`${point.y} is selected`);
  }
  onSeriesHide(series) {
    alert(`${series.name} is selected`);
  }
}
