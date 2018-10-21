import {Calculation, CalculationUpdate} from "./model/calculation.model";
import {
  AllocationConstraint,
  AssetClass,
  AssetClassGroup,
  AssetClassGroupUpdate,
  DualConstraint,
  MarketData,
  Portfolio,
  PortfolioAllocation
} from "../asset-class/asset-class.model";
import {AssetClassUtil} from "../asset-class/asset-class.util";
import {RiskFactorUtil} from "../risk-factor/risk-factor.util";
import {RiskFactor, RiskFactorGroup} from "../risk-factor/risk-factor.model";
import {SSTRatio} from "./model/sst-ratio.model";
import {SSTRatioUtil} from "./sst-ratio.util";
import {
  DurationConstraint,
  UserDefinedAndOptimalDurationConstraint
} from "../duration-constraint/duration-constraint.model";
import {PortfolioUtil} from "./portfolio.util";
import {DurationConstraintUtil} from "./duration-constraint.util";
import {DateFormatPipe} from "angular2-moment";
import {PortfolioAttributesUpdateOutDto} from "@app/base/calculation/model/java-calculations.model";

export class CalculationUtil {

  static getAdjustedData( calculation: Calculation ) : any {

    let allocationConstraints = calculation.allocationConstraints
      .map(ac => ({

        id: ac.id,
        adjustedLowerBound: ac.userAdjustedLowerBound,
        adjustedUpperBound: ac.userAdjustedUpperBound,
        adjustedAggregation: ac.userAdjustedAggregation,
        upperBound: ac.upperBound,
        lowerBound: ac.lowerBound,
        aggregation: ac.aggregation
      }));

  return allocationConstraints;
  }

  static getAdjustedRiskFactorsData(calculation: Calculation) {
    return calculation.riskFactors
      .map(rf => ({

        id: rf.id,
        name: rf.name,
        adjustedMarketData: rf.userAdjustedMarketData,
        adjustedLevel: rf.userAdjustedLevel,
        adjustedVolatility: rf.userAdjustedVolatility

      }));
  }

  static getAdjustedAssetClassData(calculation: Calculation): Object[] {
    // ac.portfolioAllocations[1] is undefined
    return calculation.assetClasses
      .map(ac => ({

        id: ac.id,
        name: ac.name,
        selected: ac.userSelected,
        // adjustedAllocation: ac.portfolioAllocations[1].navPercentage,
        marketData: {

          adjustedLiability: ac.marketData.userAdjustedLiability
        }
      }));
  }

  static getAssetClassAllocations( calculation: Calculation ) : any {

    const optimal = PortfolioUtil.getOptimalPortfolio(calculation);
    const current = PortfolioUtil.getCurrentPortfolio(calculation);
    const userDefined = PortfolioUtil.getUserDefinedPortfolio(calculation);

    return calculation.assetClasses.map( ac => ( {

      assetClassId: ac.id,
      name: ac.name,
      currentAllocation: current.allocationsMap.get(ac.id).navPercentage,
      userDefinedAllocation: userDefined.allocationsMap.get(ac.id).navPercentage,
      optimalAllocation: optimal.allocationsMap.get(ac.id).navPercentage

    } ) );
  }


  static parseDateString(dateString: string) : Date {
    let date = dateString.split('-').map(Number);
    return new Date(date[0], date[1] -1, date[2]);
  }

  static serializeDate(date: Date) : string {
    return new DateFormatPipe().transform(date, 'YYYY-MM-DD');
  }

  static parseData( calculation: Calculation ) {

    this.parseDates( calculation );
    // this.parseDurationConstraints( calculation.durationConstraints );
  }

  static parseDates( calculation: Calculation ) {

    // calculation.cob = this.parseDateString(<string>calculation.cob);
    // calculation.periodStart = this.parseDateString(<string>calculation.periodStart);
    // calculation.periodEnd = this.parseDateString(<string>calculation.periodEnd);
    calculation.createdDate = new Date(calculation.createdDate);
  }

  static serializeDates(calculation: Calculation) {

    calculation.cob = this.serializeDate(<Date>calculation.cob);
    calculation.periodStart = this.serializeDate(<Date>calculation.periodStart);
    calculation.periodEnd = this.serializeDate(<Date>calculation.periodEnd);
  }

