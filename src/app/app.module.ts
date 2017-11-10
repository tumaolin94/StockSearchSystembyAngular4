import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { MatFormFieldModule } from '@angular/material';
import { MatInputModule } from '@angular/material';
import {MatAutocompleteModule} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule } from '@angular/http';
import {JsonpModule, Jsonp, Response} from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { StockDetailComponent } from './stock.detail';
import { ChartModule } from 'angular2-highcharts';
import { PriceVolumeComponent } from './price.value.component';
import { HighchartsStatic } from 'angular2-highcharts/dist/HighchartsService';
import { FacebookModule } from 'ngx-facebook';
import { OrderModule } from 'ngx-order-pipe';
import { MomentModule } from 'angular2-moment';
declare let require: any;
export function highchartsFactory() {
  const hc = require('highcharts/highstock');
  const dd = require('highcharts/modules/exporting');
  dd(hc);
  return hc;
}
@NgModule({
  declarations: [
    AppComponent,
    StockDetailComponent,
    PriceVolumeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpModule,
    JsonpModule,
    HttpClientModule,
    ChartModule,
    FacebookModule.forRoot(),
    OrderModule,
    MomentModule
  ],
  providers: [{
    provide: HighchartsStatic,
    useFactory: highchartsFactory
  }],
  bootstrap: [AppComponent],
})
export class AppModule { }
