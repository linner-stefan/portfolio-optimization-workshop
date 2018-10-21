/**
 * Created by Stefan Linner on 7. 8. 2017.
 */
import {NgModule} from "@angular/core";
import {MultiFrontierChartComponent} from "./multi-frontier-chart/multi-frontier-chart.component";
import {
  MdCardModule, MdTooltipModule, MdButtonModule, MdSlideToggleModule, MdSelectModule,
  MdOptionModule, MdInputModule, MdDialogModule,
} from "@angular/material";
import {PortfoliosChartComponent} from "./portfolios-chart/portfolios-chart.component";
import {CommonModule} from "@angular/common";
import {ComparisonPortfoliosChart} from "./portfolios-chart/comparison-portfolios-chart/comparison-portfolios-chart.component";
import {BubbleChartComponent} from "@app/shared/charts/bubble-chart/bubble-chart.component";
import {FormsModule} from "@angular/forms";
import { CopyPortfolioComponent } from './portfolios-chart/copy-portfolio/copy-portfolio.component';

@NgModule({

  imports: [

    CommonModule,
    FormsModule,
    MdCardModule,
    MdDialogModule,
    MdTooltipModule,
    MdButtonModule,
    MdSlideToggleModule,
    MdSelectModule,
    MdOptionModule
  ],
  declarations: [

    PortfoliosChartComponent,
    ComparisonPortfoliosChart,
    MultiFrontierChartComponent,
    BubbleChartComponent,
    CopyPortfolioComponent
  ],
  exports: [

    PortfoliosChartComponent,
    ComparisonPortfoliosChart,
    MultiFrontierChartComponent,
    BubbleChartComponent
  ],
  entryComponents: [
    CopyPortfolioComponent
  ]
})
export class SharedChartsModule { }