  private static parseDurationConstraints( durationConstraints: DurationConstraint[] ) {

    durationConstraints.forEach( dc => {

      if ( dc.subConstraints ) {

        this.parseDurationConstraints( dc.subConstraints );
        if ( dc.currency ) {

          dc.collapsed = true;
        }

      } else {

        if ( dc.timeFrame ) {

          dc.timeFrame = dc.timeFrame.substring( 1, dc.timeFrame.length ).toUpperCase();
        }
      }

    } );
  }

  /* initialize helper structures, like lists for better performance */
  /* eg. list of asset classes and risk factors */
  static initStructures(calculation: Calculation) {

    calculation.flatAssetClassGroups = AssetClassUtil.flattenAssetClassGroups(calculation.assetClassGroups);
    calculation.assetClasses = calculation.flatAssetClassGroups
      .filter(acg => acg.assetClass)
      .map(acg => acg.assetClass);

    calculation.assetClassMap = new Map<String,AssetClass>();
    calculation.assetClasses.forEach( ac => {
      calculation.assetClassMap.set( ac.name, ac );
    });

    // calculation.flatRiskFactorGroups = RiskFactorUtil.flattenRiskFactorGroupsAndSetParent(calculation.riskFactorGroups);
    // calculation.riskFactors = calculation.flatRiskFactorGroups
    //   .filter(rfg => rfg.riskFactor)
    //   .map(rfg => rfg.riskFactor);

    calculation.riskFactorMap = new Map<String,RiskFactor>();
    // calculation.riskFactors.forEach( rf => {
    //   calculation.riskFactorMap.set( rf.name, rf );
    // });

    // calculation.riskFactorGroups.forEach( rfg => RiskFactorUtil.setRiskFactorRootGroup( rfg, rfg ));

    // calculation.flatRiskFactorGroups
    //   .filter(rfg => rfg.riskFactor)
    //   .forEach(rfg => rfg.riskFactor.group = rfg);

    this.calculateAggregatedISViewValues(calculation);

    calculation.allocationConstraints = calculation.flatAssetClassGroups
      .map(acg => acg.allocationConstraint);

    if (!calculation.dualConstraints)
      calculation.dualConstraints = [];

    calculation.flatDurationConstraints = DurationConstraintUtil.flattenDurationConstraints( calculation.durationConstraints );
  }

  static collectData(calculation: Calculation) {

    calculation.navSum = AssetClassUtil.getAssetClassNavSum( calculation.assetClasses );
    calculation.liabilitySum = AssetClassUtil.getAssetClassLiabilitySum( calculation.assetClasses );
    // calculation.sstRatio.currentTrackingError = PortfolioUtil.getCurrentPortfolio( calculation ).trackingError;

    calculation.assetClasses.forEach( ac => {
      const userDefinedPortfolio = CalculationUtil.getUserDefinedPortfolioAllocation(ac.portfolioAllocations);
      // userDefinedPortfolio.previousNavPercentage = userDefinedPortfolio.navPercentage;
      // userDefinedPortfolio.previousNavTotal = userDefinedPortfolio.navTotal;
      // userDefinedPortfolio.previousCtr = userDefinedPortfolio.ctr;
    });
  }

  // TODO: performance, but this should be quick since current and user-defined allocations should be always at the start
  static getCurrentPortfolioAllocation( portfolioAllocations: PortfolioAllocation[]): PortfolioAllocation {
    return portfolioAllocations.find(pa => pa.portfolioLabel == 'Current' && !pa.portfolioSetLabel);
  }
  static getUserDefinedPortfolioAllocation( portfolioAllocations: PortfolioAllocation[]): PortfolioAllocation {
    return portfolioAllocations.find(pa => pa.portfolioLabel == 'User-defined' && !pa.portfolioSetLabel);
  }

  static calculateOptimalPortfolio( calculation: Calculation ) {

    PortfolioUtil.calculateOptimalPortfolio(
      calculation,
      PortfolioUtil.getInterpolatedPoint(

        calculation.efficientPortfoliosUser

      ));
  }

  static setUserDefaults(calculation: Calculation, reset?: boolean, calculationUpdate?: CalculationUpdate) {

    this.setAssetClassUserDefaults(calculation.assetClasses, reset);
    this.setRiskFactorUserDefaults(calculation.riskFactors, reset, calculationUpdate);
    this.setAllocationConstraintUserDefaults(calculation.allocationConstraints, reset);
    this.setDurationConstraintUserDefaults( calculation.flatDurationConstraints, reset );
    this.setSstRatioUserDefaults( calculation.sstRatio, calculation.navSum, reset, calculationUpdate );
  }

