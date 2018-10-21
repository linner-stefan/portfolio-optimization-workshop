import * as math from "mathjs";
import {Pipe, PipeTransform} from "@angular/core";
@Pipe({

  name: 'round'
})
export class RoundPipe implements PipeTransform {

  transform(value: number, positions?: number) {

    if (value === undefined)
      return 'NO-VALUE';

    if (positions == undefined)
      positions = 0;

    return math.round(value, positions);
  }
}
