import {EventEmitter} from "@angular/core";
export class DurationConstraintChartData {

  onAdjust: EventEmitter<any>;
  onRefresh: EventEmitter<any>;
  navSum: number;
}