  static resetAppliedValues( calculation ): void {
    this.resetPortfolioAppliedValues( calculation );
  }

  private static setAssetClassUserDefaults(assetClasses: AssetClass[], reset?: boolean) {

    assetClasses.forEach(ac => {

      ac.userSelected = ac.selected = reset ? true: ac.selected;
      // this.setMarketDataUserDefaults(ac.marketData, reset);
      this.setPortfolioUserDefaults(ac, reset);
    });
  }

  private static setMarketDataUserDefaults(marketData: MarketData, reset?: boolean) {

    marketData.userAdjustedLiability = marketData.adjustedLiability = reset ? marketData.liability : marketData.adjustedLiability;
  }

  private static setPortfolioUserDefaults(ac : AssetClass, reset? : boolean) {

    let currentPortfolio = this.getCurrentPortfolioAllocation(ac.portfolioAllocations);
    let userDefinedPortfolio = this.getUserDefinedPortfolioAllocation(ac.portfolioAllocations);

    if (userDefinedPortfolio === undefined) {
      return;
    }

    if (reset) {

      userDefinedPortfolio.navPercentage = userDefinedPortfolio.previousNavPercentage = currentPortfolio.navPercentage;
      userDefinedPortfolio.navTotal = userDefinedPortfolio.previousNavTotal = currentPortfolio.navTotal;
      userDefinedPortfolio.ctr = userDefinedPortfolio.previousCtr = currentPortfolio.ctr;

    } else {

      userDefinedPortfolio.navPercentage = userDefinedPortfolio.previousNavPercentage;
      userDefinedPortfolio.navTotal = userDefinedPortfolio.previousNavTotal;
      userDefinedPortfolio.ctr = userDefinedPortfolio.previousCtr;
    }
  }

  private static setRiskFactorUserDefaults(riskFactors: RiskFactor[], reset?: boolean, calculationUpdate?: CalculationUpdate) {
    // riskFactors.forEach(rf => this.setOneRiskFactorUserDefaults( rf, reset, calculationUpdate) );
  }

  static setOneRiskFactorUserDefaults( riskFactor: RiskFactor, reset?: boolean, calculationUpdate?:CalculationUpdate) {
    let updatedRiskFactor : RiskFactor;
    if (calculationUpdate) {
      updatedRiskFactor = calculationUpdate.riskFactors.filter( urf=> riskFactor.id==urf.id)[0];
    }

    riskFactor.userAdjustedMarketData = riskFactor.adjustedMarketData = reset ? updatedRiskFactor.adjustedMarketData : riskFactor.adjustedMarketData;
    riskFactor.userAdjustedLevel = riskFactor.adjustedLevel = reset ? riskFactor.adjustedMarketData : riskFactor.adjustedLevel;
    riskFactor.userAdjustedVolatility = riskFactor.adjustedVolatility = reset ? riskFactor.volatility : riskFactor.adjustedVolatility;
  }

  private static setAllocationConstraintUserDefaults(allocationConstraints: AllocationConstraint[], reset?: boolean) {

    allocationConstraints.forEach(ac => {

      // ac.userAdjustedAllocation = ac.adjustedAllocation = reset ? ac.allocation : ac.adjustedAllocation;
      ac.userAdjustedLowerBound = ac.adjustedLowerBound = reset ? ac.lowerBound : ac.adjustedLowerBound;
      ac.userAdjustedUpperBound = ac.adjustedUpperBound = reset ? ac.upperBound : ac.adjustedUpperBound;
      ac.userAdjustedAggregation = ac.adjustedAggregation = reset ? ac.aggregation : ac.adjustedAggregation;
    })
  }

  private static setDurationConstraintUserDefaults( durationConstraints: DurationConstraint[], reset? : boolean ) {

    durationConstraints
      .forEach( dc => {

        dc.userAdjustedLowerBound = dc.adjustedLowerBound = reset ? dc.lowerBound : dc.adjustedLowerBound;
        dc.userAdjustedUpperBound = dc.adjustedUpperBound = reset ? dc.upperBound : dc.adjustedUpperBound;
      });
  }

