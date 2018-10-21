import {NgModule} from "@angular/core";
import {Route, RouterModule} from "@angular/router";
import {CalculationComponent} from "@app/page/calculation/calculation.component";
import {CalculationResolve} from "@app/page/calculation/calculation.resolve";
import {CalculationGuard} from "@app/page/calculation/calculation.guard";
import {PortfolioLiabilitiesConstraintsComponent} from "@app/page/calculation/portfolio-liabilities-and-constraints/portfolio-liabilities-constraints.component";

const appRoutes : Route[] = [

  {
    path: 'calculation/:id',
    component: CalculationComponent,
    resolve: [ CalculationResolve ],
    canDeactivate: [ CalculationGuard ],
    children: [

      {
        path: 'portfolio-liabilities-and-constraints',
        pathMatch: 'full',
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
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'calculation/1'
  },
  {
    path: '**',
    redirectTo: 'calculation/1'
  }
];

@NgModule({

  imports: [

    RouterModule.forRoot(appRoutes, { useHash: true }),
  ],
  exports: [

    RouterModule
  ]
})
export class AppRoutingModule {

}
