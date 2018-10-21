import {
  Component, ViewEncapsulation
} from "@angular/core";
import {DurationConstraintComponent} from "./duration-constraint.component";
import {ValueUtil} from "../../../../shared/value.util";
@Component({

  selector: 'duration-constraint-lowest',
  templateUrl: './duration-constraint.component.html',
  styleUrls: ['./duration-constraint.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DurationConstraintLowestComponent extends DurationConstraintComponent {

  applyScale( f: number ) {

    return ( f - ( this.durationConstraint.dv01 - ( this.durationConstraint.currencySum *0.0001 *0.1 *2 ) ) ) / ( this.durationConstraint.currencySum *0.0001 *0.1 *4 );
  }

  revertScale( f: number ) {

    return ( f * this.durationConstraint.currencySum *0.0001 *0.1 *4 ) + ( this.durationConstraint.dv01 - ( this.durationConstraint.currencySum *0.0001 *0.1 *2 ) );
  }

  get getUserLowerBound() : number {

    return ValueUtil.getMillionRounded ( this.durationConstraint.userAdjustedLowerBound );
  }

  get getLowerBound() : string {

    return ValueUtil.formatMillion( this.durationConstraint.lowerBound );
  }

  get getUserLowerBoundString() : string {

    return ValueUtil.formatMillion( this.durationConstraint.userAdjustedLowerBound );
  }

  updateUserLowerBound( lowerBound: number ) {

    if ( lowerBound == undefined )
      return;

    this.durationConstraint.userAdjustedLowerBound = lowerBound *1000000;
    this.chartData.onAdjust.next();
    this.render();
  }

  get getUserUpperBound() : number {

    return ValueUtil.getMillionRounded( this.durationConstraint.userAdjustedUpperBound );
  }

  get getUpperBound() : string {

    return ValueUtil.formatMillion ( this.durationConstraint.upperBound );
  }

  get getUserUpperBoundString() : string {

    return ValueUtil.formatMillion( this.durationConstraint.userAdjustedUpperBound );
  }

  updateUserUpperBound( upperBound: number ) {

    if ( upperBound == undefined )
      return;

    this.durationConstraint.userAdjustedUpperBound = upperBound *1000000;
    this.chartData.onAdjust.next();
    this.render();
  }
}
