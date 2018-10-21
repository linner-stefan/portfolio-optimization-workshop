import {RiskFactorUnit, RiskFactorGroup} from "./risk-factor.model";

export class RiskFactorUtil {

  static flattenRiskFactorGroupsAndSetParent(riskFactorGroups: RiskFactorGroup[], parent?: RiskFactorGroup) {

    const flat = [].concat(...riskFactorGroups);

    // riskFactorGroups.forEach(rfg => {
    //
    //   if ( parent ){
    //     rfg.parent = parent;
    //   }
    //
    //   if (rfg.subGroups)
    //     flat.push(...this.flattenRiskFactorGroupsAndSetParent(rfg.subGroups,rfg));
    // });

    return flat;
  }

  static toABS(unit: RiskFactorUnit, level: number) : number {

    if (unit == "BP")
      return level /100;

    return level;
  }

  static fromABS(unit: RiskFactorUnit, level: number) : number {

    if (unit == "BP")
      return level *100;

    return level;
  }

  static setRiskFactorRootGroup(rootRfg: RiskFactorGroup, currentRfg: RiskFactorGroup) {
    if ( currentRfg.subGroups ){
      currentRfg.subGroups.forEach( rfg => RiskFactorUtil.setRiskFactorRootGroup(rootRfg, rfg))
    }
    else {
      currentRfg.riskFactor.rootGroup = rootRfg;
    }
  }
}
