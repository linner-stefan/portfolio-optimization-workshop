import {Component, ViewEncapsulation, OnDestroy, EventEmitter, Input, OnInit} from "@angular/core";
import {DurationConstraintChartData} from "./duration-constraint-chart.model";
import {CalculationService} from "@app/base/calculation/calculation.service";
import {
  DurationConstraint
} from "@app/base/duration-constraint/duration-constraint.model";
import {CurrencyInfo, Portfolio} from "@app/base/asset-class/asset-class.model";
import {AssetClassUtil} from "@app/base/asset-class/asset-class.util";
import {Observable, Subscription} from "rxjs";
@Component({

  selector: 'duration-constraint-chart',
  templateUrl: 'duration-constraint-chart.component.html',
  styleUrls: ['duration-constraint-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
} )
export class DurationConstraintChartComponent implements OnInit, OnDestroy {

  @Input()
  private onOptimalPortfolioCalculated : EventEmitter<any>;

  @Input()
  private onOptimizeAllocations : EventEmitter<Portfolio>;

  @Input()
  private onUserDefinedPortfolioRefresh : EventEmitter<any>;

  durationConstraints: DurationConstraint[];
  chartData: DurationConstraintChartData;
  currencies: CurrencyInfo[];

  private subscriptionManager = new Subscription();

  constructor(private calculationService: CalculationService) {

    let calculation = calculationService.getCalculation();
    this.durationConstraints = calculation.durationConstraints;
    this.currencies = AssetClassUtil.getAggregatedCurrencies( calculation.assetClasses );

    this.chartData = {

      onRefresh: new EventEmitter(),
      onAdjust: new EventEmitter(),
      navSum: calculation.navSum
    };

    this.subscriptionManager.add( this.chartData.onAdjust.subscribe( () => {

      this.calculationService.calculationChangeHandler.next();

    } ) );

    this.subscriptionManager.add( this.calculationService.calculationRefreshHandler.subscribe( () => {

      this.chartData.onRefresh.next();
    } ) );
  }

  ngOnInit() {

    this.subscriptionManager.add(
      Observable.merge( this.onOptimalPortfolioCalculated, this.onOptimizeAllocations, this.onUserDefinedPortfolioRefresh, this.calculationService.calculationRefreshHandler )
        .debounceTime( 500 )
        .subscribe( () => {

          this.recalculateDurationConstraints();
        } ) );
  }

  ngOnDestroy() {

    this.subscriptionManager.unsubscribe();
  }

  private recalculateDurationConstraints() {

    this.calculationService.recalculateDurationConstraints().subscribe( () => {

      this.chartData.onRefresh.next();
    } );
  }

  collapse( durationConstraint: DurationConstraint ) {

    durationConstraint.collapsed = !durationConstraint.collapsed;
  }
}
