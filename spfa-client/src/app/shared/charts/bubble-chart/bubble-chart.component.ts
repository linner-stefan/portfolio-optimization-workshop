import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  AfterViewInit
} from "@angular/core";
import * as d3 from "d3";
import {VoronoiPolygon} from "d3-voronoi";
import {BubbleChartDatum} from "./model and utils/bubble-chart-datum";
import {BubbleChartDataUtils} from "./model and utils/bubble-chart-data-utils";
import {AssetClassGroup, AssetClassSelect} from "@app/base/asset-class/asset-class.model";
import {AcHelper} from "@app/base/asset-class/asset-class-helper";
import {Subscription} from "rxjs";
import {CalculationService} from "@app/base/calculation/calculation.service";
import {ChartTooltip} from "@app/shared/chart-tooltip";
import {ChartConfig} from "@app/shared/chart-config";
import {BubbleChartConfig} from "@app/shared/charts/bubble-chart/config/bubble-chart-config";
import {BubbleChartTypeEnum} from "@app/shared/charts/bubble-chart/config/bubble-chart-data-aggregation";
import {ValueUtil} from "@app/shared/value.util";
import {ChartForceLabels} from "@app/shared/charts/chart-force-labels/chart-force-labels.component";
import {ChartForceDatum} from "@app/shared/charts/chart-force-labels/chart-force-labels.model";

/**
 * Things to do when creating new bubble chart type:
 * - new BubbleChartTypeEnum,
 * - new BubbleChartConfig and BubbleChartDataAggregation implementation
 * - add the new BubbleChartTypeEnum into BubbleChartDataAggregationFactory
 *
 */
