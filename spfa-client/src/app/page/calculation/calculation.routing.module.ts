import {NgModule} from "@angular/core";
import {PortfolioLiabilitiesConstraintsComponent} from "./portfolio-liabilities-and-constraints/portfolio-liabilities-constraints.component";
import {CalculationComponent} from "./calculation.component";
import {Route, RouterModule} from "@angular/router";
import {CalculationResolve} from "./calculation.resolve";
import {CalculationGuard} from "./calculation.guard";

const calculationRoutes : Route[] = [

  {
    path: 'calculation/:id',
    component: CalculationComponent,
    resolve: [ CalculationResolve ],
    canDeactivate: [ CalculationGuard ],
    children: [

      {
        path: 'portfolio-liabilities-and-constraints',
        component: PortfolioLiabilitiesConstraintsComponent
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'portfolio-liabilities-and-constraints'
      },
      {
        path: '**',
        redirectTo: 'portfolio-liabilities-and-constraints'
      }
    ]
  }
];

@NgModule({

  imports: [

    RouterModule.forChild(calculationRoutes),
  ],
  exports: [

    RouterModule
  ]
})
export class CalculationRoutingModule { }
