import {Component, Input, ViewEncapsulation, ViewChild, ElementRef, AfterViewInit, Renderer2, NgZone} from "@angular/core";
import {DurationConstraintChartData} from "./duration-constraint-chart.model";
import {DurationConstraint} from "../../../../base/duration-constraint/duration-constraint.model";
import {SliderDragBuilder} from "../../../../util/slider-drag.util";
import {ValueUtil} from "../../../../shared/value.util";
import {CurrencyInfo} from "../../../../base/asset-class/asset-class.model";
@Component({

  selector: 'currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CurrencyComponent {

  @Input('currency')
  currencyInfo: CurrencyInfo;

  @Input()
  chartData: DurationConstraintChartData;

  constructor( ) { }

  get left() {

    return ( this.totalPerc ) *100;
  }

  get totalPerc() : number {

    return this.currencyInfo.total /this.chartData.navSum
  }
}
