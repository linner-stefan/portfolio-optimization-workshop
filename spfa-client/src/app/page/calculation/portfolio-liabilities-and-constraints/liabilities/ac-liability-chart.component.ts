import {Component, EventEmitter, Input, OnDestroy, OnInit, ViewEncapsulation} from "@angular/core";
import {AssetClassGroup, AssetClass} from "../../../../base/asset-class/asset-class.model";
import {CalculationService} from "../../../../base/calculation/calculation.service";
import {ACLiabilityChartData} from "./ac-liability-chart.model";
import {AssetClassUtil} from "../../../../base/asset-class/asset-class.util";
import {ValueUtil} from "../../../../shared/value.util";
import {JavaCalculationsService} from "@app/base/calculation/java-calculations.service";
@Component({

  selector: 'ac-liability-chart',
  templateUrl: './ac-liability-chart.component.html',
  styleUrls: ['./ac-liability-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ACLiabilityChartComponent implements OnInit, OnDestroy {

  chartData: ACLiabilityChartData;
  assetClassGroups: AssetClassGroup[];
  assetClasses: AssetClass[];

  private onChangeSubscription;
  private onCalculationRefresSubscription;

  liabilitySum: number = -1;

  get isHundred(): boolean {

    return ValueUtil.getBillionRounded( this.liabilitySum ) == ValueUtil.getBillionRounded( this.chartData.liabilitySum );
  }

  constructor(private calculationService: CalculationService,
              private javaCalculationsService: JavaCalculationsService ) { }

  ngOnInit() {

    this.assetClassGroups = this.calculationService.getCalculation().assetClassGroups;
    this.assetClasses = this.calculationService.getCalculation().assetClasses;
    this.chartData = {

      onRefresh: new EventEmitter(),
      onChange: new EventEmitter(),
      liabilitySum: AssetClassUtil.getAssetClassLiabilitySum(this.assetClasses)
    };
    AssetClassUtil.updateLiabilitiesAndMetadata( this.assetClassGroups );
    this.liabilitySum = AssetClassUtil.getAssetClassGroupLiabilitySum( this.assetClassGroups );

    this.onChangeSubscription = this.chartData.onChange.subscribe(() => {

      this.calculationService.calculationChangeHandler.next();
      AssetClassUtil.updateLiabilitiesAndMetadata( this.assetClassGroups );
      this.liabilitySum = AssetClassUtil.getAssetClassGroupLiabilitySum( this.assetClassGroups );
      this.javaCalculationsService.updatePortfolioAttributes(this.calculationService.getCalculation(),
        this.calculationService.calculationRefreshHandler);
      this.chartData.onRefresh.next();
    });

    this.onCalculationRefresSubscription = this.calculationService.calculationRefreshHandler.subscribe(() => {

      this.chartData.liabilitySum = AssetClassUtil.getAssetClassLiabilitySum(this.assetClasses);
      AssetClassUtil.updateLiabilitiesAndMetadata( this.assetClassGroups );
      this.liabilitySum = AssetClassUtil.getAssetClassGroupLiabilitySum( this.assetClassGroups );
      this.chartData.onRefresh.next();
    });
  }

  ngOnDestroy() {

    this.onChangeSubscription.unsubscribe();
    this.onCalculationRefresSubscription.unsubscribe();
  }
}
