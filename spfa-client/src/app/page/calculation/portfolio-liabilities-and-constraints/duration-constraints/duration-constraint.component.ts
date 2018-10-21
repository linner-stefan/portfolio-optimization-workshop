import {
  Component,
  Input,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Renderer2,
  NgZone,
  OnDestroy,
  OnInit
} from "@angular/core";
import {DurationConstraintChartData} from "./duration-constraint-chart.model";
import {
  DurationConstraint,
  UserDefinedAndOptimalDurationConstraint
} from "../../../../base/duration-constraint/duration-constraint.model";
import {SliderDragBuilder} from "../../../../util/slider-drag.util";
import {ValueUtil} from "../../../../shared/value.util";
@Component({

  selector: 'duration-constraint',
  templateUrl: './duration-constraint.component.html',
  styleUrls: ['./duration-constraint.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DurationConstraintComponent implements AfterViewInit, OnDestroy, OnInit {

  @Input()
  durationConstraint: DurationConstraint;

  @Input()
  chartData: DurationConstraintChartData;
  private onRefreshSubscription;

  @ViewChild('slider')
  sliderElementRef: ElementRef;

  @ViewChild('bounding')
  boundingElementRef: ElementRef;

  @ViewChild('userDefined')
  userDefinedElementRef: ElementRef;

  @ViewChild('optimal')
  optimalElementRef: ElementRef;

  formatMillion = ValueUtil.formatMillion;

  get userDefinedAndOptimal() : UserDefinedAndOptimalDurationConstraint {

    return this.durationConstraint.userDefinedAndOptimal;
  }

  get showDuration() : boolean {

    return !this.durationConstraint.timeFrame;
  }

  constructor( private zone: NgZone, private renderer: Renderer2 ) { }

  ngOnInit() {

    this.onRefreshSubscription = this.chartData.onRefresh.subscribe( () => {

      this.render();
    } );
  }

  ngOnDestroy() {

    this.onRefreshSubscription.unsubscribe();
  }

  applyScale( f: number ) {

    return ( f - ( this.durationConstraint.duration -1 ) ) / 2;
  }

  revertScale( f: number ) {

    return ( f * 2 ) + ( this.durationConstraint.duration -1 );
  }

  ngAfterViewInit() {

    this.render();
  }

  render() {

    let left = this.applyScale( this.durationConstraint.userAdjustedLowerBound );
    let right = this.applyScale( this.durationConstraint.userAdjustedUpperBound );

    this.renderer.setStyle( this.boundingElementRef.nativeElement, 'left', ( left * 100 ) + '%');
    this.renderer.setStyle( this.boundingElementRef.nativeElement, 'width', ( ( right -left ) * 100 ) + '%');

    if ( this.userDefinedAndOptimal ) {

      let userDefinedLeft = this.applyScale( this.durationConstraint.timeFrame ? this.userDefinedAndOptimal.userDefinedDv01 : this.userDefinedAndOptimal.userDefinedDuration );
      let optimalLeft = this.applyScale( this.durationConstraint.timeFrame ? this.userDefinedAndOptimal.optimalDv01 : this.userDefinedAndOptimal.optimalDuration );

      this.renderer.setStyle( this.userDefinedElementRef.nativeElement, 'left', ( userDefinedLeft * 100 ) + '%' );
      this.renderer.setStyle( this.optimalElementRef.nativeElement, 'left', ( optimalLeft * 100 ) + '%' );
    }
  }

  dragBounding( e: MouseEvent, lower: boolean ) {

    new SliderDragBuilder()
      .withMouseEvenet( e )
      .withZone( this.zone )
      .withElementPosition(() => this.boundingElementRef.nativeElement.offsetLeft + (lower ? 0 : this.boundingElementRef.nativeElement.clientWidth))
      .withElementWidth(() => this.sliderElementRef.nativeElement.clientWidth)
      .onSlide( fraction => {

        if (lower) {

          if (fraction < 0)
            fraction = 0;

          if (fraction > 0.5)
            fraction = 0.5;

          this.durationConstraint.userAdjustedLowerBound = this.revertScale( fraction );

        } else {

          if (fraction < 0.5)
            fraction = 0.5;

          if (fraction > 1)
            fraction = 1;

          this.durationConstraint.userAdjustedUpperBound = this.revertScale( fraction );
        }

        this.render();
      })
      .doAfter( () => {

        this.chartData.onAdjust.next();
        this.render();
      })
      .construct();

  }

  get getUserLowerBound() : number {

    return ValueUtil.getMillionRounded ( (this.durationConstraint.userAdjustedLowerBound /this.durationConstraint.duration) *this.durationConstraint.dv01 );
  }

  get getLowerBound() : string {

    return ValueUtil.formatMillion( (this.durationConstraint.lowerBound /this.durationConstraint.duration) *this.durationConstraint.dv01 );
  }

  get getUserLowerBoundString() : string {

    return ValueUtil.formatMillion( (this.durationConstraint.userAdjustedLowerBound /this.durationConstraint.duration) *this.durationConstraint.dv01 );
  }

  updateUserLowerBound( lowerBound: number ) {

    if ( lowerBound == undefined )
      return;

    this.durationConstraint.userAdjustedLowerBound = ( ( lowerBound * 1000000 ) / this.durationConstraint.dv01) *this.durationConstraint.duration;
    this.chartData.onAdjust.next();
    this.render();
  }

  get getUserUpperBound() : number {

    return ValueUtil.getMillionRounded( (this.durationConstraint.userAdjustedUpperBound /this.durationConstraint.duration) *this.durationConstraint.dv01 );
  }

  get getUpperBound() : string {

    return ValueUtil.formatMillion ( (this.durationConstraint.upperBound /this.durationConstraint.duration) *this.durationConstraint.dv01 );
  }

  get getUserUpperBoundString() : string {

    return ValueUtil.formatMillion( (this.durationConstraint.userAdjustedUpperBound /this.durationConstraint.duration) *this.durationConstraint.dv01 );
  }

  updateUserUpperBound( upperBound: number ) {

    if ( upperBound == undefined )
      return;

    this.durationConstraint.userAdjustedUpperBound = ( ( upperBound * 1000000 ) / this.durationConstraint.dv01 ) *this.durationConstraint.duration;
    this.chartData.onAdjust.next();
    this.render();
  }
}
