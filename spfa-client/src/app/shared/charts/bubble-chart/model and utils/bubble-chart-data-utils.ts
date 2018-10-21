import {AssetClassGroup} from "@app/base/asset-class/asset-class.model";
import {BubbleChartDatum} from "./bubble-chart-datum";
import {AcHelper} from "@app/base/asset-class/asset-class-helper";
import {
  BubbleChartTypeEnum,
  BubbleChartDataAggregationFactory,
  BubbleChartDataAggregation
} from "@app/shared/charts/bubble-chart/config/bubble-chart-data-aggregation";

export class BubbleChartDataUtils{

  /**
   * For each element in assetClassGroups array of subtrees creates BubbleChartDatum and inserts it to mapAll.
   * Roots of all assetClassGroups subtrees are also inserted into mapSelected. Keys are AC ID's.
   *
   * @param assetClasses
   * @param mapAll
   * @param selected
   * @param type
   */
  static initializeDataStructures(assetClasses: AssetClassGroup[],
                                  mapAll: Map< number, BubbleChartDatum>,
                                  selected: BubbleChartDatum[],
                                  type: BubbleChartTypeEnum ){

    BubbleChartDataUtils.parse(assetClasses, selected, mapAll, type);

  }

  private static parse(assetClasses: AssetClassGroup[],
                       selected: BubbleChartDatum[],
                       mapAll: Map<number, BubbleChartDatum>,
                       type: BubbleChartTypeEnum ) {

    assetClasses.forEach((e, i) => {
      let acd: BubbleChartDatum = new BubbleChartDatum(e);
      acd.category = ""+i;

      acd.hasSelectedLeaf = this.parseAc(acd, mapAll, i, type);

      if ( acd.hasSelectedLeaf ){
        acd.setDisplayed(selected.length);
        selected.push(acd);
      }

    });
  }

  private static parseAc(acd: BubbleChartDatum, map: Map< number, BubbleChartDatum>,
                         category: number, type: BubbleChartTypeEnum ): boolean {
    let hasSelectedLeaf = false;

    map.set( acd.id, acd );

    if ( AcHelper.hasSubClasses( acd.assetClassGroup ) ) {

      acd.assetClassGroup.subClasses.forEach(subClass => {
        let acdNew = new BubbleChartDatum( subClass );

        acdNew.category = ""+category;
        acdNew.assetClassGroup.parent = acd.assetClassGroup;    // TODO: move to CalculationUtil.initStructures()

        hasSelectedLeaf = this.parseAc(acdNew,map,category,type) || hasSelectedLeaf;
      });
    }
    else {
      hasSelectedLeaf = acd.assetClassGroup.assetClass.userSelected;
    }

    acd.hasSelectedLeaf = hasSelectedLeaf;
    return hasSelectedLeaf;

  }

  /**
   * Removes datum from chart data array and updates moved BubbleChartDatum array element indexes accordingly.
   *
   * @param acDatum - datum to remove
   * @param chartData
   */
  static removeFromChartData(acDatum: BubbleChartDatum, chartData: BubbleChartDatum[] ) {
    if ( acDatum.isDisplayed() && acDatum.getDisplayedIndex() < chartData.length ) {
      chartData.splice( acDatum.getDisplayedIndex(), 1 );
      BubbleChartDataUtils.updateMovedIndexes( acDatum.getDisplayedIndex(), chartData );
      acDatum.setDisplayed( false );
    }
  }

  /**
   * Removes all chart data just by setting BubbleChartDatum displayed status to false
   * and returns an empty array to by replaced as new chart data
   *
   * @param chartData
   * @returns {Array} - empty array
   */
  static removeAllChartData( chartData: BubbleChartDatum[] ): Array<any>{
    chartData.forEach( e => e.setDisplayed( false ));
    return [];
  }

  /**
   * Sets BubbleChartDatum displayed index according to its position in chart data
   *
   * @param start - index position in chart data to start from
   * @param chartData
   */
  private static updateMovedIndexes(start: number, chartData: BubbleChartDatum[] ){
    for ( let i = start; i < chartData.length ; ++i ){
      chartData[i].setDisplayed(i);
    }
  }

