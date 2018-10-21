/**
 * Created by Stefan Linner on 20/12/2017.
 */
export class DistributionChartInput {

  readonly expectedShortfallConstant = -4.452429;
  readonly distributionDomain = [-6,6];

  nav: number;    // USD m
  excessReturn: number;
  trackingError: number;
  stressScenarioLoss: number;   // USD m

}
