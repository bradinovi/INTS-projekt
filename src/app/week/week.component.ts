
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild
} from '@angular/core';
import { min } from 'date-fns'

import { CalendarView, CalendarEvent } from 'angular-calendar';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { addDays, addHours, startOfDay } from 'date-fns';
import { ApiServiceService } from '../api-service.service';
const colors: any = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3'
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF'
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA'
  }
};

@Component({
  selector: 'app-week',
  templateUrl: './week.component.html',
  styleUrls: ['./week.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class WeekComponent implements OnInit {
  startOfDay: number = 6;
  sviRasporedi = [];
  private generiraniRaspored: Subscription;
  public data: {
    fit: number,
    hard_dev: number,
    hard_pos: [],
    jedinka: { dan: number, dvorana: string, grupa: string, kolegij: string, profesor: string, termin: number[] }[]
  }[];

  view: CalendarView = CalendarView.Week;

  viewDate: Date = new Date("2020-01-13T08:00:00");

  daysInWeek = 5;

  events: CalendarEvent[] = [

  ];

  private destroy$ = new Subject();

  constructor(
    private cd: ChangeDetectorRef,
    public apiService: ApiServiceService
  ) {
    console.log(this.viewDate)
    console.log(addHours(this.viewDate, 2))
    this.generiraniRaspored = this.apiService.getgeneriraniRasporedListener().subscribe(
      (data) => {
        console.log("PODACI U KOMPONENTI")
        console.log("data")
        this.data = data;
        this.dodajEvente();
      }
    );
  }



  ngOnInit() {
    const CALENDAR_RESPONSIVE = {
      small: {
        breakpoint: '(max-width: 576px)',
        daysInWeek: 2
      },
      medium: {
        breakpoint: '(max-width: 768px)',
        daysInWeek: 3
      },
      large: {
        breakpoint: '(max-width: 960px)',
        daysInWeek: 5
      }
    };
    this.data = this.apiService.raspored;
    console.log(this.data)
    this.dodajEvente();


  }


  postition = -1;
  onNext() {
    this.postition++;
    if (this.postition >= this.sviRasporedi.length) {
      this.postition = this.sviRasporedi.length - 1;
    }
    this.events = [
      ...this.sviRasporedi[this.postition]
    ];
    let min = this.getTimeOfFirstEvent(this.sviRasporedi[this.postition]);
    this.startOfDay = min;
  }

  getTimeOfFirstEvent(raspored) {
    let dateList = []
    raspored.forEach(event => {
      var date = event.start;
      console.log(event);
      var d = new Date(1, 1, 1, date.getHours(), date.getMinutes(), date.getSeconds(), 0);
      dateList.push(d);
    });
    let minDate = min(dateList);
    console.log(minDate)
    return minDate.getHours();
  }

  onPrev() {
    this.postition--;
    if (this.postition < 0) {
      this.postition = 0;
    }
    this.events = [
      ...this.sviRasporedi[this.postition]
    ];
    let min = this.getTimeOfFirstEvent(this.sviRasporedi[this.postition]);
    this.startOfDay = min;
  }

  fileInputChange(event) {
    var patt = /^.*\.(xls|xlsx)$/;
    let files = event.srcElement.files;
    var myReader: FileReader = new FileReader();
    var file: File = files[0];
    var datatemp;
    //console.log(file)
    myReader.onloadend = e => {
      this.data = JSON.parse(<string>myReader.result);
      console.log(this.data)
      this.dodajEvente();
      console.log(this.sviRasporedi);

    }
    myReader.readAsText(file);
  }

  dodajEvente() {
    this.data.forEach(mog => {
      let raspored = [];
      mog.jedinka.forEach(er => {
        let startEvent = addDays(this.viewDate, er.dan - 1);
        let endEvent = startEvent;
        startEvent = addHours(startEvent, Math.min(...er.termin) - 1)
        endEvent = addHours(endEvent, Math.max(...er.termin));
        var string = "Termini: "
        er.termin.forEach(t => string = string + t + ",")
        var prikazTestini = 'TEST <br>' + string + "<br>" + er.grupa
        var prikaz = er.kolegij + "<br>" +
          er.dvorana + "<br>" + er.grupa + "<br>" + er.profesor
        var event = {
          start: startEvent,
          end: endEvent,
          title: prikaz,
          color: colors.yellow
        }
        raspored.push(event);
        this.events = [
          ...this.events,
          event
        ];

      });
      this.sviRasporedi.push(raspored);
    });
  }
}
