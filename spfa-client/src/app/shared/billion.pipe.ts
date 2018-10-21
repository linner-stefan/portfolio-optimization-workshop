import {Pipe, PipeTransform} from "@angular/core";
import {ValueUtil} from "./value.util";
@Pipe({

  name: 'billion'
})
export class BillionPipe implements PipeTransform {

  transform(value: number) {

    return ValueUtil.formatBillion( value );
  }
}
