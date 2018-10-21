import * as d3 from "d3";
import {Simulation} from "d3-force";
import {
  ChartForceDatum,
  ChartForceDatumRepulsion,
  ChartForceLabel,
  ChartForceLink
} from "@app/shared/charts/chart-force-labels/chart-force-labels.model";
import {GeometryUtil} from "@app/util/geometry.util";

/**
 * Handles chart label lifecycle. To prevent labels and data points overlap, it uses 4 types of forces
 * with 3 different force simulations due to different subject nodes. Data points can have variable radius size,
 * which results in a different data point force repulsion strength. Labels can be dragged with the collision
 * force enabled or disabled.
 *

 Sources:
 https://stackoverflow.com/questions/17425268/d3js-automatic-labels-placement-to-avoid-overlaps-force-repulsion
 https://stackoverflow.com/questions/33615789/d3-force-layout-text-label-overlapping

 http://www.puzzlr.org/force-graphs-with-d3/
 https://roshansanthosh.wordpress.com/2016/09/25/forces-in-d3-js-v4/

 https://bl.ocks.org/rsk2327/2ebd7f00d43b492e64eee14f35babeac
 https://bl.ocks.org/mbostock/1021953
 http://bl.ocks.org/pnavarrc/5913636

 https://bl.ocks.org/cmgiven/547658968d365bcc324f3e62e175709b
 https://jsfiddle.net/de41pqw3/2/

 http://bl.ocks.org/natebates/273b99ddf86e2e2e58ff

 https://stackoverflow.com/questions/28516551/d3-js-collision-detection-for-label-placement-at-fixed-distances
 http://bl.ocks.org/ilyabo/2585241

 D3 Dorling cartogram labels
 http://jsfiddle.net/s3logic/j789j3xt/

 http://coulmont.com/bac/nuage.html

 https://walkingtree.tech/d3-quadrant-chart-collision-in-angular2-application/

 https://bl.ocks.org/ColinEberhardt/389c76c6a544af9f0cab

 https://github.com/d3fc/d3fc-label-layout
 http://d3fc.github.io/d3fc-label-layout/

 https://github.com/tinker10/D3-Labeler
 http://tinker10.github.io/D3-Labeler/

 TODO:
 - initial label positions could be done with voronoi
 - when datum points are on the same place, repulsion from the datum takes probably only the last one of those datums, if it's not the largest, we have a problem
 - link target should be outside of label bounds, currently only as an intersection with circle with height/2 radius
 - repel should be rectangular, not just circular

 */
export class ChartForceLabels {

  private linkSelection: any;
  private labelSelection: any;

  private simulationLink: Simulation<any, any>;
  private simulationCollision: Simulation<any, any>;
  private simulationRepel: Simulation<any, any>;

  //noinspection JSMismatchedCollectionQueryUpdate
  private dataForLabelRepulsion: ChartForceDatumRepulsion[] = [];
  private labels: ChartForceLabel[] = [];
  private labelLinks: ChartForceLink[] = [];

  config = {
    // TODO: if we set this to false, bounding box force will repel labels which are close to edge
    // this is due to the fact, that in tick() and dragged() we take X and Y a move it to center of the box
    // but bounding box force takes that X and Y as the top left corner of the bounding box
    // practically we drag some item out of chart bounds X + size of label (but display it inside the bound)
    disableFutureForceOnDraggedElement: true,

    textBoundingBoxMargin: 5, //px
    parentGroupMargin: 0,   // px
    labelOffsetY: 7,     // px, makes the anchor point to be in the center
    boxForceMargin: 19  // px, theoretically should correspond to text height
  };


  constructor(
    private data: ChartForceDatum[],
    private dataForLabelRepulsionAdditional: ChartForceDatumRepulsion[],
    private labelsParentGroup: any,
    private width: number,
    private height: number,
    private useForceWhileDragging: boolean = false,
    private forceLinkStrength = 0.05
  ) {

    this.dataForLabelRepulsionAdditional =
      ! this.dataForLabelRepulsionAdditional ? [] : this.dataForLabelRepulsionAdditional;

  }