  private static setSstRatioUserDefaults( sstRatio: SSTRatio, navSum: number, reset? : boolean, calculationUpdate?: CalculationUpdate ) {

    // sstRatio.shortfall = reset ? calculationUpdate.sstRatio.shortfall : sstRatio.shortfall;//undo not available
    // sstRatio.userAdjustedMvm = sstRatio.adjustedMvm = reset ? sstRatio.mvm : sstRatio.adjustedMvm;
    // sstRatio.userAdjustedRbc = sstRatio.adjustedRbc = reset ? sstRatio.rbc : sstRatio.adjustedRbc;
    // sstRatio.userAdjustedShortfall = sstRatio.adjustedShortfall = reset ? calculationUpdate.sstRatio.shortfall : sstRatio.adjustedShortfall;

    SSTRatioUtil.calculateSstRatio( sstRatio );
    SSTRatioUtil.calculateOptimalTrackingError( sstRatio, navSum );
  }

  static setPortfolioAppliedValues(calculation: Calculation){
    calculation.userDefinedPortfolio.trackingErrorApplied = calculation.userDefinedPortfolio.trackingError;
    calculation.userDefinedPortfolio.portfolioReturnApplied = calculation.userDefinedPortfolio.portfolioReturn;
    calculation.currentPortfolio.trackingErrorApplied = calculation.currentPortfolio.trackingError;
    calculation.currentPortfolio.portfolioReturnApplied = calculation.currentPortfolio.portfolioReturn;
  }

  private static resetPortfolioAppliedValues(calculation: Calculation ) {
    calculation.userDefinedPortfolio.trackingError = calculation.userDefinedPortfolio.trackingErrorApplied;
    calculation.userDefinedPortfolio.portfolioReturn = calculation.userDefinedPortfolio.portfolioReturnApplied;
    calculation.currentPortfolio.trackingError = calculation.currentPortfolio.trackingErrorApplied;
    calculation.currentPortfolio.portfolioReturn = calculation.currentPortfolio.portfolioReturnApplied;
  }

  static setUserAdjustments(calculation: Calculation) {

    this.setUserAdjustedAssetClasses(calculation.assetClasses);
    this.setUserAdjustedRiskFactors(calculation.riskFactors);
    this.setUserAdjustedAllocationConstraints(calculation.allocationConstraints);
    this.setUserAdjustedDurationConstraints( calculation.flatDurationConstraints );
    this.setUserAdjustedSstRatio( calculation.sstRatio );
  }

  private static setUserAdjustedAssetClasses(assetClasses: AssetClass[]) {

    assetClasses.forEach(ac => {

      ac.selected = ac.userSelected;
      this.setUserAdjustedMarketData(ac.marketData);
      this.setPortfolioAdjustments( ac );
    });
  }

  private static setUserAdjustedMarketData(marketData: MarketData) {

    marketData.adjustedLiability = marketData.userAdjustedLiability;
  }

  private static setPortfolioAdjustments( ac: AssetClass ) {

    let userDefinedPortfolio = this.getUserDefinedPortfolioAllocation(ac.portfolioAllocations);

    userDefinedPortfolio.previousNavPercentage = userDefinedPortfolio.navPercentage;
    userDefinedPortfolio.previousNavTotal = userDefinedPortfolio.navTotal;
    userDefinedPortfolio.previousCtr = userDefinedPortfolio.ctr;
  }

  private static setUserAdjustedRiskFactors(riskFactors: RiskFactor[]) {

    riskFactors.forEach(rf => {

      rf.adjustedMarketData = rf.userAdjustedMarketData;
      rf.adjustedVolatility = rf.userAdjustedVolatility;
      rf.adjustedLevel = rf.userAdjustedLevel;
    });
  }

  private static setUserAdjustedAllocationConstraints(allocationConstraints: AllocationConstraint[]) {

    allocationConstraints.forEach(ac => {

      ac.adjustedLowerBound = ac.userAdjustedLowerBound;
      ac.adjustedUpperBound = ac.userAdjustedUpperBound;
      ac.adjustedAggregation = ac.userAdjustedAggregation;
    });
  }

