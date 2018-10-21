import {Observable} from "rxjs";
import 'rxjs/add/operator/map';
import {Http} from "@angular/http";
import {environment} from "../../../environments/environment";
import {MahalanobisEllipse} from "./model/mahalanobis-ellipse.model";
import {Injectable} from "@angular/core";

@Injectable()
export class MatlabCalculationsService {

  constructor(private http: Http) {
  }

  mahalanobisEllipse(calculationId: number, rfXName: string, rfYName: string): Observable<MahalanobisEllipse> {
    return this.http.post(environment.url + `/api/matlab/mahalanobisEllipse`, {
      calculationId: calculationId,
      rfXName: rfXName,
      rfYName: rfYName
    })
      .map(response => response.json())
      .map(mahalanobisEllipse => mahalanobisEllipse);
  }


}
