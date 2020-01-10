import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { WeekComponent } from './week/week.component';
import { CalendarModule, DateAdapter } from 'angular-calendar';

import * as moment from 'moment';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputRasporedComponent } from './input-raspored/input-raspored.component';





@NgModule({
  declarations: [
    AppComponent,
    WeekComponent,
    InputRasporedComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory
    })
  ],

  exports: [WeekComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
