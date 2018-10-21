import {Injectable} from "@angular/core";
import {Http} from "@angular/http";
import {Observable} from "rxjs/Observable";
import 'rxjs/add/observable/of';
import {environment} from "../../../environments/environment";
import {BusinessUnit, LegalEntity} from "./business-unit.model";
@Injectable()
export class BusinessUnitService {

  constructor(private http: Http) { }

  private businessUnits: BusinessUnit[];

  getBusinessUnits() : Observable<BusinessUnit[]> {

    if (this.businessUnits)
      return Observable.of(this.businessUnits);

    return this.http.get(environment.url + '/api/business-unit')
      .map(response => this.businessUnits = response.json());
  }
}