  update() {

    console.log('chartForceData',this.data);
    console.log('dataForLabelRepulsionAdditional',this.dataForLabelRepulsionAdditional);

    this.simulationStop();
    this.clear();
    this.updateData();

    this.labelSelection = this.labelsParentGroup.selectAll('.label').data(this.labels, d => d.id)
      .enter()
      .append("text")
      .attr('class','label')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('dy', this.config.labelOffsetY)
      .attr('text-anchor', 'middle')
      .text(d => d.text)
      .each((datum, index, elements) => {
        const boundingBox = (elements[index] as any).getBBox();
        datum.size.width = boundingBox.width + this.config.textBoundingBoxMargin;
        datum.size.height = boundingBox.height + this.config.textBoundingBoxMargin;
      })
      .call(d3.drag()
        .on("start", this.dragStarted)
        .on("drag", this.dragged)
        .on("end", this.dragEnded)
      );

    this.linkSelection = this.labelsParentGroup.selectAll("line")
      .data(this.labelLinks, d => d.id)
      .enter()
      .append("line");

    const labelsWithData: any[] = this.data.concat(this.labels as any);
    const labelsWithDataRepulsion: any[] = this.labels.concat(this.dataForLabelRepulsion as any);

    const linkForce = d3.forceLink(this.labelLinks)
      .id((d: any) => d.id)
      .distance(d => d.distance * 1.1 + 10)
      .strength( this.forceLinkStrength );

    const repelForce = d3.forceManyBody().strength(-50).distanceMax(200)
      .distanceMin(1);

    const collisionForce = (this.rectCollide() as any)
      .size(function (d) {
        return [d.size.width, d.size.height]
      })
      .strength(0.4);

    // chart area bounds
    const boxForce = (this.boundedBox() as any)
      .bounds([[0, 0], [this.width, this.height]])
      .size(function (d) {
        return [d.size.width, d.size.height]
      });

    this.simulationLink = d3.forceSimulation(labelsWithData)
      .velocityDecay(0.1)
      .alphaDecay(0.1)
      .force("link", linkForce);

    this.simulationCollision = d3.forceSimulation(labelsWithDataRepulsion)
      .velocityDecay(0.1)
      .alphaDecay(0.1)    // should affect only the speed of the simulation, not the result
      .force("collision", collisionForce)
      .force("box", boxForce);

    this.simulationRepel = d3.forceSimulation(this.labels)
      .velocityDecay(0.1)
      .alphaDecay(0.1)
      .force("repel", repelForce);

    // theoretically doesn't matter on which simulation is bound
    this.simulationCollision.on('tick', this.tick);

  }

  private updateData() {
    this.data.forEach(datum => {

      datum.fx = datum.x;
      datum.fy = datum.y;

      this.dataForLabelRepulsion.push(new ChartForceDatumRepulsion(datum));

      const label = new ChartForceLabel(datum);
      this.labels.push(label);

      this.labelLinks.push(new ChartForceLink(datum, label));

    });
  }

  private clear() {
    this.dataForLabelRepulsion = this.dataForLabelRepulsionAdditional;
    this.labels = [];
    this.labelLinks = [];

    if (this.labelSelection)
      this.labelSelection.remove();
    if (this.linkSelection)
      this.linkSelection.remove();
  }

  public remove(){

    this.simulationLink.force("link", null);
    this.simulationCollision.force("box", null);
    this.simulationRepel.force("repel", null);

    this.simulationStop();

    this.labelsParentGroup.selectAll().remove();
  }

  private simulationStop(){
    this.simulationLink && this.simulationLink.stop();
    this.simulationCollision && this.simulationCollision.stop();
    this.simulationRepel && this.simulationRepel.stop();
  }

  tick = () => {
    //console.log(simulationLink.alpha());

    const marginX = this.config.parentGroupMargin;
    const marginY = this.config.parentGroupMargin;
    const labelOffsetY = this.config.labelOffsetY;

    this.labelSelection
      .attr("x", d => Math.max(Math.min(this.width - marginX - d.size.width/2, d.x + d.size.width/2), marginX + d.size.width/2))
      .attr("y", d => Math.max(Math.min(this.height - marginY - d.size.height/2, d.y + d.size.height/2), marginY - labelOffsetY + d.size.height/2));

    const xTarget = d => Math.max(Math.min(this.width - marginX - d.target.size.width/2, d.target.x + d.target.size.width/2), marginX + d.target.size.width/2);
    const yTarget = d => Math.max(Math.min(this.height - marginY - d.target.size.height/2, d.target.y + d.target.size.height/2), marginY - labelOffsetY  + d.target.size.height/2);

    this.linkSelection.attr("x1", d =>
      this.getLinkSourceOnCirclePerimeter([d.source.x, d.source.y], [xTarget(d), yTarget(d)], d.distance)[0])
      .attr("y1", d =>
        this.getLinkSourceOnCirclePerimeter([d.source.x, d.source.y], [xTarget(d), yTarget(d)], d.distance)[1])
      .attr("x2", d => this.getLinkSourceOnCirclePerimeter([xTarget(d), yTarget(d)], [d.source.x, d.source.y], d.target.size.height / 2)[0])
      .attr("y2", d => this.getLinkSourceOnCirclePerimeter([xTarget(d), yTarget(d)], [d.source.x, d.source.y], d.target.size.height / 2)[1]);

  };

