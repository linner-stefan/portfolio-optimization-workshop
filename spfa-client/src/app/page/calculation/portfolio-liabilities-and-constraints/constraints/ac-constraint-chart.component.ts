import {Component, EventEmitter, OnDestroy, OnInit, ViewEncapsulation, Input } from "@angular/core";
import {
  AssetClassGroup, DualConstraint,
  AssetClass, Portfolio
} from "@app/base/asset-class/asset-class.model";
import {AssetClassUtil} from "@app/base/asset-class/asset-class.util";
import {CalculationService} from "@app/base/calculation/calculation.service";
import {ACConstraintChartData} from "./ac-constraint-chart.model";
import {ACConstraintChartUtil} from "./ac-constraint-chart.util";
import {Subject} from "rxjs";
import {NotificationService} from "@app/shared/notification/notification.service";
import {FileUtil} from "@app/util/file.util";
import {MdDialog} from "@angular/material";
import {AssetClassImportCsvComponent} from "@app/page/calculation/portfolio-liabilities-and-constraints/constraints/ac-import-csv.component";
import {JavaCalculationsService} from "@app/base/calculation/java-calculations.service";
import {PortfolioUtil} from "@app/base/calculation/portfolio.util";
@Component({

  selector: 'ac-constraint-chart',
  templateUrl: './ac-constraint-chart.component.html',
  styleUrls: ['./ac-constraint-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ACConstraintChartComponent implements OnInit, OnDestroy {

  @Input()
  private onOptimalPortfolioCalculated: Subject<any>;
  private onOptimalPortfolioCalculatedSubscription;

  @Input()
  private onOptimizeAllocations : EventEmitter<Portfolio>;
  private onOptimizeSubscription;

  @Input()
  private onUserDefinedPortfolioRefresh : EventEmitter<any>;

  private onAdjustSubscription;
  private onCalculationRefresSubscription;
  private onCalculationReimportSubscription;

  assetClassGroups: AssetClassGroup[];
  assetClasses: AssetClass[];
  dualConstraints: DualConstraint[];

  chartData: ACConstraintChartData;

  constructor(private calculationService: CalculationService,
              private notificationService: NotificationService,
              private javaCalculationsService: JavaCalculationsService,
              private dialog: MdDialog) { }

  ngOnInit() {

    let calculation = this.calculationService.getCalculation();
    const portfolioUserDefined = PortfolioUtil.getUserDefinedPortfolio( calculation );

    this.assetClassGroups = calculation.assetClassGroups;
    this.assetClasses = calculation.assetClasses;
    this.dualConstraints = calculation.dualConstraints;

    this.chartData = {

      navSum: calculation.navSum,
      allocationSum: 0,
      onAdjust: new EventEmitter(),
      onRefresh: new EventEmitter(),
    };

    AssetClassUtil.setAssetClassAllocation(this.assetClassGroups, this.chartData.navSum);
    AssetClassUtil.updateConstraintsAndAllocationMetadata(this.assetClassGroups,portfolioUserDefined);
    this.chartData.allocationSum = AssetClassUtil.getAssetClassAllocationSum(this.assetClassGroups);

    this.onAdjustSubscription = this.chartData.onAdjust.subscribe(() => {

      AssetClassUtil.updateConstraintsAndAllocationMetadata(this.assetClassGroups,portfolioUserDefined);
      this.chartData.allocationSum = AssetClassUtil.getAssetClassAllocationSum(this.assetClassGroups);
      this.calculationService.calculationChangeHandler.next();
      this.chartData.onRefresh.next();
      this.onUserDefinedPortfolioRefresh.next();
      // this.javaCalculationsService.updatePortfolioAttributes(calculation, this.calculationService.calculationRefreshHandler);
    });

    this.onCalculationRefresSubscription = this.calculationService.calculationRefreshHandler.subscribe(() => {

      this.chartData.navSum = calculation.navSum;
      AssetClassUtil.setAssetClassAllocation(this.assetClassGroups, this.chartData.navSum);
      AssetClassUtil.updateConstraintsAndAllocationMetadata(this.assetClassGroups,portfolioUserDefined);
      this.chartData.allocationSum = AssetClassUtil.getAssetClassAllocationSum(this.assetClassGroups);
      this.chartData.onRefresh.next();
    });

    this.onCalculationReimportSubscription = this.calculationService.calculationReimportHandler.subscribe(() => {

      this.dualConstraints = calculation.dualConstraints;
    });

    this.onOptimalPortfolioCalculatedSubscription = this.onOptimalPortfolioCalculated.subscribe( () => {

      ACConstraintChartUtil.initOptimalAllocation( this.assetClassGroups,
        PortfolioUtil.getOptimalPortfolio(calculation) );
      AssetClassUtil.updateConstraintsAndAllocationMetadata( this.assetClassGroups,portfolioUserDefined );
      this.chartData.onRefresh.next();
    });

    this.onOptimizeSubscription = this.onOptimizeAllocations.subscribe( (portfolioFrom:Portfolio) => {


      ACConstraintChartUtil.setOptimilAllocations( portfolioFrom, portfolioUserDefined, this.assetClassGroups, this.chartData.navSum );
      AssetClassUtil.updateConstraintsAndAllocationMetadata( this.assetClassGroups, portfolioUserDefined );
      this.chartData.allocationSum = AssetClassUtil.getAssetClassAllocationSum(this.assetClassGroups);
      this.chartData.onRefresh.next();
      this.onUserDefinedPortfolioRefresh.next();
      // this.javaCalculationsService.updatePortfolioAttributes(calculation,
      //   this.calculationService.calculationRefreshHandler);
    });
  }

  ngOnDestroy() {

    this.onAdjustSubscription.unsubscribe();
    this.onCalculationRefresSubscription.unsubscribe();
    this.onCalculationReimportSubscription.unsubscribe();
    this.onOptimalPortfolioCalculatedSubscription.unsubscribe();
    this.onOptimizeAllocations.unsubscribe();
  }

}
