import {SSTRatio} from "./model/sst-ratio.model";
import {ValueUtil} from "../../shared/value.util";

const alpha : number = 3.4488;

export class SSTRatioUtil {

  static calculateSstRatio( sstRatio: SSTRatio ) {

    // sstRatio.sstRatio = (sstRatio.userAdjustedRbc -sstRatio.userAdjustedMvm) /sstRatio.userAdjustedShortfall;
  }

  static calculateShortfall( sstRatio: SSTRatio ) {

    sstRatio.userAdjustedShortfall = ValueUtil.round( ( sstRatio.userAdjustedRbc - sstRatio.userAdjustedMvm ) / sstRatio.sstRatio, 0 );
  }

  static calculateOptimalTrackingError(sstRatio: SSTRatio, navSum: number ) {

    // sstRatio.optimalTrackingError = ( ( sstRatio.userAdjustedShortfall -sstRatio.shortfall ) / ( navSum *0.000001 * alpha * sstRatio.diversificationFactor ) ) +sstRatio.currentTrackingError;
  }

  static decomposeOptimalTrackingError(sstRatio: SSTRatio, navSum: number) {

    sstRatio.userAdjustedShortfall = sstRatio.shortfall + ( ( sstRatio.optimalTrackingError -sstRatio.currentTrackingError ) * ( navSum *0.000001 * alpha * sstRatio.diversificationFactor ) )
  }
}