  /**
   * Takes lowest common ancestor of all newly selected asset classes, displays descendants that should be displayed
   * according to currently displayed levels in chart, and if none of the descendants is displayed ( doesn't matter
   * if prior to this asset class selection, or just now), and none of ancestors is displayed, displays (inserts)
   * itself in the chart.
   *
   * @param lowestCommonAncestor
   * @param acDatumMap
   * @param chartData
   */
  static displayNewlySelectedAssetClasses(lowestCommonAncestor: AssetClassGroup, acDatumMap: Map<number,BubbleChartDatum>,
                                          chartData:BubbleChartDatum[] ): void{

    let descendantDisplayed = BubbleChartDataUtils.displayDescendants( lowestCommonAncestor, acDatumMap, chartData );
    if ( ! descendantDisplayed ){

      let ancestorDisplayed = BubbleChartDataUtils.isAncestorDisplayed( lowestCommonAncestor, acDatumMap );
      if ( ! ancestorDisplayed ){
        BubbleChartDataUtils.insertToChartData( acDatumMap.get( lowestCommonAncestor.id ), chartData );
      }
    }
  }

  /**
   * Recursively updates hasSelectedLeaf property in all BubbleChartDatum's given by the input assetClassGroup subtree.
   *
   * @param assetClass - subtree tu update
   * @param acDatumMap
   * @returns {boolean} - true if doesn't have selected leaf
   */
  static updateHasSelectedLeaf(assetClass: AssetClassGroup, acDatumMap: Map<number,BubbleChartDatum>): boolean{
    if ( ! AcHelper.hasSubClasses( assetClass ) ) {
      acDatumMap.get( assetClass.id ).hasSelectedLeaf = assetClass.assetClass.userSelected;
      return assetClass.assetClass.userSelected;
    }

    let hasSelectedLeaf = false;
    assetClass.subClasses.forEach( e => {
      hasSelectedLeaf = BubbleChartDataUtils.updateHasSelectedLeaf( e, acDatumMap ) || hasSelectedLeaf;
    });
    if ( hasSelectedLeaf ){
      acDatumMap.get( assetClass.id ).hasSelectedLeaf = true;
    }
    return hasSelectedLeaf;
  }

  /**
   * Recursively searches the tree, given by ac input.
   * If none of descendants is displayed, display itself if any of my siblings or their descendants are displayed.
   *
   * @param ac - current node
   * @param acDatumMap
   * @param chartData
   * @returns {boolean} - true if current node or any of descendants are displayed
   */
  private static displayDescendants(ac: AssetClassGroup, acDatumMap: Map<number,BubbleChartDatum>, chartData: BubbleChartDatum[] ): boolean{

    let acDatum: BubbleChartDatum = acDatumMap.get( ac.id );
    if ( acDatum.isDisplayed() ){
      return true;
    }

    let descendantDisplayed = false;
    if ( AcHelper.hasSubClasses( ac ) ){
      ac.subClasses.forEach(e => {
        descendantDisplayed = BubbleChartDataUtils.isDescendantDisplayed(e, acDatumMap) || descendantDisplayed;
      });
    }

    if ( ! descendantDisplayed ){
      let result = BubbleChartDataUtils.isSiblingDisplayed( ac, acDatumMap );
      if ( result ){
        BubbleChartDataUtils.insertToChartData( acDatum, chartData );
        return true;
      }
    }

    return descendantDisplayed;
  }

  /**
   * Checks isDisplayed() state on ancestors
   *
   * @param ac
   * @param acDatumMap
   * @returns {boolean} - true if any of ancestors is displayed
   */
  private static isAncestorDisplayed(ac: AssetClassGroup, acDatumMap: Map<number,BubbleChartDatum> ): boolean{
    let currentParent: AssetClassGroup = ac.parent;
    while ( currentParent ){
      if ( acDatumMap.get( currentParent.id).isDisplayed() ){
        return true;
      }
      currentParent = currentParent.parent;
    }
    return false;
  }

