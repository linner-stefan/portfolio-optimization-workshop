/**
 * Created by Stefan Linner on 11/12/2017.
 */
import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import { WaterfallChartComponent } from './waterfall-chart.component';

@NgModule({

  imports: [
    CommonModule,
  ],
  declarations: [
    WaterfallChartComponent
  ],
  exports: [
    WaterfallChartComponent
  ],
})
export class WaterfallChartModule { }
