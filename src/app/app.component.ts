import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ints-angular';
  showInput = true;
  showOutput = false;

  showInputPanel() {
    console.log("input")
    this.showInput = true;
    this.showOutput = false;
  }

  showOutputPanel() {
    console.log("output")
    this.showInput = false;
    this.showOutput = true;
  }
}