  dragStarted = () => {

    this.simulationStop();

    if ( this.useForceWhileDragging) {
      // we allow only the collision force, without data points repulsion
      this.simulationLink.force('link', null);
      this.simulationRepel.force('repel', null);

      this.simulationCollision.nodes( this.labels );
    }
  };

  /**
   * counter-interacts with tick() when 'useForceWhileDragging' is turn on
   *
   * @param datum
   * @param index
   * @param elements
   */
  dragged = (datum, index, elements) => {

    if (this.useForceWhileDragging) {
      this.simulationCollision.restart();
      this.simulationCollision.alpha(0.9);
    }

    const marginX = this.config.parentGroupMargin;
    const marginY = this.config.parentGroupMargin;
    const labelOffsetY = this.config.labelOffsetY;

    // same logic as in tick()
    const draggedX = Math.max(Math.min(d3.event.x + datum.size.width/2, this.width - datum.size.width/2 - marginX), marginX + datum.size.width/2);		// text-anchor is middle
    const draggedY = Math.max(Math.min(d3.event.y + datum.size.height/2, this.height - datum.size.height/2 - marginY ), marginY - labelOffsetY + datum.size.height/2);			// text-anchor is middle

    // for subsequent drag starts
    if ( ! this.useForceWhileDragging ) {
      datum.x = d3.event.x;
      datum.y = d3.event.y;

      d3.select(elements[index])
        .attr("x", draggedX )
        .attr("y", draggedY );
    }
    else {
      datum.fx = Math.max(Math.min(d3.event.x, this.width - marginX), marginX);
      datum.fy = Math.max(Math.min(d3.event.y, this.height - marginY ), marginY - labelOffsetY);
    }

    // source coordinates need to be adjusted based on data point radius
    const x1 = datum.xDatum;	// could be retrieved also from the link source
    const y1 = datum.yDatum;	// could be retrieved also from the link source
    const x2 = draggedX;
    const y2 = draggedY;
    const radius = datum.radius;

    const sourceAdjusted = this.getLinkSourceOnCirclePerimeter([x1, y1], [x2, y2], radius);

    d3.select(this.linkSelection.nodes()[index])
      .attr("x1", sourceAdjusted[0])
      .attr("y1", sourceAdjusted[1])
      .attr("x2", x2)
      .attr("y2", y2);

  };

  //noinspection JSMethodCanBeStatic
  dragEnded = (datum) => {
    if ( ! this.config.disableFutureForceOnDraggedElement ) {
      datum.fx = undefined;
      datum.fy = undefined;
    }

    this.simulationStop();
  };


  //noinspection JSMethodCanBeStatic
  getLinkSourceOnCirclePerimeter(source, target, radius) {
    const intersections: any = GeometryUtil.getIntersections(source, target, [source[0], source[1], radius]).points;
    if (!intersections.intersection1 || !intersections.intersection2) {
      return source;
    }
    const intersection1 = intersections.intersection1.coords;
    const intersection2 = intersections.intersection2.coords;

    // choose the intersection closer to the label (closer to x2,y2)
    const intersection1dist = GeometryUtil.distance(intersection1, target);
    const intersection2dist = GeometryUtil.distance(intersection2, target);
    const closerIntersection = intersection1dist < intersection2dist ? intersection1 : intersection2;

    const x1_adjusted = closerIntersection[0];
    const y1_adjusted = closerIntersection[1];
    return [x1_adjusted, y1_adjusted];
  }

