import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, Router} from "@angular/router";
import {Calculation} from "../../base/calculation/model/calculation.model";
import {Observable} from "rxjs/Observable";
import {CalculationService} from "../../base/calculation/calculation.service";
@Injectable()
export class CalculationResolve implements Resolve<Calculation> {

  constructor(private calculationService: CalculationService, private router: Router) {
  }

  resolve(activatedRoute: ActivatedRouteSnapshot): Promise<Calculation> | Calculation {

    let result = this.calculationService.fetchCalculation(activatedRoute.params['id']);
    if ((<Calculation>result).id)
      return <Calculation>result;

    return new Promise<Calculation>((resolve, reject) => {

      console.log("CalculationResolve",result);

      (<Observable<Calculation>>result).subscribe(calculation => {

        resolve(calculation);

      }, error => {

        // this.router.navigate(['/calculation/1']);
        reject(error);
      });
    });
  }
}
