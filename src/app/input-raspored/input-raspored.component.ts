import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { concat } from 'rxjs';
import { validateEvents } from 'angular-calendar/modules/common/util';
import { ApiServiceService } from '../api-service.service';

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
  algoritamData;

  profesori = [];
  dvorane = [];
  kolegiji = [];
  grupe = [];
  dani = [];
  termini = [];
  nastava = [];
  preferencijeProf = {};
  preferencijeKoleg = {};
  time = { hour: 13, minute: 30 };

  OUTPUT;

  constructor(public apiService: ApiServiceService) {
    /*
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
    }) */
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
      terminiPrefProf: new FormControl(),
      prefTerminiDo: new FormControl(),
    });

    this.prefKolegData = new FormGroup({
      kolegijIdp: new FormControl(),
      dvoranaIdp: new FormControl(),
      terminiPrefKoleg: new FormControl(),
      prefTerminiDo: new FormControl()
    });

    this.algoritamData = new FormGroup({
      max_gen: new FormControl(),
      n_pop: new FormControl(),
      mut_a: new FormControl(),
      mut_b: new FormControl(),
      p_cross: new FormControl(),
      tournament_size: new FormControl(),
      n_best: new FormControl(),
      popunjenostDvorane: new FormControl(),
      max_razmak_grupe: new FormControl(),
      dnevni_limit: new FormControl()
    });
  }

  generiraj() {
    this.OUTPUT = {}
    this.OUTPUT.nastavnici = [];
    this.profesori.forEach((e, index) => {
      this.OUTPUT.nastavnici.push({ id: index, preime: e });
    });
    this.OUTPUT.dvorane = [];
    this.dvorane.forEach((e, index) => {
      this.OUTPUT.dvorane.push({ id: index, naziv: e.naziv, kapacitet: e.kapacitet, spec: e.spec });
    });
    this.OUTPUT.kolegiji = [];
    this.kolegiji.forEach((e, index) => {
      this.OUTPUT.kolegiji.push({ id: index, naziv: e });
    });

    this.OUTPUT.grupe = [];
    this.grupe.forEach((e, index) => {
      this.OUTPUT.grupe.push({ id: index, naziv: e.naziv, kapacitet: e.kapacitet });
    });
    this.OUTPUT.dani = this.dani;
    this.OUTPUT.termini = this.termini;
    this.OUTPUT.nastava = this.nastava;

    this.OUTPUT.preferencije = { profesori: [], kolegiji: [] };
    for (const [key, value] of Object.entries(this.preferencijeProf)) {
      let profId = key;
      let profPredObj = { p_id: parseInt(profId), odabir: [] }
      for (const [key2, value2] of Object.entries(value)) {
        let dan = key2;
        let termini = value2;
        profPredObj.odabir.push({ dan: parseInt(dan), termini: termini })
      }
      this.OUTPUT.preferencije.profesori.push(profPredObj);
    }

    for (const [key, value] of Object.entries(this.preferencijeKoleg)) {
      let kolegijId = key;
      this.OUTPUT.preferencije.kolegiji.push({
        k_id: parseInt(kolegijId),
        odabir: value
      });
    }
    this.OUTPUT.parametri = {
      max_gen: parseFloat(this.algoritamData.value.max_gen),
      n_pop: parseFloat(this.algoritamData.value.n_pop),
      mut: {
        a: parseFloat(this.algoritamData.value.mut_a),
        b: parseFloat(this.algoritamData.value.mut_b)
      },
      p_cross: parseFloat(this.algoritamData.value.p_cross),
      tournament_size: parseFloat(this.algoritamData.value.tournament_size),
      n_best: parseFloat(this.algoritamData.value.n_best)
    }
    this.OUTPUT.preferencije.dvorane = { aktivan: true, popunjenost: parseFloat(this.algoritamData.value.popunjenostDvorane) };
    this.OUTPUT.preferencije.grupe = { aktivan: true, max_razmak: parseFloat(this.algoritamData.value.max_razmak_grupe) };
    this.OUTPUT.preferencije.dnevni_limit = {
      aktivan: true, limit: parseInt(this.algoritamData.value.dnevni_limit)
    };
    console.log(this.OUTPUT);
    this.apiService.sendData(this.OUTPUT);
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
      kapacitet: data.kapacitetGrupe
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
    // console.log(data)
    this.nastava.push({
      p_id: parseInt(data.profId),
      k_id: parseInt(data.kolegijId),
      g_id: parseInt(data.grupaId),
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
    let termini = val.terminiPrefProf.split(',');
    termini.forEach(t => t.trim());
    termini.forEach(t => this.preferencijeProf[val.profId][val.dan].push(t));
    //this.preferencijeProf[val.profId][val.dan] = concat(this.preferencijeProf[val.profId][val.dan], termini)
    //console.log(this.preferencijeProf);
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

  dodajTerminPrefKoleg() {
    let val = this.prefKolegData.value;
    if (val.kolegijIdp == null) return;
    if (typeof this.preferencijeKoleg[val.kolegijIdp] === "undefined") {
      this.preferencijeKoleg[val.kolegijIdp] = [];
    }
    let dvorane = [];
    val.dvoranaIdp.forEach(element => {
      dvorane.push(parseInt(element))
    });
    let termini = val.terminiPrefKoleg.split(',');
    termini.forEach(t => t.trim());
    this.preferencijeKoleg[val.kolegijIdp].push(
      {
        dvorane: dvorane,
        termini: termini
      }
    );
    console.log(this.preferencijeKoleg);
  }

  checkPrefKolegExist() {
    let val = this.prefKolegData.value;
    if (this.prefKolegData.value.kolegijIdp == null) return false;
    if (typeof this.preferencijeKoleg[val.kolegijIdp] === "undefined") {
      return false;
    } else if (typeof this.preferencijeKoleg[val.kolegijIdp] === "undefined") {
      return false;
    }
    return true;
  }

  removePrefKoleg(index) {
    let val = this.prefKolegData.value;
    this.preferencijeKoleg[val.kolegijIdp].splice(index, 1);
  }

  onClickSubmitAlgoritamData(data) {

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
  tekstRepPrefKoleg(kolegijData) {
    //console.log(kolegijData);
    let string = "";
    kolegijData.dvorane.forEach(e => {
      string = string + " " + this.dvorane[e].naziv;
    });
    string = string + " = "
    kolegijData.termini.forEach(e => {
      string = string + " " + e;
    });
    return string
  }
}