  rectCollide = function rectCollide() {
    let nodes, sizes, masses;
    //noinspection JSUnusedLocalSymbols
    let size = this.constant([0, 0]);
    let strength = 1;
    let iterations = 1;

    function force() {
      let node, size, mass, xi, yi;
      let i = -1;
      while (++i < iterations) {
        iterate()
      }

      function iterate() {
        let j = -1;
        const tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare);

        while (++j < nodes.length) {
          node = nodes[j];
          size = sizes[j];
          mass = masses[j];
          xi = xCenter(node);
          yi = yCenter(node);

          tree.visit(apply);
        }
      }

      function apply(quad, x0, y0, x1, y1) {
        const data = quad.data;
        const xSize = (size[0] + quad.size[0]) / 2;
        const ySize = (size[1] + quad.size[1]) / 2;
        if (data) {
          if (data.index <= node.index) {
            return;
          }

          let x = xi - xCenter(data);
          let y = yi - yCenter(data);
          const xd = Math.abs(x) - xSize;
          //noinspection JSSuspiciousNameCombination
          const yd = Math.abs(y) - ySize;

          if (xd < 0 && yd < 0) {
            const l = Math.sqrt(x * x + y * y);
            const m = masses[data.index] / (mass + masses[data.index]);

            if (Math.abs(xd) < Math.abs(yd)) {
              node.vx -= (x *= xd / l * strength) * m;
              data.vx += x * (1 - m)
            } else {
              node.vy -= (y *= yd / l * strength) * m;
              data.vy += y * (1 - m)
            }
          }
        }

        return x0 > xi + xSize || y0 > yi + ySize ||
          x1 < xi - xSize || y1 < yi - ySize;
      }

      function prepare(quad) {
        if (quad.data) {
          quad.size = sizes[quad.data.index];
        } else {
          quad.size = [0, 0];
          let i = -1;
          while (++i < 4) {
            if (quad[i] && quad[i].size) {
              quad.size[0] = Math.max(quad.size[0], quad[i].size[0]);
              quad.size[1] = Math.max(quad.size[1], quad[i].size[1]);
            }
          }
        }
      }
    }

    function xCenter(d) {
      return d.x + d.vx + sizes[d.index][0] / 2;
    }

    function yCenter(d) {
      return d.y + d.vy + sizes[d.index][1] / 2;
    }

    (force as any).initialize = function (_) {
      sizes = (nodes = _).map(size);
      masses = sizes.map(function (d) {
        return d[0] * d[1];
      })
    };

    (force as any).size = function (_) {
      if (arguments.length) {
        //noinspection JSPotentiallyInvalidUsageOfThis
        size = typeof _ === 'function' ? _ : this.constant(_);
        return force;
      }
      return size;
    };

    (force as any).strength = function (_) {
      if (arguments.length) {
        strength = +_;
        return force;
      }
      return strength;
    };

    (force as any).iterations = function (_) {
      if (arguments.length) {
        iterations = +_;
        return force;
      }
      return iterations;
    };

    return force;

  };

  boundedBox = function boundedBox() {
    let nodes, sizes;
    let bounds;
    let size = this.constant([0, 0]);

    function force() {
      let node, size;
      let xi, x0, x1, yi, y0, y1;
      let i = -1;
      while (++i < nodes.length) {
        node = nodes[i];
        size = sizes[i];
        xi = node.x + node.vx;
        x0 = bounds[0][0] - xi;
        x1 = bounds[1][0] - (xi + size[0]);
        yi = node.y + node.vy;
        y0 = bounds[0][1] - yi;
        y1 = bounds[1][1] - (yi + size[1]);
        if (x0 > 0 || x1 < 0) {
          node.x += node.vx;
          node.vx = -node.vx;
          if (node.vx < x0) {
            node.x += x0 - node.vx;
          }
          if (node.vx > x1) {
            node.x += x1 - node.vx;
          }
        }
        if (y0 > 0 || y1 < 0) {
          node.y += node.vy;
          node.vy = -node.vy;
          if (node.vy < y0) {
            node.vy += y0 - node.vy
          }
          if (node.vy > y1) {
            node.vy += y1 - node.vy
          }
        }
      }
    }

    (force as any).initialize = function (_) {
      sizes = (nodes = _).map(size)
    };

    (force as any).bounds = function (_) {
      if ( arguments.length ){
        bounds = _;
        return force;
      }
      return bounds;
    };

    (force as any).size = function (_) {
      if ( arguments.length ){
        //noinspection JSPotentiallyInvalidUsageOfThis
        size = typeof _ === 'function' ? _ : this.constant(_);
        return force;
      }
      return size;
    };

    return force;
  };

  constant = function constant(_) {
    return function () {
      return _
    }
  };


}
