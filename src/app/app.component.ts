import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiServiceService } from './api-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'ints-angular';
  showInput = true;
  showOutput = false;
  private conversionInProgressSub: Subscription;
  constructor(public apiService: ApiServiceService) {

  }
  ngOnInit() {
    this.conversionInProgressSub = this.apiService.getfileConversionDoneListener().subscribe(
      (conversionDone) => {
        if (conversionDone) {
          this.showInput = false;
          this.showOutput = true;
        }
      }
    );
  }

  showInputPanel() {
    console.log("input");
    this.showInput = true;
    this.showOutput = false;
  }

  showOutputPanel() {
    console.log("output")
    this.showInput = false;
    this.showOutput = true;
  }
}