  private static setUserAdjustedDurationConstraints( durationConstraints: DurationConstraint[] ) {

    durationConstraints
      .forEach( dc => {

        dc.adjustedLowerBound = dc.userAdjustedLowerBound;
        dc.adjustedUpperBound = dc.userAdjustedUpperBound;
      });
  }

  private static setUserAdjustedSstRatio( sstRatio: SSTRatio ) {

    sstRatio.adjustedMvm = sstRatio.userAdjustedMvm;
    sstRatio.adjustedRbc = sstRatio.userAdjustedRbc;
    sstRatio.adjustedShortfall = sstRatio.userAdjustedShortfall;
  }

  static setCalculationMetadata(calculation: Calculation) {

    this.setAssetClassGroupMetadata(calculation.assetClassGroups);
    this.setRiskFactorGroupMetadata(calculation.riskFactorGroups);
  }

  private static setAssetClassGroupMetadata(assetClassGroups: AssetClassGroup[]) {

    assetClassGroups.forEach(acg => {

      acg.metadata = {

        constraintCollapsed: true,
        liabilityCollapsed: true,
        liabilitySum: 0,
        liabilityCurrentSum: 0,
        allocationSum: 0,
        allocationCurrentSum: 0,
        allocationOptimalSum: 0
      };

      if (acg.subClasses)
        this.setAssetClassGroupMetadata(acg.subClasses);
    })
  }

  private static setRiskFactorGroupMetadata(riskFactorGroups: RiskFactorGroup[]) {

    // riskFactorGroups.forEach(rfg => {
    //
    //   rfg.metadata = {
    //
    //     spreadLevelCollapsed: true
    //   };
    //
    //   if (rfg.subGroups)
    //     this.setRiskFactorGroupMetadata(rfg.subGroups);
    // });
  }

  static getAllocationOfGroupByPortfolio( assetClassGroup: AssetClassGroup, portfolioIndex ) : number {

    if (assetClassGroup.subClasses) {

      let sum = 0;
      assetClassGroup.subClasses.forEach( subClass => {

        sum += this.getAllocationOfGroupByPortfolio( subClass, portfolioIndex );

      } );
      return sum;

    } else {

      return assetClassGroup.assetClass.portfolioAllocations[ portfolioIndex ].navPercentage;
    }
  }

  static updateCalculationMetadata( calculation: Calculation ) {

    AssetClassUtil.setAssetClassAllocation( calculation.assetClassGroups, calculation.navSum );
    AssetClassUtil.updateConstraintsAndAllocationMetadata( calculation.assetClassGroups,
      PortfolioUtil.getUserDefinedPortfolio(calculation) );
    AssetClassUtil.updateLiabilitiesAndMetadata( calculation.assetClassGroups );
  }

  static setAssociations(calculation: Calculation) {

    this.setDualConstraintAssociations( calculation.assetClassGroups, calculation.dualConstraints );
    this.setAllPortfolioAllocationAssociations( calculation );
    this.setRiskFactorThirdLevelGroup(calculation.riskFactorGroups);
  }

  static setAllPortfolioAllocationAssociations(calculation: Calculation ) {

    let acMap = new Map();
    calculation.assetClasses.forEach(ac => {

      acMap.set(ac.id, ac);
      ac.portfolioAllocations = [];
    });

    if (calculation.currentPortfolio !== undefined ) {
      this.setPortfolioAllocationAssociations([calculation.currentPortfolio], acMap);
    }
    if(calculation.userDefinedPortfolio !== undefined ) {
      this.setPortfolioAllocationAssociations([calculation.userDefinedPortfolio], acMap);
    }

    this.setPortfolioAllocationAssociations(calculation.efficientPortfoliosUser, acMap);

    if (calculation.efficientPortfoliosMarket !== undefined) {
      this.setPortfolioAllocationAssociations(calculation.efficientPortfoliosMarket, acMap);
    }
    if (calculation.efficientPortfoliosIs !== undefined) {
      this.setPortfolioAllocationAssociations(calculation.efficientPortfoliosIs, acMap);
    }
  }

  static setDualConstraintAssociations(assetClassGroups: AssetClassGroup[], dualConstraints: DualConstraint[]) {

    if (!dualConstraints)
      return;

    let map = new Map();
    AssetClassUtil.flattenAssetClassGroups(assetClassGroups).forEach(acg => map.set(acg.id, acg));

    dualConstraints.forEach(dc => {

      let acg1: AssetClassGroup = map.get(dc.assetClassGroupId1);
      if (!acg1)
        return;

      let acg2: AssetClassGroup = map.get(dc.assetClassGroupId2);
      if (!acg2)
        return;

      dc.assetClassGroup1 = acg1;
      dc.assetClassGroup2 = acg2;
    });
  }

