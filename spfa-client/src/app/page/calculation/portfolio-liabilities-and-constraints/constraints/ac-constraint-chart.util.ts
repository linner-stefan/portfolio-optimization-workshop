import {AssetClassGroup, AssetClass, Portfolio} from "@app/base/asset-class/asset-class.model";
import {AssetClassUtil} from "@app/base/asset-class/asset-class.util";
export class ACConstraintChartUtil {

  static initOptimalAllocation( assetClassGroups: AssetClassGroup[], optimal: Portfolio ) {

    AssetClassUtil.flattenAssetClassGroups( assetClassGroups )
      .filter( acg => acg.assetClass );
      // .forEach( acg => {
      //
      //   acg.metadata.allocationOptimalSum = optimal.allocationsMap.get(acg.assetClass.id).navPercentage;
      // });
  }

  static setOptimilAllocations( portfolioFrom: Portfolio, portfolioUserDefined: Portfolio,
                                assetClassGroups: AssetClassGroup[], navSum: number ) {

    AssetClassUtil.flattenAssetClassGroups( assetClassGroups )
      .filter( acg => acg.assetClass )
      .forEach( acg => {

        const allocationUserDefined = portfolioUserDefined.allocationsMap.get(acg.assetClass.id);
        const allocationFrom = portfolioFrom.allocationsMap.get( acg.assetClass.id );
        acg.metadata.allocationSum
          = allocationUserDefined.navPercentage
          = allocationFrom.navPercentage;
        allocationUserDefined.navTotal = allocationUserDefined.navPercentage *navSum;
      });
  }
}