  /**
   * Checks isDisplayed() state on siblings and their descendants
   *
   * @param ac
   * @param acDatumMap
   * @returns {boolean} - true if sibling or his descendant is displayed
   */
  private static isSiblingDisplayed(ac: AssetClassGroup, acDatumMap: Map<number,BubbleChartDatum> ): boolean{
    if ( ac.parent == null ){
      return false;
    }
    if ( ac.parent.subClasses.length == 1 ) {    // no siblings
      return false;
    }

    let displayed = false;
    ac.parent.subClasses.forEach( e => {
      if ( e !== ac ){
        displayed = BubbleChartDataUtils.isDescendantDisplayed( e, acDatumMap ) || displayed;
      }
    });

    return displayed;
  }

  /**
   * Recursively checks isDisplayed() state on given asset class and its descendants.
   *
   * @param ac  - current node
   * @param acDatumMap
   * @returns {boolean} - true, if current node or any of its descendants is displayed
   */
  private static isDescendantDisplayed(ac: AssetClassGroup, acDatumMap: Map<number,BubbleChartDatum> ): boolean{
    let acDatum: BubbleChartDatum = acDatumMap.get( ac.id );
    if ( acDatum.isDisplayed() )
      return true;
    if ( ! AcHelper.hasSubClasses( ac ) )
      return acDatum.isDisplayed();

    let displayed = false;
    ac.subClasses.forEach( e => {
      displayed = BubbleChartDataUtils.isDescendantDisplayed( e, acDatumMap );
    });

    return displayed;
  }


  /**
   * Recursively searches current AC's descendants. If current node is unselected leaf,
   * or if none of my descendants has selected leaf, removes this node from chart data.
   *
   * This method can't rely on BubbleChartDatum.hasSelectedLeaf and needs to go deep to the leafs,
   * but as it traverses the tree, it updates hasSelectedLeaf property.
   *
   * @param ac - current node
   * @param acDatumMap
   * @param chartData
   * @returns {boolean} - true if current node is selected leaf, or its descendants has selected leaf
   */
  static removeUnselected(ac: AssetClassGroup,
                          acDatumMap: Map<number,BubbleChartDatum>,
                          chartData: BubbleChartDatum[]): boolean{

    let acDatum: BubbleChartDatum = acDatumMap.get( ac.id );

    if ( ! AcHelper.hasSubClasses( ac ) ){
      if ( ! ac.assetClass.userSelected ){

        BubbleChartDataUtils.removeFromChartData( acDatum, chartData );

      }
      return ac.assetClass.userSelected
    }
    else {

      let hasSelectedLeaf = false;
      ac.subClasses.forEach( e => {
        hasSelectedLeaf = BubbleChartDataUtils.removeUnselected( e, acDatumMap, chartData ) || hasSelectedLeaf;
      });
      if ( ! hasSelectedLeaf ){
        BubbleChartDataUtils.removeFromChartData(  acDatum, chartData );
      }

      acDatum.hasSelectedLeaf = hasSelectedLeaf;

      return hasSelectedLeaf;
    }

  }

  /**
   * https://en.wikipedia.org/wiki/Lowest_common_ancestor
   *
   * Basic algorithm is extended to support trees with unspecified branching factor.
   *
   * @param root
   * @param a
   * @param b
   * @returns {any} - LCA of a and b in given tree root
   */
  static lowestCommonAncestor(root: AssetClassGroup, a: AssetClassGroup, b: AssetClassGroup): AssetClassGroup{
    if ( root == null )
      return null;
    if ( root == a || root == b )
      return root;
    if ( ! AcHelper.hasSubClasses( root ) )
      return null;

    let results = [];
    root.subClasses.forEach( e => {
      let result = BubbleChartDataUtils.lowestCommonAncestor( e, a, b );
      if (result != null )
        results.push( result );
    });

    // If we get left and right not null , it is lca for a and b
    if( results.length == 2)
      return root;
    if( results.length == 1 )
      return results[ 0 ] ;
    if ( results.length == 0 ){
      return null
    }

    console.error("Unexpected number of lowest common ancestors!");
    return null;
  }

