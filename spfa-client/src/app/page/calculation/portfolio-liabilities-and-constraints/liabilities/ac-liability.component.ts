import {
  AfterViewInit,
  Component,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewEncapsulation,
  ViewChild
} from "@angular/core";
import {AssetClassGroup, AssetClass} from "../../../../base/asset-class/asset-class.model";
import {ACLiabilityChartData} from "./ac-liability-chart.model";
import {SliderDragBuilder} from "../../../../util/slider-drag.util";
import {ValueUtil, billionFraction} from "../../../../shared/value.util";
@Component({

  selector: 'ac-liability',
  templateUrl: 'ac-liability.component.html',
  styleUrls: ['ac-liability.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ACLiabilityComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input()
  assetClassGroup: AssetClassGroup;
  assetClass: AssetClass;

  @Input()
  chartData: ACLiabilityChartData;
  private onRefreshSubscription;

  @ViewChild("slider")
  private sliderElementRef;

  @ViewChild("liability")
  private liabilityElementRef;

  @ViewChild("currentLiabilityFlag")
  private currentLiabilityFlagElementRef;

  constructor(private renderer: Renderer2, private zone: NgZone) { }

  ngOnInit() {

    this.assetClass = this.assetClassGroup.assetClass;
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
  private applyScale(value: number) {

    return (value +0.05) /1.05;
  }

  private revertScale(value: number) {

    return (value *1.05) -0.05;
  }

  private render() {

    this.renderLiability();
    this.renderCurrentLiability();
  }

  private renderLiability() {

    let f = (this.assetClass ? this.assetClass.marketData.userAdjustedLiability : this.assetClassGroup.metadata.liabilitySum) /this.chartData.liabilitySum;
    this.renderer.setStyle( this.liabilityElementRef.nativeElement, "left", (this.applyScale(f) *100) + '%' );
  }

  private renderCurrentLiability() {

    let f = this.assetClassGroup.metadata.liabilityCurrentSum / this.chartData.liabilitySum;
    this.renderer.setStyle( this.currentLiabilityFlagElementRef.nativeElement, 'left', ( this.applyScale( f ) *100) + '%');
  }

  liabilityDragStart(e: MouseEvent) {

    if (this.assetClassGroup.subClasses)
      return;

    new SliderDragBuilder()
      .withZone(this.zone)
      .withMouseEvenet(e)
      .withElementPosition(() => this.liabilityElementRef.nativeElement.offsetLeft + 12)
      .withElementWidth(() => this.sliderElementRef.nativeElement.clientWidth)
      .onSlide(fraction => {

        if (fraction < 0)
          fraction = 0;

        if (fraction > 1)
          fraction = 1;

        this.assetClass.marketData.userAdjustedLiability = this.revertScale(fraction) *this.chartData.liabilitySum;
        this.render();
      })
      .doAfter(() => {

        this.chartData.onChange.next();
      })
      .construct();
  }

  get currentLiability() : string {

    return ValueUtil.formatBillion( this.assetClass.marketData.liability );
  }

  get getUserLiability() : number {

    return ValueUtil.getBillionRounded( this.assetClassGroup.metadata.liabilitySum );
  }

  get currentLiabilityPerc() : number {

    return this.assetClass.marketData.liability /this.chartData.liabilitySum;
  }

  get getUserLiabilityPerc() : number {

    return ValueUtil.getPercentRounded( this.assetClassGroup.metadata.liabilitySum /this.chartData.liabilitySum );
  }

  get getCurrentAggregatedLiabilityPerc() {

    return ValueUtil.formatPercentRounded( this.assetClassGroup.metadata.liabilityCurrentSum /this.chartData.liabilitySum );
  }

  changeLiabilityPerc(userAdjustedLiability: number) {

    if (userAdjustedLiability == undefined)
      return;

    if (userAdjustedLiability > 100)
      userAdjustedLiability = 100;

    if (userAdjustedLiability < -5)
      userAdjustedLiability = -5;

    this.assetClass.marketData.userAdjustedLiability = userAdjustedLiability *0.01 *this.chartData.liabilitySum;
    this.chartData.onChange.next();
    this.render();
  }

  changeLiability(userAdjustedLiability: number) {

    if (userAdjustedLiability == undefined)
      return;

    this.changeLiabilityPerc( ( userAdjustedLiability / ( this.chartData.liabilitySum * billionFraction ) ) * 100);
  }
}
