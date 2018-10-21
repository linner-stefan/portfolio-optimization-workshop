import {RiskFactorGroup} from "@app/base/risk-factor/risk-factor.model";
export class WaterfallChartInput {
  constructor(
    public type: string
  ){}
}

export class WaterfallChartDatum{
  start: number;
  end: number;
  type: string;

  constructor(
    public name: string,
    public value: number,
    public riskFactorGroup: RiskFactorGroup){
  }
}
