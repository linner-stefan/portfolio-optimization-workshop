import {AllocationConstraint, AssetClass, AssetClassGroup, CurrencyInfo, Portfolio} from "./asset-class.model";

export class AssetClassUtil {

  static flattenAssetClassGroups(assetClassGroups: AssetClassGroup[], rootId?:number) : AssetClassGroup[] {
    const flat = [].concat(...assetClassGroups);

    assetClassGroups.forEach(acg => {
      let rootIdCurrent: number = rootId;
      if ( ! rootIdCurrent ){
        rootIdCurrent = acg.definitionId;
      }
      acg.rootId = rootIdCurrent;

      if (acg.subClasses) {
        flat.push(...this.flattenAssetClassGroups(acg.subClasses, rootIdCurrent));
      } else {
        acg.assetClass.group=acg;
      }
    });

    return flat;
  }

  static updateConstraintsAndAllocationMetadata( assetClassGroups: AssetClassGroup[], portfolioUserDefined: Portfolio) {

    assetClassGroups.forEach(assetClassGroup => {

      let metadata = assetClassGroup.metadata;
      if (assetClassGroup.subClasses) {

        this.updateConstraintsAndAllocationMetadata(assetClassGroup.subClasses, portfolioUserDefined);

        // prepare for aggregation

        metadata.allocationSum = 0;
        metadata.allocationCurrentSum = 0;
        metadata.allocationOptimalSum = 0;

        if (assetClassGroup.allocationConstraint.userAdjustedAggregation) {

          assetClassGroup.allocationConstraint.userAdjustedLowerBound = 0;
          assetClassGroup.allocationConstraint.userAdjustedUpperBound = 0;
        }

        assetClassGroup.subClasses.forEach(subClass => { // aggregate values

          metadata.allocationSum += subClass.metadata.allocationSum;
          metadata.allocationCurrentSum += subClass.metadata.allocationCurrentSum;
          metadata.allocationOptimalSum += subClass.metadata.allocationOptimalSum;

          if (assetClassGroup.allocationConstraint.userAdjustedAggregation) {

            assetClassGroup.allocationConstraint.userAdjustedLowerBound += subClass.allocationConstraint.userAdjustedLowerBound;
            assetClassGroup.allocationConstraint.userAdjustedUpperBound += subClass.allocationConstraint.userAdjustedUpperBound;
          }

          if (assetClassGroup.allocationConstraint.userAdjustedLowerBound < -0.05)
            assetClassGroup.allocationConstraint.userAdjustedLowerBound = -0.05;

          if (assetClassGroup.allocationConstraint.userAdjustedUpperBound > 1)
            assetClassGroup.allocationConstraint.userAdjustedUpperBound = 1;
        });

      } else {

        // leaf

        if ( !assetClassGroup.assetClass.userSelected ) {

          // exclude, set bounds to 0

          assetClassGroup.allocationConstraint.userAdjustedLowerBound = 0;
          assetClassGroup.allocationConstraint.userAdjustedUpperBound = 0;

          // const allocationUserDefined = portfolioUserDefined.allocationsMap.get(assetClassGroup.assetClass.id);
          // assetClassGroup.metadata.allocationSum = allocationUserDefined.navPercentage = 0; // user defined
          assetClassGroup.metadata.allocationSum = 0; // user defined
          // allocationUserDefined.navTotal = 0;
        }
      }

    });
  }

  static getAssetClassAllocationSum(assetClassGroups: AssetClassGroup[]) {

    // sum of top level allocations

    return assetClassGroups.reduce( ( sum, assetClassGroup ) => sum + assetClassGroup.metadata.allocationSum, 0 );
  }

  static getAssetClassGroupLiabilitySum( assetClassGroups: AssetClassGroup[] ) {

    // sum of top level liabilities

    return assetClassGroups.reduce( ( sum, assetClassGroups ) => sum + assetClassGroups.metadata.liabilitySum, 0 );
  }

  static setAssetClassAllocation(assetClassGroups: AssetClassGroup[], navSum: number) {

    this.flattenAssetClassGroups( assetClassGroups )
      .filter( acg => acg.assetClass )
      .forEach( acg => {

        let metadata = acg.metadata;

        // metadata.allocationSum = acg.assetClass.portfolioAllocations[1].navPercentage;
        // metadata.allocationCurrentSum = acg.assetClass.portfolioAllocations[0].navPercentage;
        // metadata.allocationOptimalSum = 0;
      });
  }

  static getAssetClassNavSum(assetClasses: AssetClass[]) {

    return assetClasses.reduce((sum: number, assetClass: AssetClass) => sum +assetClass.marketData.nav, 0);
  }

  static updateLiabilitiesAndMetadata(assetClassGroups: AssetClassGroup[]) {

    assetClassGroups.forEach(acg => {

      if (acg.subClasses) {

        this.updateLiabilitiesAndMetadata(acg.subClasses);
        acg.metadata.liabilitySum = 0;
        acg.metadata.liabilityCurrentSum = 0;
        acg.subClasses.forEach(subClass => {

          acg.metadata.liabilitySum += subClass.metadata.liabilitySum;
          acg.metadata.liabilityCurrentSum += subClass.metadata.liabilityCurrentSum;
        });

      } else {

        acg.metadata.liabilitySum = acg.assetClass.marketData.userAdjustedLiability;
        acg.metadata.liabilityCurrentSum = acg.assetClass.marketData.liability;
      }

    });
  }

  static getAssetClassLiabilitySum(assetClasses: AssetClass[]) {

    return assetClasses.reduce((sum: number, assetClass: AssetClass) => sum +assetClass.marketData.liability, 0);
  }

  static collectAllocationConstraints(assetClassGroups: AssetClassGroup[]) : AllocationConstraint[] {

    let constraints = new Array<AllocationConstraint>();

    assetClassGroups.forEach(assetClassGroup => {

      if (assetClassGroup.subClasses)
        constraints = constraints.concat(this.collectAllocationConstraints(assetClassGroup.subClasses));

      if (!assetClassGroup.subClasses)
        constraints.push(assetClassGroup.allocationConstraint);
    });

    return constraints;
  }

  static getAggregatedCurrencies( assetClasses: AssetClass[] ) : CurrencyInfo[] {

    let currencies = new Map();

    assetClasses.forEach( ac => {

      let currency = ac.name.substring(0, 3);
      let total = currencies.get( currency );
      if ( total == undefined )
        total = 0;
      currencies.set( currency, total + ac.marketData.nav );

    } );

    let result : CurrencyInfo[] = [];
    currencies.forEach( ( total: number, currency: string ) => {

      result.push( {

        currency: currency,
        total: total

      } );
    } );

    return result;
  }
}
