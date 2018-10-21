export class MahalanobisChartData {
  ellipse: number[][][] = [[[]]];
  equilibrium: Point2D[] = [new Point2D()];
  investmentStrategy: MahalanobisIsChartDatum[] = [];
  userDefined: Point2D[] = [new Point2D()];
}

export class MahalanobisIsChartDatum {
  title: string;
  point: Point2D;
}

export class Point2D {
  constructor(public x: number = null,
             public y: number = null){
  }
}
