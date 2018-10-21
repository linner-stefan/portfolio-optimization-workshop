import {Injectable} from "@angular/core";
import {CanDeactivate, Router} from "@angular/router";
import {CalculationService} from "../../base/calculation/calculation.service";
@Injectable()
export class CalculationGuard implements CanDeactivate<CanDeactivateCalculation> {

  constructor(private calculationService: CalculationService) { }

  canDeactivate(component: CanDeactivateCalculation) {

    if (this.calculationService.hasChanges()) {

      component.canNotDeactivate();
      return false;
    }

    return true;
  }
}

export interface CanDeactivateCalculation {

  canNotDeactivate() : void;
}
