/**
 * https://bl.ocks.org/milkbread/11000965
 */
export class GeometryUtil {

  /**
   * Return y coordinate given by the line equation from two points [x1,y1] and [x2,y2] and input x coordinate.
   *
   * y − y1 = slope(x −x1)
   *
   * @param x
   * @param x1
   * @param y1
   * @param x2
   * @param y2
   * @returns {number}
   */
  public static getIntersectionY(x:number, x1:number, y1:number, x2:number, y2:number ):number {
    let slope = (y2 - y1) / (x2 - x1);
    return slope * (x - x1) + y1;
  }

  // GEOMETRIC function to get the intersections
  static getIntersections(a, b, c) {
    // Calculate the euclidean distance between a & b
    const eDistAtoB = Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));

    // compute the direction vector d from a to b
    const d = [(b[0] - a[0]) / eDistAtoB, (b[1] - a[1]) / eDistAtoB];

    // Now the line equation is x = dx*t + ax, y = dy*t + ay with 0 <= t <= 1.

    // compute the value t of the closest point to the circle center (cx, cy)
    const t = (d[0] * (c[0] - a[0])) + (d[1] * (c[1] - a[1]));

    // compute the coordinates of the point e on line and closest to c
    const e = {coords: [], onLine: false};
    e.coords[0] = (t * d[0]) + a[0];
    e.coords[1] = (t * d[1]) + a[1];

    // Calculate the euclidean distance between c & e
    const eDistCtoE = Math.sqrt(Math.pow(e.coords[0] - c[0], 2) + Math.pow(e.coords[1] - c[1], 2));

    // test if the line intersects the circle
    if (eDistCtoE < c[2]) {
      // compute distance from t to circle intersection point
      const dt = Math.sqrt(Math.pow(c[2], 2) - Math.pow(eDistCtoE, 2));

      // compute first intersection point
      const f = {coords: [], onLine: false};
      f.coords[0] = ((t - dt) * d[0]) + a[0];
      f.coords[1] = ((t - dt) * d[1]) + a[1];
      // check if f lies on the line
      f.onLine = GeometryUtil.is_on(a, b, f.coords);

      // compute second intersection point
      const g = {coords: [], onLine: false};
      g.coords[0] = ((t + dt) * d[0]) + a[0];
      g.coords[1] = ((t + dt) * d[1]) + a[1];
      // check if g lies on the line
      g.onLine = GeometryUtil.is_on(a, b, g.coords);

      return {points: {intersection1: f, intersection2: g}, pointOnLine: e};

    } else if (eDistCtoE === parseInt(c[2])) {
      // console.log("Only one intersection");
      return {points: false, pointOnLine: e};
    } else {
      // console.log("No intersection");
      return {points: false, pointOnLine: e};
    }
  }

  // BASIC GEOMETRIC functions
  static distance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
  }

  static is_on(a, b, c) {
    return GeometryUtil.distance(a, c) + GeometryUtil.distance(c, b) == GeometryUtil.distance(a, b);
  }

  static getAngles(a, b, c) {
    // calculate the angle between ab and ac
    const angleAB = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const angleAC = Math.atan2(c[1] - a[1], c[0] - a[0]);
    const angleBC = Math.atan2(b[1] - c[1], b[0] - c[0]);
    const angleA = Math.abs((angleAB - angleAC) * (180 / Math.PI));
    const angleB = Math.abs((angleAB - angleBC) * (180 / Math.PI));
    return [angleA, angleB];
  }
}