  static setPortfolioAllocationAssociations(portfolios: Portfolio[], assetClassMap: Map< number, AssetClass >) {

    portfolios.forEach( p => {

      p.allocationsMap = new Map<number,PortfolioAllocation>();
      p.allocations.forEach( pa => {

        pa.assetClass = assetClassMap.get( pa.assetClassId );
        pa.assetClass.portfolioAllocations.push( pa );
        p.allocationsMap.set( pa.assetClassId, pa );
      });
    });
  }

  private static setRiskFactorThirdLevelGroup(riskFactorGroups: RiskFactorGroup[]) {

    // TODO: should be using calculation.flatRiskFactorGroups
    RiskFactorUtil.flattenRiskFactorGroupsAndSetParent(riskFactorGroups)
      .filter(rfg => rfg.riskFactor && rfg.level == 1)
      .forEach(rfg => {

        let newRfg : RiskFactorGroup = {

          id: undefined,
          name: rfg.name,
          level: 2,
          subGroups: undefined,
          parent: rfg,
          riskFactor: rfg.riskFactor,
          metadata: {

            spreadLevelCollapsed: false
          }
        };

        rfg.riskFactor = undefined;
        if (rfg.subGroups)
          rfg.subGroups.push(newRfg);
        else
          rfg.subGroups = [newRfg];
      });
  }

  static reimportISViews(calculation: Calculation, riskFactors: RiskFactor[]) {

    let map = new Map();
    riskFactors.forEach(rf => map.set( rf.id, rf ));

    calculation.riskFactors.forEach(rf => {

      let reimportedRf = map.get(rf.id);
      if (reimportedRf) {

        rf.investmentViews = reimportedRf.investmentViews;
        rf.userAdjustedMarketData = reimportedRf.adjustedMarketData;
        rf.adjustedMarketData = reimportedRf.adjustedMarketData;
        rf.adjustedLevel=reimportedRf.adjustedLevel;
        rf.userAdjustedLevel=reimportedRf.adjustedLevel;
        rf.adjustedVolatility=reimportedRf.adjustedVolatility;
        rf.userAdjustedVolatility=reimportedRf.adjustedVolatility;
      }
    });
    this.calculateAggregatedISViewValues(calculation);
  }

  static reimportUserDefinedAllocationAndConstraintsAndLiabilities(calculation: Calculation, assetClassGroups: AssetClassGroup[]) {

      if (!assetClassGroups)
        return;

      let map = new Map();
      AssetClassUtil.flattenAssetClassGroups(calculation.assetClassGroups).forEach(acg => map.set(acg.id, acg));

      assetClassGroups.forEach(reimportedACG => {

        let acg : AssetClassGroup = map.get(reimportedACG.id);

        if (acg.allocationConstraint) {
          console.log(acg.allocationConstraint)
          acg.allocationConstraint.adjustedLowerBound = reimportedACG.allocationConstraint.adjustedLowerBound;
          acg.allocationConstraint.userAdjustedLowerBound = reimportedACG.allocationConstraint.adjustedLowerBound;
          acg.allocationConstraint.adjustedUpperBound = reimportedACG.allocationConstraint.adjustedUpperBound;
          acg.allocationConstraint.userAdjustedUpperBound = reimportedACG.allocationConstraint.adjustedUpperBound;
        }

        if (acg.assetClass) {
          let pa = acg.assetClass.portfolioAllocations.filter(pa=> pa.portfolioLabel == 'User-defined')[0];
          let reimportedPA = reimportedACG.assetClass.portfolioAllocations.filter(pa=> pa.portfolioLabel == 'User-defined')[0];
          if (pa && reimportedPA) {
            pa.navPercentage = reimportedPA.navPercentage;
          }
          acg.assetClass.marketData.adjustedLiability = reimportedACG.assetClass.marketData.adjustedLiability;
          acg.assetClass.marketData.userAdjustedLiability = reimportedACG.assetClass.marketData.adjustedLiability;
        }
      });


  }