@Component({
  selector: 'bubble-chart',
  templateUrl: 'bubble-chart.component.html',
  styleUrls: ['../../../shared/chart-default.scss','bubble-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BubbleChartComponent implements AfterViewInit, OnInit, OnDestroy {

  @Input() typeConfig: BubbleChartConfig;
  typeEnum = BubbleChartTypeEnum;

  /**
   * Change in AC selection/un-selection. Currently disabled.
   */
  @Input() onChange: EventEmitter<AssetClassSelect>;
  /**
   * Change in AC data
   */
  @Input() private onBubbleChartChange: EventEmitter<any>;
  @Input() private onCalculationRefresh: EventEmitter<any>;
  @Input() private onTypeSpecificRefresh: EventEmitter<any>;


  @Input() private acTree: AssetClassGroup[];

  @ViewChild('chart') private chartContainer: ElementRef;

  /**
   * Displayed AC's in the chart
   */
  private chartData: BubbleChartDatum[] = [];

  /**
   * All AC's kept as a map, for fast addition of newly selected/deselected AC's to/from chart data.
   * BubbleChartDatum holds this.chartData indexInChartData, if this datum is selected and displayed in chart.
   *
   * We keep all BubbleChartDatum objects in memory for D3.js data joins to work correctly.
   * D3.js is probably storing references to these objects and uses them to know,
   * which datum has entered or exited the chart or just has been updated.
   */
  private acDatumMap: Map< number, BubbleChartDatum> = new Map();

  dynamicStyles = {
    loaderDisplay: "block",
    nothingToDisplay: "block",
  };

  public config = {
    margin: { top: 20, bottom: 55, left: 65, right: 20},  // also fox Axis ticks
    opacity: 0.8,
    opacityLabelText: 0.6,
    dragEnabled: false,
    maxRadius: 20,           // px
    circleClickTolerance: 5, // px
    strokeWidth: 2,
    labelFontSize: 10,       // px
    tooltipOpacity: 0.9,
    colors: ChartConfig.acColors
  };

  private configDebug = {
    drawVoronoiPolygons: false,
    debugClickEvent: false
  };

  axisXType = 0;
  axisYType = 0;

  // template switch
  private useSecondaryRadius: boolean = false;

  private chart: any;
  private width: number;
  private height: number;

  private xAxis: any;
  private yAxis: any;
  private xAxisGrid : any;
  private yAxisGrid : any;
  private labels : any;
  private chartForceData: ChartForceDatum[] = [];
  private chartForceLabels: ChartForceLabels;
  private tooltip : any;

  private xScale: any;
  private yScale: any;
  private radiusScale: any;

  private subscriptions: Array<Subscription> = [];


  constructor( private _NgZone: NgZone,
               private calculationService: CalculationService) {

    // interact with angular from outside (d3.js)
    window['BubbleChartComponentRef'] = {component: this, zone: _NgZone};
  }

  ngOnInit(): void {
    this.dynamicStyles.loaderDisplay = "none";
  }

  ngAfterViewInit(): void {
    BubbleChartDataUtils.initializeDataStructures( this.acTree, this.acDatumMap, this.chartData, this.typeConfig.type );
    BubbleChartDataUtils.aggregateGroupValues( this.acTree, this.acDatumMap, this.typeConfig.type );

    this.createChart();
    this.updateChart();

    if ( this.onChange ) {
      this.subscriptions.push(this.onChange.subscribe(assetClassSelect => {
          console.log("bubble chart onChange()");
          this.onSelectedAssetClassSelect(assetClassSelect);
        })
      );
    }

    if ( this.onBubbleChartChange ) {
      this.subscriptions.push(this.onBubbleChartChange.subscribe(() => {
        console.log("bubble chart onBubbleChartChange()");
        this.updateChart();
      }));
    }

    if ( this.onCalculationRefresh ) {
      this.subscriptions.push(this.onCalculationRefresh.subscribe(() => {
        console.log("bubble chart onCalculationRefresh()");
        this.updateChart();
      }));
    }

    if ( this.onTypeSpecificRefresh ) {
      this.subscriptions.push(this.onTypeSpecificRefresh.subscribe(() => {
        console.log("bubble chart onTypeSpecificRefresh()");
        this.updateChart();
      }));
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach( e => e.unsubscribe() );
  }

  private createChart() {

    if ( ! this.chartData.length )
      return;

    let config = this.config;
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - config.margin.left - config.margin.right;
    this.height = element.offsetHeight - config.margin.top - config.margin.bottom;

    // tooltip
    this.tooltip = d3.select(element).append("div")
      .attr("class", "chart-tooltip")
      .style("display", "none");

    let svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight)
      .on("click", this.onCircleLeftClick )
      .on('contextmenu', this.onCircleRightClick);

    // define X & Y domains
    let xDomain = this.getXDomain();
    let yDomain = this.getYDomain();
    let radiusDomain = this.getRadiusDomain();

    // create scales
    this.xScale = d3.scaleLinear().domain(xDomain).range([0, this.width]);
    this.yScale = d3.scaleLinear().domain(yDomain).range([this.height, 0]);
    this.radiusScale = d3.scaleLinear().domain(radiusDomain).range([5, this.config.maxRadius]);

    // x & y axis
    this.xAxis = svg.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top + this.height})`)
      .call(this.getXAxis());
    this.xAxis.append('text')
      .attr('class', 'axis-label')
      .attr('x', '50%')
      .attr('y', 35 )
      .style('text-anchor', 'middle')
      .style('alignment-baseline', 'hanging ') // hanging = top
      .text( this.typeConfig.axisXLabel );
    this.xAxisGrid = svg.append('g')
      .attr('class', 'axis-grid')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top + this.height})`)
      .call(this.getXAxisGrid());
    this.xAxis.append('path')
      .attr('class', 'axis-x-line')
      .attr('d', `M0,0H${this.width}`);
    this.yAxis = svg.append('g')
      .attr('class', 'axis axis-y')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`)
      .call(this.getYAxis());
    this.yAxis.append('text')
      .attr('class', 'axis-label')
      .attr('x', - this.height / 2)
      .attr('y', -50)
      .attr("transform", `rotate(-90 )`)
      .style('text-anchor', 'middle')
      .text( this.typeConfig.axisYLabel );
    this.yAxisGrid = svg.append('g')
      .attr('class', 'axis-grid')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`)
      .call(this.getYAxisGrid());
    this.yAxis.append('path')
      .attr('class', 'axis-y-line')
      .attr('d', `M0,0V${this.height}`);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'plotArea')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);

    // labels layer
    this.labels = svg.append("g")
      .attr("class", "label")
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);

  }

  private updateChart() {

    if ( ! this.chart )
      return;

    BubbleChartDataUtils.aggregateGroupValues( this.acTree, this.acDatumMap, this.typeConfig.type );

    if ( ! this.isChartDataValid() ){
      return;
    }

    console.log("bubble chart data", this.chartData);

    // update scales & axis


    if ( this.chartData.length ) {
      const xDomain = this.getXDomain();
      const yDomain = this.getYDomain();

      console.log(xDomain);
      console.log(yDomain);

      if ( Math.abs(ValueUtil.round( xDomain[0], 2 )) == 0 && Math.abs(ValueUtil.round( xDomain[1], 2 )) == 0
        && Math.abs(ValueUtil.round( yDomain[0], 2 )) == 0 && Math.abs(ValueUtil.round( yDomain[1], 2 )) == 0   ){
        this.dynamicStyles.nothingToDisplay = 'block';
        return;
      }
      else {
        this.dynamicStyles.nothingToDisplay = 'none';
      }

      this.xScale.domain(xDomain);
      this.yScale.domain(yDomain);
      this.radiusScale.domain(this.getRadiusDomain());
      this.xAxis.transition().call(this.getXAxis());
      this.xAxisGrid.transition().call(this.getXAxisGrid());
      this.yAxis.transition().call(this.getYAxis());
      this.yAxisGrid.transition().call(this.getYAxisGrid());
    }
    else {
      this.dynamicStyles.nothingToDisplay = 'block';
    }

    let update = this.chart.selectAll("circle")
      .data(this.chartData,(d,i) => d.id );

    // remove missing
    update.exit()
      .transition()
      .attr("r", "0")
      .remove();

    //update existing
    update.attr("id", d => "acid_" + d.assetClassGroup.definitionId )
      .transition()
      .attr("cx", d => this.xScale(d.x(this.axisXType)) )
      .attr("cy", d => this.yScale(d.y(this.axisYType)) )
      .style("fill", (d, i) => d.radiusRounded(this.useSecondaryRadius, this.typeConfig.rounding+2) <= 0 ? "none" : this.getColor(d) )
      .style("stroke", (d, i) => d.radiusRounded(this.useSecondaryRadius, this.typeConfig.rounding+2) <= 0 ? this.getColor(d) : "none" )
      .style("stroke-width.px", this.config.strokeWidth)
      .attr("r", d => this.radiusScale(Math.abs(d.radius(this.useSecondaryRadius))));

    // add new circles
    update.enter().append("circle")
      .attr("id", d => "acid_" + d.assetClassGroup.definitionId )
      .attr("cx", d => this.xScale(d.x(this.axisXType)) )
      .attr("cy", d => this.yScale(d.y(this.axisYType)) )
      .attr("r", 0 )
      .style("fill", (d, i) => d.radiusRounded(this.useSecondaryRadius, this.typeConfig.rounding+2) <= 0 ? "none" : this.getColor(d) )
      .style("stroke", (d, i) => d.radiusRounded(this.useSecondaryRadius, this.typeConfig.rounding+2) <= 0 ? this.getColor(d) : "none" )
      .style("stroke-width.px", this.config.strokeWidth)
      .style("opacity", this.config.opacity)
      // TODO: problem when circles overlap... bind again on whole chart div, and calculated closest subject (circle) ?
      // TODO: bind after transition
      .on("mouseover", this.onShowTooltip)
      .on("mouseout", this.onHideTooltip)
      .transition()
      .attr("r", d => this.radiusScale(Math.abs(d.radius(this.useSecondaryRadius))));

    // chart labels
    update.exit()
      .each( (d,i) => {
          const deletedElement =
            this.chartForceData.splice( this.chartForceData.findIndex( chartForceDatum => chartForceDatum.id == d.id ), 1 );
          console.log('deletedElement', deletedElement);
      });
    update
      .each( d => {
        const chartForceDatum = this.chartForceData.filter( chartForceDatum => chartForceDatum.id == d.id )[0];
        this.updateChartForceDatum(d, chartForceDatum);
      });
    update.enter()
      .each( d => {
        const chartForceDatum = new ChartForceDatum();
        this.updateChartForceDatum(d, chartForceDatum);
        this.chartForceData.push( chartForceDatum );
      });
    if ( ! this.chartForceLabels ){
      this.chartForceLabels = new ChartForceLabels( this.chartForceData, [], this.labels,
        this.width, this.height, true );
    }
    this.chartForceLabels.update();

    //this.drawVoronoiLabels();

  }

  private updateChartForceDatum(from: BubbleChartDatum, to: ChartForceDatum) {
    to.id = from.id;
    to.x = this.xScale(from.x(this.axisXType));
    to.y = this.yScale(from.y(this.axisYType));
    to.radius = this.radiusScale(Math.abs(from.radius(this.useSecondaryRadius)));
    to.label = from.name;
  }

  onShowTooltip = d => {
    d3.event.stopPropagation();

    d3.select(d3.event.currentTarget)
      .style("stroke", d.radiusRounded(this.useSecondaryRadius, this.typeConfig.rounding+2) <= 0 ? this.getColor(d) : "black" )
      .style("fill", d.radiusRounded(this.useSecondaryRadius, this.typeConfig.rounding+2) <= 0 ? "grey" : this.getColor(d) );

    let radius = d.radius(this.useSecondaryRadius);
    let html = this.useSecondaryRadius ? this.typeConfig.radiusSecondaryFormat(radius) : this.typeConfig.radiusPrimaryFormat(radius);
    html = this.typeConfig.tooltipLabel ? this.typeConfig.tooltipLabel + ": " + html : html;

    ChartTooltip.showTooltip( this.tooltip, this.chartContainer.nativeElement, html );
  };

  onHideTooltip = d => {
    d3.event.stopPropagation();

    d3.select(d3.event.currentTarget)
      .style("fill", d.radiusRounded(this.useSecondaryRadius, this.typeConfig.rounding+2) <= 0 ? "none" : this.getColor(d) )
      .style("stroke", d.radiusRounded(this.useSecondaryRadius, this.typeConfig.rounding+2) <= 0 ? this.getColor(d) : "none" );

    ChartTooltip.hideTooltip( this.tooltip );
  };

  getColor(d: BubbleChartDatum): string {
    return this.config.colors.get(d.assetClassGroup.rootId);
  }

  // TODO: first select circle (put it in front of others), and than allow expansion
  onCircleLeftClick = () => {
    d3.event.stopPropagation();
    let _thisRef = window['BubbleChartComponentRef'];
    let subject = _thisRef.zone.run( () =>
      this.getClosestSubject()
    );
    if ( subject == null ){
      console.warn("No circle selected!");  // TODO: logger service
      return;
    }

    let subjectDataAssetClassGroup = this.chartData[subject].assetClassGroup;
    let circle = d3.select("#acid_" + subjectDataAssetClassGroup.definitionId );
    if ( this.configDebug.debugClickEvent )
      console.log("left click circle:",circle);

    let activeTransitionExists = d3.active( circle.node() );
    if ( activeTransitionExists )
      return;

    let radius = circle.attr("r");

    //check that AssetClassGroup has subclasses
    if (!subjectDataAssetClassGroup.subClasses ){
      return;
    }

    circle.transition()
      .attr("r", "" + (+radius * 2))
      .transition()
      .attr("r", radius)
      .on( "end", () => {
        ChartTooltip.hideTooltip( this.tooltip );
        _thisRef.zone.run(() => {

          this.expandCircle(subject);
          this.updateChart();

        })}
      );

  };

  onCircleRightClick = () => {
    d3.event.stopPropagation();
    d3.event.preventDefault();

    let _thisRef = window['BubbleChartComponentRef'];
    let subject = _thisRef.zone.run( () =>
      this.getClosestSubject()
    );
    if ( subject == null ){
      console.warn("No circle selected!");  // TODO: logger service
      return;
    }

    let circle = d3.select("#acid_" + this.chartData[subject].assetClassGroup.definitionId );
    if ( this.configDebug.debugClickEvent )
      console.log("right click circle",circle);

    let activeTransitionExists = d3.active( circle.node() );
    if ( activeTransitionExists )
      return;

    circle.transition()
      .attr("r", 0)
      .on( "end", () => {
        ChartTooltip.hideTooltip( this.tooltip );
        _thisRef.zone.run(() => {

          this.hideCircle(subject);
          this.updateChart();

        })}
      );

  };

  getClosestSubject() : number {
    let dx, dy, currentDistance, datum, circleRadiusBoxDiagonal, subject = null, smallestDistance = null;
    let eventX = d3.mouse(this.chart.node())[0], eventY = d3.mouse(this.chart.node())[1];

    if ( this.configDebug.debugClickEvent ) {
      console.log("getClosestSubject()");
      console.log(`eventX=${eventX}, eventY=${eventY}`);
    }

    for (let i = 0; i < this.chartData.length; ++i) {
      datum = this.chartData[i];
      dx = eventX - this.xScale(datum.x(this.axisXType));
      dy = eventY - this.yScale(datum.y(this.axisYType));
      currentDistance = Math.sqrt( dx * dx + dy * dy );
      circleRadiusBoxDiagonal =  Math.sqrt(2) * this.radiusScale( Math.abs(datum.radius(this.useSecondaryRadius)) );
      if ( currentDistance <=  circleRadiusBoxDiagonal + this.config.circleClickTolerance
        && (smallestDistance == null || currentDistance < smallestDistance) ) {
        subject = i;
        smallestDistance = currentDistance;
      }
      if ( this.configDebug.debugClickEvent ) {
        console.log(`x=${datum.x(this.axisXType)}(${this.xScale(datum.x(this.axisXType))}), y=${datum.y(this.axisYType)}(${this.yScale(datum.y(this.axisYType))}), dx=${dx}, dy=${dy}, 
          circleRadiusBoxDiagonal=${circleRadiusBoxDiagonal}, currentDistance=${currentDistance}, smallestDistance=${smallestDistance}`);
      }
    }

    return subject;
  }

  /**
   * Inserts clicked (and selected) riskFactorGroup subclasses into chart data
   *
   * @param subject - index in chart data array
   */
  expandCircle(subject: number){
    let acDatum = this.chartData[subject];
    let ac = acDatum.assetClassGroup;

    if ( AcHelper.hasSubClasses( ac ) ){

      BubbleChartDataUtils.removeFromChartData( acDatum, this.chartData );

      ac.subClasses.forEach( e => {

        let acd = this.acDatumMap.get(e.id);
        if ( acd.hasSelectedLeaf ) {

          BubbleChartDataUtils.insertToChartData(acd,this.chartData);

        }
      });
    }
  }

  hideCircle(subject: number){
    let acDatum = this.chartData[subject];
    BubbleChartDataUtils.removeFromChartData( acDatum, this.chartData );
  }

  onChangeRadius(checked: boolean){
    this.useSecondaryRadius = checked;
    this.updateChart();
  }

  onCollapseAll(){
    if ( this.chartData.length ){
      this.chartData = BubbleChartDataUtils.removeAllChartData( this.chartData );
    }
    if ( this.acTree.length ){
      this.acTree.forEach( e => {
        let acDatum = this.acDatumMap.get( e.id );
        if ( acDatum.hasSelectedLeaf ){
          BubbleChartDataUtils.insertToChartData( acDatum ,this.chartData);
        }
      });
      this.updateChart();
    }
  }

  /**
   * Handle selection changes in AC hierarchy tree. All input ID's are selected or all unselected,
   * based on AssetClassChange.selected state.
   *
   * @param assetClassSelect - ID's of newly selected / unselected leaf asset classes
   */
  onSelectedAssetClassSelect(assetClassSelect: AssetClassSelect){
    console.log("onSelectedAssetClassSelect():",assetClassSelect);

    if ( assetClassSelect.assetClassIds.length ){

      if ( ! assetClassSelect.selected && ! this.chartData.length ){
        console.warn("Chart data are empty! Nothing to unselect.");
        return;
      }

      let rootAncestor = null, currentRootAncestor;
      for ( const currentId of assetClassSelect.assetClassIds ){

        let currentAcDatum = this.acDatumMap.get( currentId );

        // TODO MS, SELECT AUTOMATICALLY UPDATED
        // if ( currentAcDatum.assetClassGroup.assetClass.selected == assetClassSelect.selected ){
        //   console.warn("Asset class selection doesn't correspond to current asset class selected status!");
        // }

        currentRootAncestor = BubbleChartDataUtils.getRootAncestor(currentAcDatum);
        if ( ! rootAncestor && currentRootAncestor != null) {
          rootAncestor = currentRootAncestor;
        }
        else if (currentRootAncestor == null || currentRootAncestor != rootAncestor) {
          console.error("Top-level root ancestor should always be the same");
          return null;
        }
        rootAncestor = currentRootAncestor;

        // SET NEW SELECTED STATE
        // TODO MS, SELECT AUTOMATICALLY UPDATED
        // currentAcDatum.assetClassGroup.assetClass.selected = assetClassSelect.selected;

      }

      // selected
      if ( assetClassSelect.selected ) {

        // find lowest common ancestor of multiple nodes with unspecified branching factor
        let lowestCommonAncestor = this.acDatumMap.get(assetClassSelect.assetClassIds[0]).assetClassGroup;
        if (assetClassSelect.assetClassIds.length > 1) {
          for (let i = 1; i < assetClassSelect.assetClassIds.length; ++i ) {
            lowestCommonAncestor = BubbleChartDataUtils.lowestCommonAncestor(rootAncestor,
              this.acDatumMap.get(assetClassSelect.assetClassIds[ i ]).assetClassGroup, lowestCommonAncestor);
          }
        }

        BubbleChartDataUtils.displayNewlySelectedAssetClasses( lowestCommonAncestor, this.acDatumMap, this.chartData );
        BubbleChartDataUtils.updateHasSelectedLeaf( rootAncestor, this.acDatumMap );
      }
      // unselected
      else {
        BubbleChartDataUtils.removeUnselected(rootAncestor, this.acDatumMap, this.chartData );
      }

      if ( ! this.chart && this.chartData.length ){
        this.createChart();
      }
      this.updateChart();
    }
  }

  /**
   * Voronoi tessellation is a simple heuristic for labeling scatter plots.
   * https://bl.ocks.org/mbostock/6909318
   */
  private drawVoronoiLabels(){
    // TODO: create chart data in the format for Voronoi d[0] is X, d[1] is y, d[3] can be an object with additional data

    let dataForVoronoi = [];
    this.chartData.forEach( e => dataForVoronoi.push( [this.xScale(e.x(this.axisXType)), this.yScale(e.y(this.axisYType))] ));

    let polygons = d3.voronoi()
      .extent([[0, 0], [this.width, this.height]])
      .polygons(dataForVoronoi);

    if ( this.configDebug.drawVoronoiPolygons ){
      this.drawVoronoiPolygons( polygons );
    }

    // add polygons to data, calculate centroid
    this.chartData.forEach( (e,i) => {

      // TODO: if exists more than one datum with exactly the same X and Y, polygons will be generated only for one
      // maybe even if one of dimensions is has two identical values
      if ( ! polygons[i] ){
        console.warn("Datum with the same X and Y probably exists in the data! Label for current datum is centered. " +
          "i = " + i + ", datum = ");
        console.log("datum:",e);
        e.voronoiPolygonCentroid = [this.xScale(e.x(this.axisXType)), this.yScale(e.y(this.axisYType))];
        return;
      }

      //noinspection TypeScriptUnresolvedVariable,TypeScriptUnresolvedFunction
      e.voronoiPolygon = polygons[i].slice( 0, polygons[i].length );

      let polygonForGeoJson = e.voronoiPolygon;
      polygonForGeoJson.push(e.voronoiPolygon[0]); // polygon in GeoJSON needs to be closed !!!!
      e.voronoiPolygonCentroid = d3.geoPath().centroid(
        {
          "type": "Polygon",
          "coordinates": [polygonForGeoJson]
        } as any  // as any, due to Bamboo build error "Object literal may only specify known properties, and '"coordinates"' does not exist in type 'GeoPermissibleObjects'."
      );

    } );

    // labels
    let update = this.labels.selectAll("text")
      .data( this.chartData, (d,i) => d.id );

    update.exit().transition()
      .attr("x", d => this.xScale(d.x(this.axisXType)))
      .attr("y", d => this.yScale(d.y(this.axisYType)))
      .style("opacity", 0)
      .remove();

    update.transition()
      .text( d => d.name)
      .attr("x", d => this.calcLabelX(d))
      .attr("y", d => this.calcLabelY(d));

    update.enter().append("text")
        .text( d => d.name)
        .attr("text-anchor", "middle")
        .attr("x", d => this.xScale(d.x(this.axisXType)))
        .attr("y", d => this.yScale(d.y(this.axisYType)))
        .style("opacity", 0)
      .transition()
        .style("opacity", this.config.opacityLabelText)
        // TODO: calculate exact direction to centroid (now only in 4 diagonal directions)
        .attr("x", d => this.calcLabelX(d))
        .attr("y", d => this.calcLabelY(d));

    if ( this.configDebug.drawVoronoiPolygons ){
      this.drawVoronoiPolygonCentroids()
    }
  }

  calcLabelY(d) {
    const y = this.yScale(d.y(this.axisYType));
    const radius = this.radiusScale(Math.abs(d.radius(this.useSecondaryRadius)));
    let direction = Math.sign(d.voronoiPolygonCentroid[1] - y);
    direction = direction == 0 ? Math.sign(Math.random() - 0.5) : direction;
    let newY = y + radius * direction;
    return newY + ( direction == 1 ? this.config.labelFontSize : 0 );
  }

  calcLabelX(d) {
    const x = this.xScale(d.x(this.axisXType));
    const radius = this.radiusScale(Math.abs(d.radius(this.useSecondaryRadius)));
    let direction = Math.sign(d.voronoiPolygonCentroid[0] - x);
    direction = direction == 0 ? Math.sign(Math.random() - 0.5) : direction;
    return x + radius * direction;
  }

  private drawVoronoiPolygons( polygons: Array<VoronoiPolygon<[number, number]>> ){
    this.chart.selectAll(".polygons").remove();
    this.chart.append("g")
      .attr("class", "polygons")
      .selectAll("path")
      .data(polygons)
      .enter().append("path")
      .call( polygon =>
        polygon.attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; })
      );
  }

  private drawVoronoiPolygonCentroids(){
    this.chart.selectAll(".centroid").remove();
    this.chart.append("g")
      .attr("class", "centroid")
      .selectAll("circle")
      .data(this.chartData)
      .enter()
      .append("circle")
      .attr("cx", d => d.voronoiPolygonCentroid[0] )
      .attr("cy", d => d.voronoiPolygonCentroid[1] )
      .attr("r", 3 )
      .style("fill", "red" );
  }

  onAxisYTypeSelect(){
    this.updateChart();
  }

  /**
   * onCalculationRefresh in frontier distance aggregation produces NaN due to invalidated CtR values in User-defined Portfolio,
   * and somehow this action causes that all subsequent updateChart() calls, even with correct values, result in d3.transitions() still with those NaN values
   * if transitions are removed, everything is correct, maybe some d3 bug
   *
   * So with this method we practically cancel onCalculationRefresh updateChart()
   *
   * @returns {boolean}
   */
  private isChartDataValid(): boolean {
    for ( let datum of this.chartData){
      if ( ! ValueUtil.isNumber( datum.x(this.axisXType) )
        || ! ValueUtil.isNumber( datum.y(this.axisYType) )
        || ! ValueUtil.isNumber( datum.radius(this.useSecondaryRadius) ) ){
        return false;
      }
    }
    return true;
  }

  private getXAxis(){
    return d3.axisBottom(this.xScale).tickFormat(this.typeConfig.axisXFormat);
  }
  private getYAxis(){
    return d3.axisLeft(this.yScale).tickFormat(this.typeConfig.axisYFormat);
  }
  private getXAxisGrid(){
    return d3.axisBottom(this.xScale)
      .tickSize(-this.height)
      .tickFormat( d => "" );
  }
  private getYAxisGrid(){
    return d3.axisLeft(this.yScale)
      .tickSize(-this.width)
      .tickFormat( d => "" );
  }
  private getXDomain() {
    let maxDomain = d3.max(this.chartData, d => d.x(this.axisXType) ) as number;
    let minDomain = d3.min(this.chartData, d => d.x(this.axisXType) ) as number;

    if ( minDomain == 0 && maxDomain == 0 ){
      minDomain = -0.001;
      maxDomain = 0.001;
    }

    minDomain = Math.min( minDomain, 0);

    return [
      minDomain - this.getDomainMarginForRadius(maxDomain-minDomain, this.width),
      maxDomain + this.getDomainMarginForRadius(maxDomain-minDomain, this.width)
    ];
  }
  private getYDomain() {
    let maxDomain = d3.max(this.chartData, d => d.y(this.axisYType) ) as number;
    let minDomain = d3.min(this.chartData, d => d.y(this.axisYType) ) as number;

    if ( minDomain == 0 && maxDomain == 0 ){
      minDomain = -0.001;
      maxDomain = 0.001;
    }

    minDomain = Math.min( minDomain, 0);

    return [
      minDomain - this.getDomainMarginForRadius(maxDomain-minDomain, this.height),
      maxDomain + this.getDomainMarginForRadius(maxDomain-minDomain, this.height)
    ];
  }

  private getRadiusDomain() {
    return [0, d3.max(this.chartData, d => Math.abs( d.radius(this.useSecondaryRadius) ) ) as number ];
  }

  /**
   * This ensures for the chart plot area enough space to render circles with radius in different scale.
   *
   * Original scaling equation ( marginInDomain is unknown ):
   *
   *    maxDomain * ( maxRangeInPx / maxDomain + marginInDomain ) = maxRangeInPx - marginInPx
   *
   * @param domainRange
   * @returns {number} marginInDomain
   */
  private getDomainMarginForRadius(domainRange: number, chartRange: number ){
    return domainRange * ( chartRange / ( chartRange - this.config.maxRadius*2 ) - 1 );
  }
}
