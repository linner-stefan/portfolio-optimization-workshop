export class IncludesUtil {

  static includes(array: Array<any>, item: any) : boolean {

    return array.indexOf(item) >= 0;
  }
}
