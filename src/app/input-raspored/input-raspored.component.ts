import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { concat } from 'rxjs';

@Component({
  selector: 'app-input-raspored',
  templateUrl: './input-raspored.component.html',
  styleUrls: ['./input-raspored.component.css']
})
export class InputRasporedComponent implements OnInit {
  showProfesori: boolean = false;
  showDvorane: boolean = false;
  showKolegiji: boolean = false;
  showGrupe: boolean = false;
  showDani: boolean = false;
  showNastava: boolean = false;
  showPrefProf: boolean = false;
  showPrefKoleg: boolean = false;

  formdata;
  dvoraneData;
  kolegijiData;
  grupeData;
  vrijemeData;
  nastavaData;
  prefProfData;
  prefKolegData;

  profesori = [];
  dvorane = [];
  kolegiji = [];
  grupe = [];
  dani = [];
  termini = [];
  nastava = [];
  preferencijeProf = {};

  time = { hour: 13, minute: 30 };

  constructor() {
    this.profesori.push("Borna Radinović")

    this.kolegiji.push("Mreže računala 1")
    this.kolegiji.push("Uzorci dizajna")
    this.dvorane.push({
      "id": 1,
      "naziv": "D1",
      "kapacitet": 50,
      "spec": ["P", "S"]
    })
    this.dvorane.push({
      "id": 2,
      "naziv": "D2",
      "kapacitet": 50,
      "spec": ["P", "S"]
    })
  }

  ngOnInit() {
    this.formdata = new FormGroup({
      imeprez: new FormControl()

    });
    this.dvoraneData = new FormGroup({
      nazivDvorane: new FormControl(),
      kapacitetDvorane: new FormControl(),
      specDvorane: new FormControl()
    });
    this.kolegijiData = new FormGroup({
      nazivKolegija: new FormControl()
    });
    this.grupeData = new FormGroup({
      nazivGrupe: new FormControl(),
      kapacitetGrupe: new FormControl()
    });
    this.vrijemeData = new FormGroup({
      daniRas: new FormControl(),
      terminiRas: new FormControl()
    });
    this.nastavaData = new FormGroup({
      profId: new FormControl(),
      kolegijId: new FormControl(),
      grupaId: new FormControl(),
      trajanjeNastave: new FormControl(),
      tipNastave: new FormControl()
    });

    this.prefProfData = new FormGroup({
      profId: new FormControl(),
      dan: new FormControl(),
      prefTerminiOd: new FormControl(),
      prefTerminiDo: new FormControl(),
    });

    this.prefKolegData = new FormGroup({
      kolegijIdp: new FormControl(),
      dvoranaIdp: new FormControl(),
      prefTerminiOd: new FormControl(),
      prefTerminiDo: new FormControl()
    });
  }

  onClickSubmit(data) {
    //console.log(data);
    this.profesori.push(data.imeprez);
  }

  onClickSubmitDvorane(data) {
    //console.log(data);
    this.dvorane.push({
      naziv: data.nazivDvorane,
      kapacitet: data.kapacitetDvorane,
      spec: data.specDvorane,
    })
  }

  onClickSubmitKolegiji(data) {
    //console.log(data);
    this.kolegiji.push(data.nazivKolegija);
  }

  onClickSubmitGrupe(data) {
    //console.log(data);
    this.grupe.push({
      naziv: data.nazivGrupe,
      kapacitet: data.kapacitetDvorane
    });
  }

  onClickSubmitVrijeme(data) {
    let brTermina = data.terminiRas;
    let brDana = data.daniRas;
    this.termini = [...Array(brTermina + 1).keys()]
    this.dani = [...Array(brDana + 1).keys()]
    this.termini.shift();
    this.dani.shift();
    console.log(this.termini);
    console.log(this.dani);
  }

  onNastavaSubmit(data) {
    console.log(data)
    this.nastava.push({
      p_id: data.profId,
      k_id: data.kolegijId,
      g_id: data.grupaId,
      trajanje: data.trajanjeNastave,
      dvorana: data.tipNastave
    })
  }