  /**
   * Pushes to chart data array and sets isDisplayed property to its current index in chart data
   *
   * @param acd
   * @param chartData
   */
  static insertToChartData(acd: BubbleChartDatum, chartData: BubbleChartDatum[] ): void{
    if ( acd ){
      acd.setDisplayed( chartData.length );
      chartData.push( acd );
    }
  }

  /**
   * Calculates averages or sums of asset class group descendant values
   *
   * @param acTrees
   * @param acDatumMap
   * @param type
   */
  static aggregateGroupValues(acTrees: AssetClassGroup[],
                              acDatumMap: Map<number,BubbleChartDatum>,
                              type: BubbleChartTypeEnum){
    const dataAggregationFactory = new BubbleChartDataAggregationFactory();
    acTrees.forEach( e => {
      BubbleChartDataUtils.aggregateGroupValuesInternal( e, acDatumMap, type, dataAggregationFactory );
    });
  }

  /**
   * Creates aggregatedValues for the current BubbleChartDatum.
   * If BubbleChartDatum has subclasses, calculate from values of its subclasses. If BubbleChartDatum doesn't have subclasses,
   * it already contains calculated values from BE. It calculates only averages of selected leaf AC's.
   *
   * @param ac
   * @param acDatumMap
   * @param type
   * @param dataAggregationFactory
   */
  private static aggregateGroupValuesInternal(ac: AssetClassGroup,
                                              acDatumMap: Map<number,BubbleChartDatum>,
                                              type: BubbleChartTypeEnum,
                                              dataAggregationFactory: BubbleChartDataAggregationFactory ){
    let aggregatedValuesSums: BubbleChartDataAggregation = dataAggregationFactory.createDataAggregation(type);
    aggregatedValuesSums.initializeFromGroup(ac);

    let acDatum: BubbleChartDatum = acDatumMap.get( ac.id );
    acDatum.aggregatedValues = dataAggregationFactory.createDataAggregation(type);

    if ( ! acDatum.hasSelectedLeaf || ! AcHelper.hasSubClasses( ac ) )
      return;

    ac.subClasses.forEach( e => {

      let isLeaf = ! AcHelper.hasSubClasses( e );
      if ( ! isLeaf ) {
        BubbleChartDataUtils.aggregateGroupValuesInternal(e, acDatumMap, type, dataAggregationFactory);
      }

      let currentAcDatum: BubbleChartDatum = acDatumMap.get( e.id );

      // if not a leaf, currentAcDatum now has aggregated values
      if ( ! isLeaf && currentAcDatum.hasSelectedLeaf ) {

        aggregatedValuesSums.add( currentAcDatum.aggregatedValues );

      }
      else if ( isLeaf && e.assetClass.userSelected ){

        currentAcDatum.aggregatedValues = dataAggregationFactory.createDataAggregation(type);
        currentAcDatum.aggregatedValues.initializeFromGroup(e);
        currentAcDatum.aggregatedValues.initializeFromAc(e.assetClass);
        aggregatedValuesSums.add( currentAcDatum.aggregatedValues );

      }

    });

    if ( acDatum.aggregatedValues.needsSecondRun ) {
      aggregatedValuesSums.clearBeforeSecondRun();
      ac.subClasses.forEach(e => {
        let currentAcDatum: BubbleChartDatum = acDatumMap.get(e.id);

        aggregatedValuesSums.secondRun( currentAcDatum.aggregatedValues );
      });
    }

    aggregatedValuesSums.doAverage();
    acDatum.aggregatedValues = aggregatedValuesSums;
  }

  static getRootAncestor(currentAcDatum: BubbleChartDatum): AssetClassGroup {
    let currentRootAncestor: AssetClassGroup = null;
    let currentParent: AssetClassGroup = currentAcDatum.assetClassGroup.parent;
    do {
      if (!currentParent.parent) {
        currentRootAncestor = currentParent;
      }
      currentParent = currentParent.parent
    } while (currentParent);
    return currentRootAncestor;
  }

}
