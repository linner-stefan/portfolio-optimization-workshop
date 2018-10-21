import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DistributionChartComponent } from './distribution-chart.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [DistributionChartComponent],
  exports: [DistributionChartComponent]
})
export class DistributionChartModule { }
