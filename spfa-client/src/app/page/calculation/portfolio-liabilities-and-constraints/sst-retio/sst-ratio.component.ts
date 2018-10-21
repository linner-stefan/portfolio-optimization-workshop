import {
  Component, NgZone, ViewChild, ElementRef, Renderer2, AfterViewInit, OnInit, OnDestroy, Input,
  EventEmitter
} from "@angular/core";
import {SliderDragBuilder} from "../../../../util/slider-drag.util";
import {ValueUtil} from "../../../../shared/value.util";
import {SSTRatio} from "../../../../base/calculation/model/sst-ratio.model";
import {SSTRatioUtil} from "../../../../base/calculation/sst-ratio.util";
import {CalculationService} from "../../../../base/calculation/calculation.service";
import {Portfolio} from "../../../../base/asset-class/asset-class.model";
import {CalculationUtil} from "../../../../base/calculation/calculation.util";
@Component({

  selector: 'sst-ratio',
  templateUrl: './sst-ratio.component.html',
  styleUrls: ['./sst-ratio.component.scss']
})
export class SSTRatioComponent implements AfterViewInit, OnInit, OnDestroy {

  sstRatio: SSTRatio;

  @ViewChild('slider')
  private sliderElementRef: ElementRef;

  @ViewChild('handle')
  private handleElementRef: ElementRef;

  @Input()
  private onSSTRatioChange: EventEmitter<any>;

  @Input()
  private onOptimalTrackingErrorChange: EventEmitter<any>;
  private onOptimalTrackingErrorChangeSubscription;

  private onRefreshSubscription;
  private navSum: number;

  private minValue = 0.8;
  private maxValue = 3;

  collapsedBody = true;

  ngOnInit() {

    let calculation = this.calculationService.getCalculation();

    this.sstRatio = calculation.sstRatio;
    this.navSum = calculation.navSum;

    this.onRefreshSubscription = this.calculationService.calculationRefreshHandler.subscribe( () => {

      this.render();
      this.navSum = calculation.navSum;
    });

    this.onOptimalTrackingErrorChangeSubscription = this.onOptimalTrackingErrorChange.subscribe( () => {

      SSTRatioUtil.decomposeOptimalTrackingError( this.sstRatio, this.navSum );
      SSTRatioUtil.calculateSstRatio( this.sstRatio );
      this.render();
    });

    this.onSSTRatioChange.subscribe(() => {
      this.calculationService.calculationChangeHandler.next();
    });
  }

  ngOnDestroy() {
    this.onRefreshSubscription.unsubscribe();
    this.onOptimalTrackingErrorChangeSubscription.unsubscribe();
  }

  ngAfterViewInit() {

    this.render();
  }

  get getSstRatio() : number {

    // in float -> %

    return ValueUtil.getPercentRounded( this.sstRatio.sstRatio, 0 );
  }

  changeSstRatio(sstRatio: number) {

    if (!sstRatio)
      return;

    this.sstRatio.sstRatio = sstRatio / 100;
    SSTRatioUtil.calculateShortfall( this.sstRatio );
    SSTRatioUtil.calculateOptimalTrackingError( this.sstRatio, this.navSum );
    this.onSSTRatioChange.next();
    this.render();
  }

  get getMvm() : number {

    return ValueUtil.round( this.sstRatio.userAdjustedMvm );
  }

  changeMvm(mvm : number) {

    if (!mvm)
      return;

    this.sstRatio.userAdjustedMvm = ValueUtil.round( mvm );
    SSTRatioUtil.calculateSstRatio( this.sstRatio );
    this.render();
  }

  get getRbc() : number {

    return ValueUtil.round( this.sstRatio.userAdjustedRbc );
  }

  get getDiversificationFactor() : number {

    return ValueUtil.round( this.sstRatio.diversificationFactor, 2 );
  }

  changeDiversificationFactor(diversificationFactor: number) {

    if (!diversificationFactor)
      return;

    this.sstRatio.diversificationFactor = ValueUtil.round ( diversificationFactor, 2 );
    SSTRatioUtil.decomposeOptimalTrackingError( this.sstRatio, this.navSum );
    this.onSSTRatioChange.next();
    this.render();
  }

  changeRbc(rbc: number) {

    if (!rbc)
      return;

    this.sstRatio.userAdjustedRbc = ValueUtil.round ( rbc );
    SSTRatioUtil.calculateSstRatio( this.sstRatio );
    this.render();
  }

  get getDefaultShortfall() : number {

    return ValueUtil.round( this.sstRatio.shortfall );
  }

  changeDefaultShortfall(defaultShortfall: number) {

    if (!defaultShortfall)
      return;

    this.sstRatio.shortfall = ValueUtil.round( defaultShortfall );
    SSTRatioUtil.decomposeOptimalTrackingError( this.sstRatio, this.navSum );
    SSTRatioUtil.calculateOptimalTrackingError( this.sstRatio, this.navSum );
    SSTRatioUtil.calculateSstRatio( this.sstRatio );
    this.onSSTRatioChange.next();
    this.render();
  }

  get getShortfall() : number {

    return ValueUtil.round( this.sstRatio.userAdjustedShortfall );
  }

  changeShortfall(shortfall: number) {

    if (!shortfall)
      return;

    this.sstRatio.userAdjustedShortfall = ValueUtil.round( shortfall );
    SSTRatioUtil.calculateOptimalTrackingError( this.sstRatio, this.navSum );
    SSTRatioUtil.calculateSstRatio( this.sstRatio );
    this.onSSTRatioChange.next();
    this.render();
  }

  get getTrackingErrorOptimal() : number {

    return ValueUtil.round( this.sstRatio.optimalTrackingError *100 , 2);
  }

  constructor(private zone: NgZone, private renderer: Renderer2, private calculationService: CalculationService) { }

  applyScale( f: number ) : number {

    return (f - this.minValue) / (this.maxValue - this.minValue);
  }

  revertScale( f: number ) : number {

    return ( f *(this.maxValue - this.minValue) ) + this.minValue;
  }

  render() {

    let handlePosition = this.sstRatio.sstRatio;
    if ( this.sstRatio.sstRatio < this.revertScale( 0 ) ){
      handlePosition = this.revertScale( 0 );
    }
    else if ( this.sstRatio.sstRatio > this.revertScale( 1 ) ) {
      handlePosition = this.revertScale( 1 );
    }

    this.renderer.setStyle( this.handleElementRef.nativeElement, 'left', ( this.applyScale( handlePosition ) *100) + '%');
  }

  handleDragStart(e: MouseEvent) {

    new SliderDragBuilder()
      .withMouseEvenet( e )
      .withZone( this.zone )
      .withElementPosition(() => this.handleElementRef.nativeElement.offsetLeft + 12)
      .withElementWidth(() => this.sliderElementRef.nativeElement.clientWidth)
      .onSlide( ( fraction ) => {

        if (fraction < 0)
          fraction = 0;

        if (fraction > 1)
          fraction = 1;

        this.sstRatio.sstRatio = this.revertScale( fraction );
        SSTRatioUtil.calculateShortfall( this.sstRatio );
        SSTRatioUtil.calculateOptimalTrackingError( this.sstRatio, this.navSum );
        this.render();
      })
      .doAfter(() => {

        this.onSSTRatioChange.next();
      })
      .construct();
  }
}