  onPrefProfDataSubmit(data) {
    //console.log(data);
    let newData = <string>data.prefTermini;
    let newDataArr = newData.split(",");
    newDataArr.forEach(e => e.trim());
    let pid = data.profId;
    let oldData = { dan: 0, termini: [] };


    var pref = {
      p_id: data.profId,
      odabir: []
    }

    pref.odabir.push({ dan: data.dan, termini: concat(oldData.termini, newDataArr) });

  }

  dodajTerminPrefProf() {
    let val = this.prefProfData.value;
    //console.log(val);
    if (val.profId == null) return;
    if (typeof this.preferencijeProf[val.profId] === "undefined") {
      this.preferencijeProf[val.profId] = {};
      this.preferencijeProf[val.profId][val.dan] = [];
    } else if (typeof this.preferencijeProf[val.profId][val.dan] === "undefined") {
      this.preferencijeProf[val.profId][val.dan] = [];
    }
    this.preferencijeProf[val.profId][val.dan].push({ od: val.prefTerminiOd, do: val.prefTerminiDo });
    console.log(this.preferencijeProf);
  }

  checkPrefProfExist() {
    let val = this.prefProfData.value;
    if (this.prefProfData.value.profId == null || this.prefProfData.value.dan == null) return false;
    if (typeof this.preferencijeProf[val.profId] === "undefined") {
      return false;
    } else if (typeof this.preferencijeProf[val.profId][val.dan] === "undefined") {
      return false;
    }
    return true;
  }

  removePrefProf(index) {
    console.log("remove pref prof")
    let val = this.prefProfData.value;
    this.preferencijeProf[val.profId][val.dan].splice(index, 1);
  }

  onPreferencijeKolegijuSubmit(data) {
    console.log(data)
  }

  checkPrefKolegExist() {
    return false;
  }


  showProfesoriClick() {
    this.showProfesori = true;
    this.showDvorane = false;
    this.showKolegiji = false;
    this.showGrupe = false;
    this.showDani = false;
    this.showNastava = false;
    this.showPrefProf = false;
    this.showPrefKoleg = false;
  }

  showDvoraneClick() {
    this.showProfesori = false;
    this.showDvorane = true;
    this.showKolegiji = false;
    this.showGrupe = false;
    this.showDani = false;
    this.showNastava = false;
    this.showPrefProf = false;
    this.showPrefKoleg = false;

  }
  showKolegijiClick() {
    this.showProfesori = false;
    this.showDvorane = false;
    this.showKolegiji = true;
    this.showGrupe = false;
    this.showDani = false;
    this.showNastava = false;
    this.showPrefProf = false;
    this.showPrefKoleg = false;

  }
  showGrupeClick() {
    this.showProfesori = false;
    this.showDvorane = false;
    this.showKolegiji = false;
    this.showGrupe = true;
    this.showDani = false;
    this.showNastava = false;
    this.showPrefProf = false;
    this.showPrefKoleg = false;
  }
  showDaniTermClick() {
    this.showProfesori = false;
    this.showDvorane = false;
    this.showKolegiji = false;
    this.showGrupe = false;
    this.showDani = true;
    this.showNastava = false;
    this.showPrefProf = false;
    this.showPrefKoleg = false;
  }

  showNastavaClick() {
    this.showProfesori = false;
    this.showDvorane = false;
    this.showKolegiji = false;
    this.showGrupe = false;
    this.showDani = false;
    this.showNastava = true;
    this.showPrefProf = false;
    this.showPrefKoleg = false;

  }

  showPrefProfClick() {
    this.showProfesori = false;
    this.showDvorane = false;
    this.showKolegiji = false;
    this.showGrupe = false;
    this.showDani = false;
    this.showNastava = false;
    this.showPrefProf = true;
    this.showPrefKoleg = false;
  }

  showPrefKolegClick() {
    this.showProfesori = false;
    this.showDvorane = false;
    this.showKolegiji = false;
    this.showGrupe = false;
    this.showDani = false;
    this.showNastava = false;
    this.showPrefProf = false;
    this.showPrefKoleg = true;
  }

}
