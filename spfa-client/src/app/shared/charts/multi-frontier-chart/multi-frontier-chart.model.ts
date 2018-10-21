import {Portfolio} from "../../../base/asset-class/asset-class.model";
import {
  MultiFrontierAxis, AxisX0, AxisX1, AxisX2,
  AxisX3, AxisY0, AxisY1
} from "@app/shared/charts/multi-frontier-chart/multi-frontier-chart.config";
export class MultiFrontier {
  constructor(
    readonly name: string,
    readonly data: Array<MultiFrontierChartDatum>,
    readonly efficientPortfolios: Portfolio[]
  ){}
}

export class MultiFrontierConstants {
  constructor (
    readonly navSum: number,                     // USDbn
    readonly taxRate: number,                 // FP percentage
    readonly reportedShortfall: number,       // USDbn
    readonly alpha: number,
    readonly teCurrent: number,               // Tracking Error Current [FP percentage]
    public diversificationFactor: number,    // FP percentage, can be updated
    readonly expenseRatio: number
  ){}

}

export class MultiFrontierChartDatum {
  axisX0: number;
  axisX1: number;
  axisX2: number;
  axisX3: number;

  axisY0: number;
  axisY1: number;

  constructor(
    private te: number,
    private excessReturn: number,
    public label: string,
    readonly frontierName: string
  ){}

  x( axisType: MultiFrontierAxis ): number{
    if ( axisType instanceof AxisX0 ){
      if ( !this.axisX0 ){
        this.axisX0 = axisType.value( this.te );
      }
      return this.axisX0;
    }
    if ( axisType instanceof AxisX1 ){
      if ( !this.axisX1 ){
        this.axisX1 = axisType.value( this.te );
      }
      return this.axisX1;
    }
    if ( axisType instanceof AxisX2 ){
      if ( !this.axisX2 ){
        this.axisX2 = axisType.value( this.te );
      }
      return this.axisX2;
    }
    if ( axisType instanceof AxisX3 ){
      if ( !this.axisX3 ){
        this.axisX3 = axisType.value( this.te );
      }
      return this.axisX3 ;
    }
    console.error("Unknown MultiFrontierAxis X type", axisType);
  }

  y( axisType: MultiFrontierAxis ){
    if ( axisType instanceof AxisY0 ){
      if ( !this.axisY0 ){
        this.axisY0 = axisType.value( this.excessReturn );
      }
      return this.axisY0;
    }
    if ( axisType instanceof AxisY1 ){
      if ( !this.axisY1 ){
        this.axisY1 = axisType.value( this.excessReturn );
      }
      return this.axisY1;
    }
    console.error("Unknown MultiFrontierAxis Y type", axisType);
  }

}

export class MultiFrontierChartIndividualDatum extends MultiFrontierChartDatum{
  constructor(te: number, y: number, label: string, frontierName: string,
    readonly color: string
  ){
    super(te,y,label,frontierName);
  }

}

export class InterpolatedPoint {
  constructor(
    public frontierName: string
  ){}
  anchorX: number;
  anchorY: number;
  intersectionY: number;
  lockedPortfolio: InterpolatedPortfolio;
  interpolatedPortfolio: InterpolatedPortfolio;
}

export class InterpolatedPortfolio {

  efficientPortfolioSet: Portfolio[];

  portfolioLeftIndex: number;

  portfolioRightIndex: number;

  /**
   * normalized position between points (portfolios) left and right
   *
   * position 0.0 = portfolioLeft
   * position 1.0 = portfolioRight
   */
  position: number;
}
