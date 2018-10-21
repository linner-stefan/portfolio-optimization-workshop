import {NgModule} from "@angular/core";
import {CalculationComponent} from "./calculation.component";
import {CommonModule} from "@angular/common";
import {CalculationRoutingModule} from "./calculation.routing.module";
import {PortfolioLiabilitiesConstraintsModule} from "app/page/calculation/portfolio-liabilities-and-constraints/portfolio-liabilities-constraints.module";
import {CalculationResolve} from "./calculation.resolve";
import {CalculationGuard} from "./calculation.guard";
import {CollapseModule} from "ng2-bootstrap";
import {MdTooltipModule, MdDialogModule, MdCheckboxModule} from "@angular/material";
import {ScopeModule} from "../scope/scope.module";
import {SharedModule} from "@app/shared/shared.module";
@NgModule({

  imports: [

    CommonModule,
    PortfolioLiabilitiesConstraintsModule,
    CollapseModule.forRoot(),
    CalculationRoutingModule,
    MdTooltipModule,
    MdDialogModule,
    MdCheckboxModule,
    ScopeModule,
    SharedModule
  ],
  declarations: [

    CalculationComponent
  ],
  exports: [

    CalculationComponent
  ],
  providers: [

    CalculationResolve,
    CalculationGuard
  ]
})
export class CalculationModule { }
