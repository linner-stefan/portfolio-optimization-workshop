import {
  Component,
  EventEmitter,
  ViewEncapsulation,
  OnDestroy,
  ViewChild,
  OnInit,
  AfterViewChecked,
  ChangeDetectorRef
} from "@angular/core";
import {InterpolatedPortfolio} from "@app/shared/charts/multi-frontier-chart/multi-frontier-chart.model";
import {BehaviorSubject, Subscription} from "rxjs";
import {CalculationService} from "@app/base/calculation/calculation.service";
import {Portfolio, AssetClassGroup} from "@app/base/asset-class/asset-class.model";
import {Calculation} from "@app/base/calculation/model/calculation.model";
import {MultiFrontierChartComponent} from "@app/shared/charts/multi-frontier-chart/multi-frontier-chart.component";
import {PortfoliosChartComponent} from "@app/shared/charts/portfolios-chart/portfolios-chart.component";
import {FrontierDistanceConfig} from "@app/shared/charts/bubble-chart/config/impl/frontier-distance-config";
import {JavaCalculationsService} from "@app/base/calculation/java-calculations.service";
@Component({

  templateUrl: './portfolio-liabilities-constraints.component.html',
  styleUrls: ['./portfolio-liabilities-constraints.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PortfolioLiabilitiesConstraintsComponent implements OnDestroy, OnInit, AfterViewChecked {

  @ViewChild(MultiFrontierChartComponent) frontierChart: MultiFrontierChartComponent;
  @ViewChild(PortfoliosChartComponent) portfoliosChart: PortfoliosChartComponent;

  private calculation: Calculation;

  private onRefreshSubscription: Subscription;

  onInterpolatedPortfolio = new BehaviorSubject<InterpolatedPortfolio[]>(null);
  efficientPortfolios: Portfolio[][];
  individualPortfolios: Portfolio[];

  onSSTRatioChange = new EventEmitter();
  onOptimalTrackingErrorChange = new EventEmitter();
  onOptimalPortfolioCalculated = new BehaviorSubject(null);
  onOptimizeAllocations = new EventEmitter<Portfolio>();
  onUserDefinedPortfolioRefresh = new EventEmitter();

  constructor(
    private calculationService: CalculationService,
    private javaCalculationsService: JavaCalculationsService,
    private changeDetector: ChangeDetectorRef) {

    this.calculation = calculationService.getCalculation();

    this.updateInputs();
  }

  ngOnInit(): void {

    this.onRefreshSubscription = this.calculationService.calculationRefreshHandler.subscribe( () => {
      // update portfolio chart inputs, will be effective after this subscribe handler ends
      // now only needed for copy function to work properly after apply
      this.updateInputs();
      // first update portfolios chart based on update portfolio allocations before this subscribe handler
      this.portfoliosChart.onCalculationRefresh();
      //then update frontier chart, and frontier chart updates vertical selector
      // and emits onInterpolatedPortfolio to portfolios chart and updates optimal portfolio
      this.frontierChart.onCalculationRefresh();
    });

    this.onOptimizeAllocations.subscribe( () => this.calculationService.calculationChangeHandler.next() )
  }

  ngAfterViewChecked(): void {
    this.changeDetector.detectChanges(); // to prevent child "Expression has changed after it has been checked" errors
  }

  ngOnDestroy(): void {
    if ( this.onRefreshSubscription )
      this.onRefreshSubscription.unsubscribe();
  }

  private updateInputs(){
    this.efficientPortfolios = [];
    this.individualPortfolios = [];

    this.efficientPortfolios.push( this.calculation.efficientPortfoliosUser );
  }

}
