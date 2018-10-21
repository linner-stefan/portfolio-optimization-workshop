import {AllocationConstraint} from "./asset-class.model";
import {ValueUtil} from "../../shared/value.util";
export class AllocationConstraintUtil {

  static precision = 8;    // group constraint precision

  static isBreachingLower( allocation: number, bound: number, isGroup: boolean) : boolean {
    if ( isGroup ){
      return ValueUtil.round(allocation, this.precision) < ValueUtil.round(bound, this.precision)
    }
    return allocation < bound;
  }

  static isBreachingUpper( allocation: number, bound: number, isGroup: boolean) : boolean {
    if ( isGroup ){
      return ValueUtil.round(allocation, this.precision) > ValueUtil.round(bound, this.precision);
    }
    return allocation > bound;
  }

  static isBreaching( allocation: number, ac: AllocationConstraint, isGroup: boolean) : boolean {

    return this.isBreachingLower( allocation, ac.userAdjustedLowerBound, isGroup)
      || this.isBreachingUpper( allocation, ac.userAdjustedUpperBound, isGroup);
  }

  static isBinding( allocation: number, ac: AllocationConstraint, isGroup: boolean) : boolean {

    return this.isBindingLower( allocation, ac.userAdjustedLowerBound, isGroup)
      || this.isBindingUpper( allocation, ac.userAdjustedUpperBound, isGroup);
  }

  static isBindingLower( allocation: number, bound: number, isGroup: boolean) : boolean {
    if ( isGroup ) {
      return ValueUtil.round(allocation,this.precision) == ValueUtil.round(bound,this.precision)
        && bound > 0;
    }
    // is an asset class
    return allocation == bound && bound > 0;
  }

  static isBindingUpper( allocation: number, bound: number, isGroup: boolean ) : boolean {
    if ( isGroup ) {
      return ValueUtil.round(allocation,this.precision) == ValueUtil.round(bound,this.precision)
        && bound > 0 && bound < 100;
    }
    // is an asset class
    return allocation == bound && bound > 0 && bound < 100;

  }

}
