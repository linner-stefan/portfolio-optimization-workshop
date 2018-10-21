import {Portfolio} from "@app/base/asset-class/asset-class.model";
export class PortfolioChartDatumOriginal {
  label: string;
  setLabel: string;
  layers: PortfolioAllocationChartDatum[] = [];
  portfolio: Portfolio;
  interpolated: boolean;
}

export class PortfolioAllocationChartDatum {
  navTotal: number = 0;
  navPercentage: number = 0;
  ctr: number = undefined;
}
