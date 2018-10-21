import { EventEmitter } from "@angular/core";

export class ACLiabilityChartData {

  onChange: EventEmitter<any>;
  onRefresh: EventEmitter<any>;
  liabilitySum: number;
}
