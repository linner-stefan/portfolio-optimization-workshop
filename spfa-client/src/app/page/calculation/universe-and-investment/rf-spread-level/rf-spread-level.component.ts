import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation
} from "@angular/core";
import "rxjs/add/operator/debounceTime";
import * as math from "mathjs";
import {RiskFactor, RiskFactorUnit, InvestmentView} from "../../../../base/risk-factor/risk-factor.model";
import {SliderDragBuilder} from "../../../../util/slider-drag.util";
import {RFSpreadLevelChartData} from "./rf-spread-level-chart.model";
import {RiskFactorUtil} from "../../../../base/risk-factor/risk-factor.util";
import {Calculation} from "@app/base/calculation/model/calculation.model";
import {CalculationService} from "@app/base/calculation/calculation.service";

const scaleFactor = 2;

@Component({

  selector: 'rf-spread-level',
  templateUrl: './rf-spread-level.component.html',
  styleUrls: ['./rf-spread-level.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class RFSpreadLevelComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input()
  riskFactor: RiskFactor;

  @Input()
  chartData: RFSpreadLevelChartData;
  private onRefreshSubscription;
  private onSelectMahalanobisAxisSubscription;

  selectedX = false;
  selectedY = false;

  @ViewChild('slider') sliderElementRef: ElementRef;
  @ViewChild('marketData') marketDataElementRef: ElementRef;
  @ViewChild('level') levelElementRef: ElementRef;
  @ViewChild('volatility') volatilityElementRef: ElementRef;

  private chartScale: number;
  private chartOffset: number;

  get lowerVolatility(): number {

    return this.riskFactor.userAdjustedMarketData - this.riskFactor.userAdjustedVolatility * 100;
  }

  get upperVolatility(): number {

    return this.riskFactor.userAdjustedMarketData + this.riskFactor.userAdjustedVolatility * 100;
  }

  get defaultLowerVolatility(): number {

    return this.riskFactor.userAdjustedMarketData - this.riskFactor.adjustedVolatility * 100;
  }

  get defaultUpperVolatility(): number {

    return this.riskFactor.userAdjustedMarketData + this.riskFactor.adjustedVolatility * 100;
  }

  formatValue(value: number): string {

    if (this.riskFactor.unit == 'ABS')
      return `${math.round(value, 2)}%`;

    return `${math.round(value * 100, 0)}bps`;
  }

  constructor(private renderer: Renderer2, private zone: NgZone, private calculationService : CalculationService) { }

  ngOnInit() {
    this.onRefreshSubscription = this.chartData.onRefresh.subscribe((rf: RiskFactor) => {

      if (!rf || rf == this.riskFactor) {

        this.rescale();
        this.renderAll();
      }

    });
    this.onSelectMahalanobisAxisSubscription = this.chartData.onSelectMahalanobisAxis.subscribe(e => this.onSelectMahalanobisAxisHandler(e));
    this.rescale();
  }

  ngOnDestroy() {

    this.onRefreshSubscription.unsubscribe();
  }

  ngAfterViewInit() {

    this.renderAll();
  }

  rescale() {

    // standard scale
    this.chartScale = this.riskFactor.volatility * 100 * scaleFactor;
    this.chartOffset = this.riskFactor.userAdjustedMarketData - this.chartScale;

    // adjust scale if IS is outside slider
    if (this.riskFactor.investmentViews)
      this.riskFactor.investmentViews.forEach( is => {

        let diff = is.agregatedValue -this.riskFactor.userAdjustedMarketData;
        if (diff < 0)
          diff = -diff;

        if (diff > this.chartScale) {

          // we need to adjust the scale
          this.chartScale = diff;
          this.chartOffset = this.riskFactor.userAdjustedMarketData - (this.chartScale);
        }
      });

    // adjust scale if level is outside slider
    {
      let diff = this.riskFactor.userAdjustedLevel -this.riskFactor.userAdjustedMarketData;
      if (diff < 0)
        diff = -diff;

      if (diff > this.chartScale) {

        // we need to adjust the scale
        this.chartScale = diff;
        this.chartOffset = this.riskFactor.userAdjustedMarketData - (this.chartScale);
      }
    }

    // scale *2, because we have equal space on left from red line
    this.chartScale = this.chartScale *2;
  }

  applyScale(value: number): number {
    return (value - this.chartOffset) / this.chartScale;
  }

  revertScale(value: number): number {
    return (value * this.chartScale) + this.chartOffset;
  }

  private renderAll() {

    if (this.riskFactor) {

      this.renderMarketData();
      this.renderInvestmentViews();
      this.renderLevel();
      this.renderVolatility();
    }
  }

  setToEqualibrium() {
    this.riskFactor.userAdjustedLevel = this.riskFactor.userAdjustedMarketData;
    this.rescale();
    this.renderAll();
  }

  setAdjustedLevel(iv: InvestmentView) {
    this.changeLevel( RiskFactorUtil.fromABS( this.riskFactor.unit, iv.agregatedValue ) );
  }

  resetAdjustedLevel() {

    this.changeLevel(this.riskFactor.userAdjustedMarketData);
  }

  private renderMarketData() {

    let perc = this.applyScale(this.riskFactor.userAdjustedMarketData) * 100;
    this.renderer.setStyle(this.marketDataElementRef.nativeElement, 'left', perc + '%');
  }

  private renderInvestmentViews() {

    if (this.riskFactor.investmentViews) {

      this.agregateInvestmentViews();
      // let startingPosition = this.riskFactor.userAdjustedMarketData;
      this.riskFactor.agregatedInvestmentViews.forEach(iv => {
        // if (this.riskFactor.investmentViewType == 'Total') {
        //   iv.agregatedValue = iv.value;
        // } else if (this.riskFactor.investmentViewType == 'Change') {
        //   startingPosition += iv.value
        //   iv.agregatedValue = startingPosition;
        // }
        iv.scaledPosition = this.applyScale( iv.agregatedValue ) * 100;
      })
    }
  }

  private agregateInvestmentViews() {
    //starting position
    let map = new Map();

    this.riskFactor.investmentViews.forEach(iv => {
      let yearLabel = iv.year.toString().substr(2, 4);
      let existingView = map.get(iv.agregatedValue);
      if (existingView) {
        existingView.yearLabel += "," + yearLabel;
      } else {
        let newIv: InvestmentView = new InvestmentView()
        // newIv.value = iv.value;
        newIv.yearLabel = yearLabel;
        newIv.agregatedValue = iv.agregatedValue;
        map.set(iv.agregatedValue, newIv)
      }
    });
    this.riskFactor.agregatedInvestmentViews = Array.from(map.values())
  }

  private renderLevel() {

    let perc = this.applyScale(this.riskFactor.userAdjustedLevel) * 100;
    this.renderer.setStyle(this.levelElementRef.nativeElement, 'left', perc + '%');
  }

  private renderVolatility() {

    let perc1 = this.applyScale(this.riskFactor.userAdjustedMarketData - this.riskFactor.userAdjustedVolatility * 100) * 100;
    let perc2 = this.applyScale(this.riskFactor.userAdjustedMarketData + this.riskFactor.userAdjustedVolatility * 100) * 100;

    this.renderer.setStyle(this.volatilityElementRef.nativeElement, 'left', perc1 + '%');
    this.renderer.setStyle(this.volatilityElementRef.nativeElement, 'width', (perc2 - perc1) + '%');
  }

  marketDataDragStart(e: MouseEvent) {

    if (e.currentTarget !== e.target)
      return;

    new SliderDragBuilder()
      .withZone(this.zone)
      .withMouseEvenet(e)
      .withElementPosition(() => {

        return this.marketDataElementRef.nativeElement.offsetLeft;
      })
      .withElementWidth(() => {

        return this.sliderElementRef.nativeElement.clientWidth
      })
      .onSlide((fraction) => {

        if (fraction < 0)
          fraction = 0;

        if (fraction > 1)
          fraction = 1;

        this.riskFactor.userAdjustedMarketData = this.revertScale(fraction);
        this.renderMarketData();
        this.renderVolatility();
      })
      .doAfter(() => {

        this.rescale();
        this.renderAll();
        this.chartData.onChange.next('userAdjustedMarketData');
      })
      .construct();
  }

  levelDragStart(e: MouseEvent) {

    new SliderDragBuilder()
      .withZone(this.zone)
      .withMouseEvenet(e)
      .withElementPosition(() => {

        return this.levelElementRef.nativeElement.offsetLeft + 12;
      })
      .withElementWidth(() => {

        return this.sliderElementRef.nativeElement.clientWidth
      })
      .onSlide((fraction) => {

        if (fraction < 0)
          fraction = 0;

        if (fraction > 1)
          fraction = 1;

        this.riskFactor.userAdjustedLevel = this.revertScale(fraction);
        this.renderLevel();
      })
      .doAfter(() => {

        this.rescale();
        this.renderAll();
        this.chartData.onChange.next('userAdjustedLevel');
      })
      .construct();
  }

  volatilityDragStart(e: MouseEvent, left: boolean) {

    new SliderDragBuilder()
      .withZone(this.zone)
      .withMouseEvenet(e)
      .withElementPosition(() => {

        return this.volatilityElementRef.nativeElement.offsetLeft + (left ? 0 : this.volatilityElementRef.nativeElement.clientWidth)

      })
      .withElementWidth(() => {

        return this.sliderElementRef.nativeElement.clientWidth
      })
      .onSlide((fraction) => {

        // let marketDataFraction = this.applyScale(this.riskFactor.userAdjustedMarketData);

        if (!left)
          fraction = 1-fraction; // marketDataFraction +marketDataFraction -fraction;

        if (fraction < 0)
          fraction = 0;

        if (fraction > 0.5)
          fraction = 0.5;

        // if (fraction > marketDataFraction)
        //   fraction = marketDataFraction;

        this.riskFactor.userAdjustedVolatility = (this.riskFactor.userAdjustedMarketData - this.revertScale(fraction)) / 100;
        this.renderVolatility();
      })
      .doAfter(() => {

        this.chartData.onChange.next();
      })
      .construct();
  }

  get getUserAdjustedMarketData(): number {

    if (this.riskFactor.unit == 'ABS')
      return <number>math.round(this.riskFactor.userAdjustedMarketData, 2);
    else
      return <number>math.round(this.riskFactor.userAdjustedMarketData * 100, 0);
  }

  get getUserAdjustedLevel(): number {

    if (this.riskFactor.unit == 'ABS')
      return <number>math.round(this.riskFactor.userAdjustedLevel, 2);
    else
      return <number>math.round(this.riskFactor.userAdjustedLevel * 100, 0);
  }

  get getUserAdjustedVolatility(): number {
    if (this.riskFactor.unit == 'ABS') {
      return <number>math.round(this.riskFactor.userAdjustedVolatility * 100, 2);
    } else {
      return <number>math.round(this.riskFactor.userAdjustedVolatility * 10000, 2);
    }
  }

  get getVolatility(): number {
    if (this.riskFactor.unit == 'ABS') {
      return <number>math.round(this.riskFactor.volatility * 100, 2);
    } else {
      return <number>math.round(this.riskFactor.volatility * 10000, 2);
    }
  }

  changeMarketData(userAdjustedMarketData: number) {

    if (userAdjustedMarketData == undefined)
      return;

    this.riskFactor.userAdjustedMarketData = RiskFactorUtil.toABS(this.riskFactor.unit, userAdjustedMarketData);
    this.rescale();
    this.renderAll();
    this.chartData.onChange.next('userAdjustedMarketData');
  }

  changeLevel(userAdjustedLevel: number) {
    if (userAdjustedLevel == undefined)
      return;

    this.riskFactor.userAdjustedLevel = RiskFactorUtil.toABS(this.riskFactor.unit, userAdjustedLevel);
    this.rescale();
    this.renderAll();
    this.chartData.onChange.next('userAdjustedLevel');
  }

  changeVolatility(userAdjustedVolatility: number) {

    if (userAdjustedVolatility == undefined)
      return;

    this.riskFactor.userAdjustedVolatility =  RiskFactorUtil.toABS(this.riskFactor.unit, userAdjustedVolatility)/100;
    this.renderVolatility();
    this.chartData.onChange.next();
  }

  selectMahalanobisAxisX(riskFactor: RiskFactor) {

    if (this.selectedY)
      return;

    this.chartData.onSelectMahalanobisAxisX.emit(riskFactor);
    this.chartData.onSelectMahalanobisAxis.emit({riskFactor: riskFactor, axis: 'X'});
  }

  selectMahalanobisAxisY(riskFactor: RiskFactor) {

    if (this.selectedX)
      return;

    this.chartData.onSelectMahalanobisAxisY.emit(riskFactor);
    this.chartData.onSelectMahalanobisAxis.emit({riskFactor: riskFactor, axis: 'Y'});
  }

  onSelectMahalanobisAxisHandler(event) {
    if (event.riskFactor == this.riskFactor) { // notifies itself
      if (event.axis == 'X') {
        this.selectedX = true;
      }
      else if (event.axis == 'Y') {
        this.selectedY = true;
      }
    }
    else {
      if (event.axis == 'X') {
        this.selectedX = false;
      }
      else if (event.axis == 'Y') {
        this.selectedY = false;
      }
    }
  }

  get levelHint() : string {

    if ( this.riskFactor.investmentViews && this.riskFactor.investmentViews.length > 0 ) {

      return `IS ${ this.riskFactor.investmentViews[0].year }: ${ this.formatValue( this.riskFactor.investmentViews[0].agregatedValue ) }`;
    }

    return `Market: ${ this.formatValue( this.riskFactor.marketData ) }`;
  }

}
