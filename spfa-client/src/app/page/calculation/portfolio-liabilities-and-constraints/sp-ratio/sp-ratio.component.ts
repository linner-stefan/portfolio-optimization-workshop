import {Component, OnInit, Input, EventEmitter, NgZone, ViewChild, ElementRef, Renderer2, AfterViewInit} from "@angular/core";
import {CalculationService} from "@app/base/calculation/calculation.service";
import {Calculation} from "@app/base/calculation/model/calculation.model";
import {AssetClassGroup, Portfolio} from "@app/base/asset-class/asset-class.model";
import {AcHelper} from "@app/base/asset-class/asset-class-helper";
import {ValueUtil} from "@app/shared/value.util";
import {BehaviorSubject} from "rxjs";
import "rxjs/add/operator/skip";
import {SliderDragBuilder} from "@app/util/slider-drag.util";
import {SpRatio} from "@app/base/calculation/model/sp-ratio-model";

@Component({
  selector: 'app-sp-ratio',
  templateUrl: './sp-ratio.component.html',
  styleUrls: ['sp-ratio.component.scss']
})
export class SpRatioComponent implements OnInit, AfterViewInit {

  @ViewChild('slider')
  private sliderElementRef: ElementRef;

  @ViewChild('handle')
  private handleElementRef: ElementRef;

  private calculation: Calculation;
  private spRatio: SpRatio;

  upperBoundBillions: number;

  standardChargeDeltaU: number;
  standardChargeDeltaO: number;

  collapsedBody = true;

  private minValue;
  private maxValue;
  private axisLabels: number[];

  @Input()
  onUserDefinedPortfolioRefresh: BehaviorSubject<any>;
  @Input()
  onOptimalPortfolioCalculated: EventEmitter<any>;

  error: boolean;

  config = {
    equalDataPointsTolerance: 1e6,
    disabledConstraintValue: 1e11,
    restrictUpperBoundOutsideOfBar: false,
    minRangeThreshold: 1, // USD bn
  };

  constructor( private calculationService: CalculationService,
               private zone: NgZone,
               private renderer: Renderer2 ) {

    this.calculation = this.calculationService.getCalculation();
    this.spRatio = this.calculation.spRatio;
  }

  ngOnInit() {
    this.calcSpRatios();

    this.onUserDefinedPortfolioRefresh.subscribe( () => this.calcSpRatios() );
    this.onOptimalPortfolioCalculated.subscribe( () => this.calcSpRatios() );
    this.calculationService.calculationRefreshHandler.subscribe( () => {
      this.calcSpRatios();
      this.ngAfterViewInit();
    } );
  }

  ngAfterViewInit() {
    this.upperBoundBillions = ValueUtil.getBillion( this.calculation.spRatioUpperBound );
    this.render();
  }

  private calcSpRatios(){
    let success = true;
    try {

      this.standardChargeDeltaU = this.calcSpRatio( this.calculation.userDefinedPortfolio );
      this.standardChargeDeltaO = this.calcSpRatio( this.calculation.optimalPortfolio );

      this.calcSliderRange();
      this.extractAxisLabels();

    } catch (e) {
      success = false;
      console.error(e);
    }

    if ( ! success
      || ! ValueUtil.isNumber(this.standardChargeDeltaU)
      || ! ValueUtil.isNumber(this.standardChargeDeltaO) ){

      this.error = true;
    }
  }

  private calcSliderRange() {
    this.minValue = undefined;
    this.maxValue = undefined;

    this.calculation.efficientPortfoliosUser.forEach( efPortfolio => {
      let efSpRatio = this.calcSpRatio( efPortfolio );
      efSpRatio = ValueUtil.getBillion( efSpRatio );

      if ( ! this.minValue || efSpRatio < this.minValue ){
        this.minValue = efSpRatio;
      }
      if ( ! this.maxValue || efSpRatio > this.maxValue ){
        this.maxValue = efSpRatio;
      }
    });

    const standardChargeDeltaUBillion = ValueUtil.getBillion(this.standardChargeDeltaU);
    const standardChargeDeltaOBillion = ValueUtil.getBillion(this.standardChargeDeltaO);

    if ( standardChargeDeltaUBillion > this.maxValue ){
      this.maxValue = standardChargeDeltaUBillion;
    }
    if ( standardChargeDeltaOBillion > this.maxValue ){
      this.maxValue = standardChargeDeltaOBillion;
    }
    if ( standardChargeDeltaUBillion < this.minValue ){
      this.minValue = standardChargeDeltaUBillion;
    }
    if ( standardChargeDeltaOBillion < this.minValue ){
      this.minValue = standardChargeDeltaOBillion;
    }

    if ( (this.maxValue - this.minValue) < this.config.minRangeThreshold ){
      this.minValue -= this.config.minRangeThreshold / 2;
      this.maxValue += this.config.minRangeThreshold / 2;
    }

  }

