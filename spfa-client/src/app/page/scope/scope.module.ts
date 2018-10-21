import {NgModule} from "@angular/core";
import {ReactiveFormsModule} from "@angular/forms";
import {CollapseModule} from "ng2-bootstrap";
import {BaseModule} from "../../base/base.module";
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";
import {
  MdDialogModule,
  MdButtonModule,
  MdSelectModule,
  MdCheckboxModule,
  MdCardModule,
  MdAutocompleteModule,
  MdInputModule,
  MdGridListModule,
  MdDatepickerModule,
  MdNativeDateModule,
  MdProgressSpinnerModule
} from "@angular/material";
import {CalculationLegalEntitiesComponent} from "./calculation-legal-entities.component";
import {SharedModule} from "@app/shared/shared.module";
import {MomentModule} from "angular2-moment";
@NgModule({

  imports: [

    CommonModule,
    RouterModule,
    ReactiveFormsModule,

    MdDialogModule,
    MdCardModule,
    MdGridListModule,
    MdButtonModule,
    MdInputModule,
    MdCheckboxModule,
    MdSelectModule,
    MdDatepickerModule,
    MdAutocompleteModule,
    MdProgressSpinnerModule,
    MdNativeDateModule,

    CollapseModule.forRoot(),
    BaseModule,
    SharedModule,
    MomentModule
  ],
  declarations: [

    CalculationLegalEntitiesComponent
  ],
  entryComponents: [

    CalculationLegalEntitiesComponent
  ],
  exports: [

    CalculationLegalEntitiesComponent,

  ]
})
export class ScopeModule { }
