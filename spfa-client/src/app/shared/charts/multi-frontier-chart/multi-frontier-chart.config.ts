import * as math from "mathjs";
import {ValueUtil} from "@app/shared/value.util";
import {MultiFrontierConstants} from "@app/shared/charts/multi-frontier-chart/multi-frontier-chart.model";

const ROUND = 2;

export interface MultiFrontierAxis {
  index: number;
  name: string;
  label: string;
  labelTooltip: string;
  axisFormat: Function;
  tooltipFormat: Function;
  snapTolerance: number;  // in domain dimension * 2

  value( variable: number ): number;

  /**
   * Reverted value() function.
   *
   * @param value
   * @param constants
   * @returns {number}
   */
  variable( value: number ): number;
}

export class AxisX0 implements MultiFrontierAxis {
  index = 0;
  name = "Tracking error vs PI";
  label = this.name + " (TE)";
  labelTooltip = "TE";
  axisFormat = d => (math.round(d * 100, 1) as number).toFixed(1)+"%";
  tooltipFormat = d => (math.round(d * 100, ROUND) as number).toFixed(ROUND)+"%";
  snapTolerance = 0.0003;

  constructor( private constants: MultiFrontierConstants ){}

  value( variable: number ): number{
    return variable;
  }
  variable( value: number ): number{
    return value;
  }
}
export class AxisX1 implements MultiFrontierAxis {
  index = 1;
  name = "EVM income volatility";
  label = this.name + " (USD bn)";
  labelTooltip = "EVM vol";
  axisFormat = d => d;
  tooltipFormat = d => ValueUtil.round(d,ROUND) + " USD bn";
  snapTolerance = this.value(0.0003);

  constructor( private constants: MultiFrontierConstants ){}

  value( variable: number ): number{
    return variable * this.constants.navSum * ( 1 - this.constants.taxRate );
  }
  variable( value: number ): number{
    return value / ( this.constants.navSum * ( 1 - this.constants.taxRate ) );
  }
}
export class AxisX2 implements MultiFrontierAxis {
  index = 2;
  name = "Standalone shortfall";
  label = this.name + " (USD bn)";
  labelTooltip = "SaSF";
  axisFormat = d => d;
  tooltipFormat = d => ValueUtil.round(d,ROUND) + " USD bn";
  snapTolerance = 0.1;

  constructor( private constants: MultiFrontierConstants ){}

  value( variable: number ): number{
    return this.constants.reportedShortfall + this.constants.alpha * ( variable - this.constants.teCurrent ) * this.constants.navSum;
  }
  variable( value: number ): number{
    return (value - this.constants.reportedShortfall + this.constants.alpha * this.constants.navSum * this.constants.teCurrent)
      / ( this.constants.alpha * this.constants.navSum );
  }
}
export class AxisX3 implements MultiFrontierAxis {
  index = 3;
  name = "Contribution to shortfall";
  label = this.name + " (USD bn)";
  labelTooltip = "CoSF";
  axisFormat = d => d;
  tooltipFormat = d => ValueUtil.round(d,ROUND) + " USD bn";
  snapTolerance = 0.1;

  constructor( private constants: MultiFrontierConstants ){}

  value( variable: number ): number{
    return this.constants.reportedShortfall + this.constants.alpha * ( variable - this.constants.teCurrent )
      * this.constants.navSum * this.constants.diversificationFactor;
  }
  variable( value: number ): number{
    return ( value - this.constants.reportedShortfall )
      / ( this.constants.alpha * this.constants.navSum * this.constants.diversificationFactor )
      +  this.constants.teCurrent;
  }
}

export class AxisY0 implements MultiFrontierAxis {
  index = 0;
  name = "Excess return";
  label = this.name + " (μ)";
  labelTooltip = "μ";
  axisFormat = d => (math.round(d * 100, 1) as number).toFixed(1)+"%";
  tooltipFormat = d => (math.round(d * 100, ROUND) as number).toFixed(ROUND)+"%";
  snapTolerance = 0;

  constructor( private constants: MultiFrontierConstants ){}

  value( variable: number ): number{
    return variable;
  }
  variable( value: number ): number{
    return value;
  }
}
export class AxisY1 implements MultiFrontierAxis {
  index = 1;
  name = "EVM income";
  label = this.name + " (USD bn)";
  labelTooltip = "EVM inc";
  axisFormat = d => d;
  tooltipFormat = d => ValueUtil.round(d,ROUND) + " USD bn";
  snapTolerance = 0;

  constructor( private constants: MultiFrontierConstants ){}

  value( variable: number ): number{
    return ( variable - this.constants.expenseRatio) * this.constants.navSum;
  }
  variable( value: number ): number{
    return value / ( this.constants.navSum + this.constants.expenseRatio );
  }
}


