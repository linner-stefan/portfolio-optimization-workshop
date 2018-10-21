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
import {
  AllocationConstraint,
  AssetClass,
  AssetClassGroup,
  AssetClassGroupMetadata
} from "../../../../base/asset-class/asset-class.model";
import {SliderDragBuilder} from "../../../../util/slider-drag.util";
import {ACConstraintChartData} from "./ac-constraint-chart.model";
import {ValueUtil, billionFraction} from "../../../../shared/value.util";
import {CalculationUtil} from "../../../../base/calculation/calculation.util";
@Component({

  selector: 'ac-constraint',
  templateUrl: './ac-constraint.component.html',
  styleUrls: ['./ac-constraint.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ACConstraintComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input()
  assetClassGroup: AssetClassGroup;

  @Input()
  chartData: ACConstraintChartData;
  private onRefreshSubscription;

  allocationConstraint: AllocationConstraint;
  assetClass: AssetClass;
  metadata: AssetClassGroupMetadata;

  @ViewChild('slider')
  private sliderElementRef: ElementRef;

  @ViewChild('allocation')
  private allocationElementRef: ElementRef;

  @ViewChild('bounding')
  private boundingElementRef: ElementRef;

  @ViewChild('lowerBoundValue')
  private lowerBoundValueElementRef: ElementRef;

  @ViewChild('upperBoundValue')
  private upperBoundValueElementRef: ElementRef;

  @ViewChild('currentAllocationFlag')
  private currentAllocationFlagElementRef: ElementRef;

  @ViewChild('optimalAllocationFlag')
  private optimalAllocationFlagElementRef: ElementRef;

  formatBillion = ValueUtil.formatBillion;

  get selectionEnabled(): boolean {

    return this.assetClass && this.assetClass.marketData.nav == 0;
  }

  toggleSelected(e: MouseEvent) {

    e.preventDefault();
    this.assetClass.userSelected = !this.assetClass.userSelected;
    this.chartData.onAdjust.next();
  }

  constructor(private renderer: Renderer2, private zone: NgZone) { }

  ngOnInit() {

    this.metadata = this.assetClassGroup.metadata;
    this.assetClass = this.assetClassGroup.assetClass;
    this.allocationConstraint = this.assetClassGroup.allocationConstraint;

    this.onRefreshSubscription = this.chartData.onRefresh.subscribe(() => {

      this.render();
    });
  }

  ngOnDestroy() {

    this.onRefreshSubscription.unsubscribe();
  }

  ngAfterViewInit() {

    this.render();
  }

  /* scale -0.05 - 1 to 0 - 1 */
  private static applyScale(value: number) {

    return (value +0.05) /1.05;
  }

  private static revertScale(value: number) {

    return (value *1.05) -0.05;
  }

  private render() {

    if (this.allocationConstraint) {

      this.renderAdjustedAllocation();
      this.renderAdjustedMinMaxAllocation();
      this.renderCurrentAllocation();
      this.renderOptimalAllocation();
    }
  }

  private renderCurrentAllocation() {

    this.renderer.setStyle(this.currentAllocationFlagElementRef.nativeElement, 'left', ( ACConstraintComponent.applyScale( this.metadata.allocationCurrentSum ) *100 ) + '%');
  }

  private renderOptimalAllocation() {

    this.renderer.setStyle(this.optimalAllocationFlagElementRef.nativeElement, 'left', ( ACConstraintComponent.applyScale( this.metadata.allocationOptimalSum ) *100 ) + '%');
  }

  private renderAdjustedAllocation() {

    this.renderer.setStyle(this.allocationElementRef.nativeElement, 'left', ( ACConstraintComponent.applyScale( this.metadata.allocationSum ) * 100 ) + '%');
  }

  private renderAdjustedMinMaxAllocation() {

    this.renderer.setStyle(this.boundingElementRef.nativeElement, 'left', ( ACConstraintComponent.applyScale( this.allocationConstraint.userAdjustedLowerBound ) * 100) + '%');
    this.renderer.setStyle(this.boundingElementRef.nativeElement, 'width', ( ( ACConstraintComponent.applyScale( this.allocationConstraint.userAdjustedUpperBound ) - ACConstraintComponent.applyScale( this.allocationConstraint.userAdjustedLowerBound )) * 100) + '%');

    this.renderer.setProperty(this.lowerBoundValueElementRef.nativeElement, 'innerHTML', ValueUtil.formatPercentRounded( this.allocationConstraint.userAdjustedLowerBound ) );
    this.renderer.setProperty(this.upperBoundValueElementRef.nativeElement, 'innerHTML', ValueUtil.formatPercentRounded( this.allocationConstraint.userAdjustedUpperBound ) );
  }

  allocationDragStart(e: MouseEvent) {

    if (this.assetClassGroup.subClasses)
      return;

    if (!this.assetClass.userSelected)
      return;

    new SliderDragBuilder()
      .withZone(this.zone)
      .withMouseEvenet(e)
      .withElementPosition(() => this.allocationElementRef.nativeElement.offsetLeft + 12)
      .withElementWidth(() => this.sliderElementRef.nativeElement.clientWidth)
      .onSlide(fraction => {

        if (fraction < 0)
          fraction = 0;

        if (fraction > 1)
          fraction = 1;

        const allocation = ACConstraintComponent.revertScale(fraction);
        this.metadata.allocationSum = allocation;

        const portfolioAllocationUDef = CalculationUtil.getUserDefinedPortfolioAllocation( this.assetClass.portfolioAllocations );
        portfolioAllocationUDef.navPercentage = allocation;
        portfolioAllocationUDef.navTotal = allocation * this.chartData.navSum;
        portfolioAllocationUDef.ctr = undefined;

        this.renderAdjustedAllocation();
      })
      .doAfter(() => {

        this.chartData.onAdjust.next();

      })
      .construct();
  }

  boundDragStart(e: MouseEvent, lower: boolean) {

    if (this.allocationConstraint.aggregation && this.allocationConstraint.userAdjustedAggregation)
      return;

    if (this.assetClass && !this.assetClass.userSelected)
      return;

    new SliderDragBuilder()
      .withZone(this.zone)
      .withMouseEvenet(e)
      .withElementPosition(() => this.boundingElementRef.nativeElement.offsetLeft + (lower ? 0 : this.boundingElementRef.nativeElement.clientWidth))
      .withElementWidth(() => this.sliderElementRef.nativeElement.clientWidth)
      .onSlide((fraction) => {

        if (lower) {

          if (fraction < 0)
            fraction = 0;

          this.allocationConstraint.userAdjustedLowerBound = Math.min(
            ACConstraintComponent.revertScale(fraction),
            this.allocationConstraint.userAdjustedUpperBound);

        } else {

          if (fraction > 1)
            fraction = 1;

          this.allocationConstraint.userAdjustedUpperBound = Math.max(
            ACConstraintComponent.revertScale(fraction),
            this.allocationConstraint.userAdjustedLowerBound);
        }

        this.render();
      })
      .doAfter(() => {

        this.chartData.onAdjust.next();
      })
      .construct();
  }

  get getUserLowerBound(): number {

    return ValueUtil.getPercentRounded( this.allocationConstraint.userAdjustedLowerBound );
  }

  get getUserUpperBound(): number {

    return ValueUtil.getPercentRounded( this.allocationConstraint.userAdjustedUpperBound );
  }

  get getUserAllocation(): number {

    return ValueUtil.getPercentRounded( this.metadata.allocationSum );
  }

  get getNav(): number {

    return ValueUtil.getBillionRounded(this.metadata.allocationSum * this.chartData.navSum);
  }

  get getNavCurrent(): number {

    return this.assetClass.portfolioAllocations[0].navTotal;
  }

  changeNav(value: number) {

    this.assetClass.portfolioAllocations[1].navTotal = value/billionFraction;
    this.assetClass.portfolioAllocations[1].navPercentage = this.metadata.allocationSum = (value/billionFraction)/this.chartData.navSum;
    this.assetClass.portfolioAllocations[1].ctr = undefined;

    this.chartData.onAdjust.next();
    this.render();
  }

  changeAllocation(value: number) {

    if (value < -100)
      value = -100;

    if (value > 100)
      value = 100;

    this.assetClass.portfolioAllocations[1].navPercentage = this.metadata.allocationSum = value * 0.01;
    this.assetClass.portfolioAllocations[1].navTotal = this.metadata.allocationSum * this.chartData.navSum;
    this.assetClass.portfolioAllocations[1].ctr = undefined;

    this.chartData.onAdjust.next();
    this.render();
  }

  changeLowerBound(value: number) {

    if (value < -100)
      value = -100;

    if (value > this.allocationConstraint.userAdjustedUpperBound * 100)
      value = this.allocationConstraint.userAdjustedUpperBound * 100;

    this.allocationConstraint.userAdjustedLowerBound = value * 0.01;
    this.chartData.onAdjust.next();
    this.render();
  }

  changeUpperBound(value: number) {

    if (value > 100)
      value = 100;

    if (value < this.allocationConstraint.userAdjustedLowerBound * 100)
      value = this.allocationConstraint.userAdjustedLowerBound * 100;

    this.allocationConstraint.userAdjustedUpperBound = value * 0.01;
    this.chartData.onAdjust.next();
    this.render();
  }
}
