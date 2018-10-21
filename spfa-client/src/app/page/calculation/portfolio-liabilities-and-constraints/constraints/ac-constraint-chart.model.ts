import {EventEmitter} from "@angular/core";
export class ACConstraintChartData {

  /* sum of all asset class nav's */
  navSum: number;
  allocationSum: number;
  onAdjust: EventEmitter<any>;
  onRefresh: EventEmitter<any>;
}
