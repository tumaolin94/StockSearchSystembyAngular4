import { Component } from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {NgForm} from '@angular/forms';
import {Observable} from 'rxjs/Observable';
import { OnInit } from '@angular/core';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  symbol_text;
  form = new FormGroup({
    symbol: new FormControl('', [
      Validators.required,
    ]),
  });
  get symbol(): any { return this.form.get('symbol'); }
  filteredStates: Observable<any[]>;

  states: any[] = [
    {
      name: 'Arkansas',
    },
    {
      name: 'California',
    },
    {
      name: 'Florida',
    },
    {
      name: 'Texas',
    }
  ];

  constructor() {
    this.filteredStates = this.symbol.valueChanges
      .startWith(null)
      .map(state => state ? this.filterStates(state) : this.states.slice());
  }

  filterStates(name: string) {
    return this.states.filter(state =>
      state.name.toLowerCase().indexOf(name.toLowerCase()) === 0);
  }

}
