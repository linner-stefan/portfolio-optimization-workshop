import {NgModule} from "@angular/core";
import {ACConstraintChartComponent} from "./ac-constraint-chart.component";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {BaseModule} from "../../../../base/base.module";
import {SharedModule} from "../../../../shared/shared.module";
import {MdCardModule, MdInputModule, MdCheckboxModule, MdTooltipModule} from "@angular/material";
import {ACConstraintHierarchyComponent} from "./ac-constraint-hierarchy.component";
import {ACConstraintOptionsComponent} from "./ac-constraint-options.component";
import {ACConstraintComponent} from "./ac-constraint.component";
import {ACConstraintNotificationsComponent} from "./notifications/ac-constraint-notifications.component";
import {ACConstraintInfoNotificationsComponent} from "./notifications/ac-constraint-info-notifications.component";
import {ACConstraintWarningNotificationsComponent} from "./notifications/ac-constraint-warning-notifications.component";
@NgModule({

  imports: [

    CommonModule,
    FormsModule,
    BaseModule,
    SharedModule,
    MdCardModule,
    MdInputModule,
    MdCheckboxModule,
    MdTooltipModule,
  ],
  declarations: [

    ACConstraintChartComponent,
    ACConstraintNotificationsComponent,
    ACConstraintInfoNotificationsComponent,
    ACConstraintWarningNotificationsComponent,
    ACConstraintHierarchyComponent,
    ACConstraintOptionsComponent,
    ACConstraintComponent
  ],
  exports: [

    ACConstraintChartComponent
  ]
})
export class ACConstraintModule {

}
