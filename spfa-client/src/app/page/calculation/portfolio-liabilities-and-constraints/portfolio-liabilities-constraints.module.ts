import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {PortfolioLiabilitiesConstraintsComponent} from "./portfolio-liabilities-constraints.component";
import {BaseModule} from "../../../base/base.module";
import {SharedModule} from "../../../shared/shared.module";
import {ACLiabilityChartComponent} from "./liabilities/ac-liability-chart.component";
import {ACLiabilityHierarchyComponent} from "./liabilities/ac-liability-hierarchy.component";
import {ACLiabilityComponent} from "./liabilities/ac-liability.component";
import {
  MdCardModule, MdInputModule, MdCheckboxModule, MdTooltipModule, MdTabsModule, MdButtonModule,
  MdDialogModule, MdIconModule
} from "@angular/material";
import {ACConstraintModule} from "./constraints/ac-constraint.module";
import {SSTRatioComponent} from "./sst-retio/sst-ratio.component";
import {DurationConstraintChartComponent} from "./duration-constraints/duration-constraint-chart.component";
import {DurationConstraintComponent} from "./duration-constraints/duration-constraint.component";
import {CurrencyComponent} from "./duration-constraints/currency.component";
import {SharedChartsModule} from "../../../shared/charts/shared-charts.module";
import {DurationConstraintLowestComponent} from "./duration-constraints/duration-constraint-lowest.component";
import {AssetClassImportCsvComponent} from "@app/page/calculation/portfolio-liabilities-and-constraints/constraints/ac-import-csv.component";
import { SpRatioComponent } from './sp-ratio/sp-ratio.component';
@NgModule({

  imports: [

    CommonModule,
    FormsModule,
    BaseModule,
    SharedModule,
    SharedChartsModule,
    MdCardModule,
    MdInputModule,
    MdCheckboxModule,
    MdTooltipModule,
    MdTabsModule,
    MdIconModule,
    ACConstraintModule,
    MdDialogModule,
    MdButtonModule
  ],
  declarations: [

    PortfolioLiabilitiesConstraintsComponent,
    ACLiabilityChartComponent,
    ACLiabilityHierarchyComponent,
    ACLiabilityComponent,
    DurationConstraintChartComponent,
    DurationConstraintComponent,
    DurationConstraintLowestComponent,
    CurrencyComponent,
    SSTRatioComponent,
    AssetClassImportCsvComponent,
    SpRatioComponent
  ],
  exports: [

    PortfolioLiabilitiesConstraintsComponent
  ],
  entryComponents: [

    AssetClassImportCsvComponent
  ],
})
export class PortfolioLiabilitiesConstraintsModule { }
