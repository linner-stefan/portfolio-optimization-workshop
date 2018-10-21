import {Component, EventEmitter, Input, OnDestroy, OnInit, ViewEncapsulation} from "@angular/core";
import {CalculationService} from "../../../../base/calculation/calculation.service";
import {RiskFactor, RiskFactorGroup, InvestmentView} from "../../../../base/risk-factor/risk-factor.model";
import {RFSpreadLevelChartData} from "./rf-spread-level-chart.model";
import {NotificationService} from "@app/shared/notification/notification.service";
import {FileUtil} from "@app/util/file.util";
import {MdDialog} from "@angular/material";
import {ErrorUtil} from "@app/util/error.util";

@Component({

  selector: 'rf-spred-level-chart',
  templateUrl: './rf-spread-level-chart.component.html',
  styleUrls: ['./rf-spread-level-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RFSpreadLevelChartComponent implements OnInit, OnDestroy {

  @Input()
  onSelectMahalanobisAxisX: EventEmitter<RiskFactor>;
  @Input()
  onSelectMahalanobisAxisY: EventEmitter<RiskFactor>;
  @Input()
  onSelectMahalanobisAxis = new EventEmitter<any>();

  @Input()
  onChange:EventEmitter<any>;
  private onChangeSubscription;

  onRefresh = new EventEmitter();
  private onCalculationRefreshSubscription;

  riskFactorGroups: RiskFactorGroup[];
  private riskFactors: RiskFactor[];

  chartData: RFSpreadLevelChartData;

  levelOptions: Array<{id: string, name: string}>;

  constructor (private calculationService: CalculationService, private notificationService: NotificationService, private dialog: MdDialog) { }

  ngOnInit() {

    this.riskFactorGroups = this.calculationService.getCalculation().riskFactorGroups;
    this.riskFactors = this.calculationService.getCalculation().riskFactors;

    this.chartData = {

      onChange: this.onChange,
      onRefresh: this.onRefresh,
      onSelectMahalanobisAxisX: this.onSelectMahalanobisAxisX,
      onSelectMahalanobisAxisY: this.onSelectMahalanobisAxisY,
      onSelectMahalanobisAxis: this.onSelectMahalanobisAxis

    };

    this.onChangeSubscription = this.onChange.subscribe(change => {

      this.calculationService.calculationChangeHandler.next();
    });

    this.onCalculationRefreshSubscription = this.calculationService.calculationRefreshHandler.subscribe(() => {

      this.onRefresh.emit();
    });

    this.initLevelSelector();

  }

  ngOnDestroy() {

    this.onChangeSubscription.unsubscribe();
    this.onCalculationRefreshSubscription.unsubscribe();
  }

  onChangeLevel(value: String){
    this.calculationService.getCalculation()
      .riskFactors.forEach(rf => {
        if (value==='STARTING_POSITION') {
          rf.userAdjustedLevel = rf.adjustedMarketData;
        } else if (rf.investmentViews) {
          let selectedInvestmeView = rf.investmentViews.filter(iv=> iv.year===value).pop();
          if (selectedInvestmeView) {
            rf.userAdjustedLevel = selectedInvestmeView.agregatedValue;
          }
        }
    });
    this.calculationService.calculationRefreshHandler.next();
    this.chartData.onChange.next('userAdjustedLevel');
  }

  private initLevelSelector() {
    this.levelOptions = [];
    this.levelOptions.push({id: "STARTING_POSITION", name: "Starting Positions"});

    let investmentViewsYears: Set<string> = new Set<string>();

    this.calculationService.getCalculation()
      .riskFactors.forEach(rf => {
      if (rf.investmentViews) {
        rf.investmentViews.forEach(iv => {
          investmentViewsYears.add(iv.year);
        })
      }
    })

    investmentViewsYears.forEach(ivy => {
      this.levelOptions.push({id: ivy, name: ivy});
    });

  }

}
