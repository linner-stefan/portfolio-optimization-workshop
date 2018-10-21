import {NgModule} from "@angular/core";
import {UserService} from "@app/base/user/user.service";
import {BusinessUnitService} from "./business-unit/business-unit.service";
import {CalculationService} from "./calculation/calculation.service";
import {HttpModule} from "@angular/http";
import {MatlabCalculationsService} from "@app/base/calculation/matlab-calculations.service";
import {JavaCalculationsService} from "@app/base/calculation/java-calculations.service";
@NgModule({

  imports: [

    HttpModule
  ],
  providers: [

    BusinessUnitService,
    CalculationService,
    UserService,
    MatlabCalculationsService,
    JavaCalculationsService
  ]
})
export class BaseModule {

}
