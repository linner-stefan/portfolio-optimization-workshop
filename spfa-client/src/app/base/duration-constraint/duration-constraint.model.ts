export class DurationConstraint {

  id: number;

  lowerBound: number;
  adjustedLowerBound: number;
  userAdjustedLowerBound: number;

  upperBound: number;
  adjustedUpperBound: number;
  userAdjustedUpperBound: number;

  duration: number;
  dv01: number;

  timeFrame: string;
  currency: string;
  currencySum?: number;

  subConstraints?: DurationConstraint[];
  collapsed: boolean;

  userDefinedAndOptimal: UserDefinedAndOptimalDurationConstraint;
}

export class UserDefinedAndOptimalDurationConstraint {

  id: number;

  userDefinedDuration: number;
  optimalDuration: number;

  userDefinedDv01: number;
  optimalDv01: number;
}
