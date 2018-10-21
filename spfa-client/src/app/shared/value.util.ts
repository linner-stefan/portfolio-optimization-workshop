import * as math from "mathjs";

export const billionFraction : number = 1e-9;
export const billion = 1e9;
export const billionRound: number = 2;
export const millionFraction: number = 1e-6;
export const millionRound: number = 2;

export class ValueUtil {

  static getBillion( d: number ) : number {

    return d *billionFraction;
  }

  static getBillionReverted( d: number ) : number {
    return d * billion;
  }

  static getBillionRounded( d: number ) : number {

    return <number>math.round( ValueUtil.getBillion( d ), billionRound );
  }

  static formatBillion( d: number ) : string {
    if ( ! ValueUtil.isNumber(d) )
      return '?';

    return ValueUtil.getBillionRounded( d ).toLocaleString() + "bn";
  }

  static getMillion( d: number ) : number {

    return d *millionFraction;
  }

  static getMillionRounded( d: number, decimals : number = millionRound ) {

    return <number>math.round( ValueUtil.getMillion( d ), decimals );
  }

  static formatMillion( d: number, decimals : number = millionRound ) {

    return ValueUtil.getMillionRounded( d, decimals ).toLocaleString() + "mn";
  }

  static getPercent( d: number ) : number {

    return d *100;
  }

  static getPercentRounded( d: number, decimals: number = 1 ) : number {

    return <number>math.round( ValueUtil.getPercent( d ) , decimals );
  }

  static formatPercent(d: number ) : string {
    if ( ! ValueUtil.isNumber(d) )
      return '?';

    return ValueUtil.getPercent( d ) + "%";
  }

  static formatPercentRounded(d: number, decimals: number = 1 ) : string {
    if ( ! ValueUtil.isNumber(d) )
      return '?';

    return ValueUtil.getPercentRounded( d, decimals ).toLocaleString() + "%";
  }

  static round( d: number, decimals: number = 0) : number {

    return <number>math.round( d, decimals );
  }

  static isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
}
