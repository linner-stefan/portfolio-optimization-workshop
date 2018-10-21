import {Pipe, PipeTransform} from "@angular/core";
import {ValueUtil} from "./value.util";
@Pipe({

  name: 'perc'
})
export class PercentPipe implements PipeTransform {

  transform(value: number) {

    return ValueUtil.formatPercentRounded( value );
  }
}