  static reimportAllocationConstraints(calculation: Calculation, allocationConstraints: AllocationConstraint[]) {

    if (!allocationConstraints)
      return;

    let map = new Map();
    AssetClassUtil.flattenAssetClassGroups(calculation.assetClassGroups).forEach(acg => map.set(acg.id, acg));

    allocationConstraints.forEach(ac => {

      let acg : AssetClassGroup = map.get(ac.id);
      if (acg) {

        acg.allocationConstraint.aggregation = ac.aggregation;
        acg.allocationConstraint.lowerBound = ac.lowerBound;
        acg.allocationConstraint.upperBound = ac.upperBound;
      }
    });

    this.setAllocationConstraintUserDefaults(calculation.allocationConstraints, true);

  }

  static reimportDualConstraints(calculation: Calculation, dualConstraints: DualConstraint[]) {

    calculation.dualConstraints = dualConstraints;
    this.setDualConstraintAssociations(calculation.assetClassGroups, dualConstraints);
  }

  static applyUpdatedAssetClasses(calculation: Calculation, updatedAssetClasses: AssetClass[],
                                  updatedAssetClassGroups: AssetClassGroupUpdate[]) {

    let map = new Map();
    updatedAssetClasses.forEach( uac => map.set( uac.id, uac ) );

    // apply asset classes
    calculation.assetClasses.forEach( ac => {

      let uac = map.get( ac.id );
      if (uac) {

        // ac views bubble chart
        ac.marketData.volatility = uac.marketData.volatility;
        ac.marketData.volatilityReturn = uac.marketData.volatilityReturn;

        // frontier distance bubble chart
        ac.prospectiveReturn = uac.prospectiveReturn;
        ac.marketReturn = uac.marketReturn;
        ac.investmentViewReturn = uac.investmentViewReturn;
      }
    });

    // apply asset class groups
    const acguMap = new Map<number,AssetClassGroupUpdate>();
    updatedAssetClassGroups.forEach( acgu => acguMap.set( acgu.id, acgu ) );
    calculation.flatAssetClassGroups.forEach( acg => {

      acg.volatility = acguMap.get( acg.id ).volatility;

    });
  }

  static updateUserDefinedAndOptimalDurationConstraints(calculation: Calculation, durationConstraints: UserDefinedAndOptimalDurationConstraint[] ) {

    let map = new Map();
    durationConstraints.forEach( dc => map.set( dc.id, dc ) );

    calculation.flatDurationConstraints.forEach( dc => {

      dc.userDefinedAndOptimal = map.get( dc.id );

    } );
  }

  private static calculateAggregatedISViewValues(calculation: Calculation) {
    // calculation.riskFactors.forEach( riskFactor=> {
    //   if (riskFactor.investmentViews) {
    //     let ivMarketData = riskFactor.adjustedMarketData;
    //     riskFactor.investmentViews.forEach(iv => {
    //       let yearLabel = iv.year.toString().substr(2, 4);
    //       let ivValue;
    //
    //       switch (riskFactor.investmentViewType) {
    //         case 'Total':
    //           ivValue = iv.value;
    //           break;
    //         case 'Change':
    //           ivMarketData += iv.value;
    //           ivValue = ivMarketData;
    //           break;
    //         default: {//default as change
    //           ivMarketData += iv.value;
    //           ivValue = ivMarketData;
    //           break;
    //         }
    //       }
    //       iv.agregatedValue = ivValue;
    //     });
    //   }
    // });
  }

  static updatePortfolioAttributes( calculation: Calculation, updateDto: PortfolioAttributesUpdateOutDto ){
    calculation.userDefinedPortfolio.trackingError = updateDto.userDefinedTrackingError;
    calculation.userDefinedPortfolio.portfolioReturn = updateDto.userDefinedReturn;
    calculation.currentPortfolio.trackingError = updateDto.currentTrackingError;
    calculation.currentPortfolio.portfolioReturn = updateDto.currentReturn;
  }

  static setSavedValues(calculation: Calculation) {
    calculation.spRatioUpperBoundSaved = calculation.spRatioUpperBound;
  }

  static resetSavedValues(calculation: Calculation, calculationUpdate?: CalculationUpdate ) {
    calculation.spRatioUpperBound = calculationUpdate ? calculationUpdate.spRatioUpperBound : calculation.spRatioUpperBoundSaved;
  }
}