  private extractAxisLabels() {
    const minInteger = Math.ceil(this.minValue);
    const maxInteger = Math.floor(this.maxValue);

    this.axisLabels = [];
    for (let integer = minInteger; integer <= maxInteger; integer++) {
      this.axisLabels.push(integer);
    }
  }

  private calcSpRatio( portfolio: Portfolio ): number{
    const diversificationFactors = this.spRatio.diversificationFactors;
    let standardChargeDelta = 0; //portfolio SUMPRODUCT

    this.calculation.assetClassGroups.forEach(acg => {
      const spAaCharge = this.calcSpAaCharge(acg, portfolio);  // (m USD)

      const diversificationFactor = diversificationFactors[acg.definitionId];
      standardChargeDelta += spAaCharge * diversificationFactor;
    });

    return standardChargeDelta;
  }

  /**
   * @param acg Asset Class Group
   * @param portfolio portfolio to calculate diff with the Current Portfolio
   * @returns {number}
   */
  private calcSpAaCharge(acg: AssetClassGroup, portfolio: Portfolio ): number {

    if ( AcHelper.hasSubClasses( acg ) ){
      let sum = 0;
      acg.subClasses.forEach( subAcg => {
        sum += this.calcSpAaCharge( subAcg, portfolio );
      });

      return sum;
    }

    const assetClass = acg.assetClass;
    const diffPortfolioAllocation = portfolio.allocationsMap.get( assetClass.id ).navPercentage;
    const currentPortfolioAllocation = this.calculation.currentPortfolio.allocationsMap.get( assetClass.id ).navPercentage;
    const portfolioDelta = diffPortfolioAllocation - currentPortfolioAllocation;

    return assetClass.spAssetRiskCharge * portfolioDelta * this.calculation.navSum;
  }

  handleDragStart(e: MouseEvent) {

    new SliderDragBuilder()
      .withMouseEvenet( e )
      .withZone( this.zone )
      .withElementPosition(() => this.handleElementRef.nativeElement.offsetLeft + this.handleElementRef.nativeElement.offsetWidth / 2)
      .withElementWidth(() => this.sliderElementRef.nativeElement.clientWidth)
      .onSlide( ( fraction ) => {

        if (fraction < 0)
          fraction = 0;

        if (fraction > 1)
          fraction = 1;

        this.upperBoundBillions = this.revertScale( fraction );
        this.render();
      })
      .doAfter(() => {
        this.calculation.spRatioUpperBound = ValueUtil.getBillionReverted( this.upperBoundBillions );
        this.calculationService.calculationChangeHandler.next();
      })
      .construct();
  }

  render() {

    let handlePosition = this.upperBoundBillions;
    if ( this.upperBoundBillions < this.revertScale( 0 ) ){
      handlePosition = this.revertScale( 0 );
    }
    else if ( this.upperBoundBillions > this.revertScale( 1 ) ) {
      handlePosition = this.revertScale( 1 );
    }

    this.renderer.setStyle( this.handleElementRef.nativeElement, 'left', ( this.applyScale( handlePosition ) ) * 100 + '%');
  }

  applyScale( f: number ) : number {

    const fraction = (f - this.minValue) / (this.maxValue - this.minValue);
    return fraction;
  }

  revertScale( f: number ) : number {

    const domainValue = ( f *(this.maxValue - this.minValue) ) + this.minValue;
    return domainValue;
  }

  getWithTolerance( value: number): number {
    return ValueUtil.round( value / this.config.equalDataPointsTolerance );
  }

  getBillions( value: number ): number{
    return ValueUtil.getBillion( value );
  }

  changeBound(value: number) {

    if ( this.config.restrictUpperBoundOutsideOfBar ){
      if (value < this.minValue)
        value = this.minValue;

      if (value > this.maxValue)
        value = this.maxValue;
    }

    this.upperBoundBillions = value;
    this.calculation.spRatioUpperBound = ValueUtil.getBillionReverted(value);
    this.calculationService.calculationChangeHandler.next();

    this.render();
  }

  minWithZero( value: number ): number{
    return Math.min(0,value);
  }
}
