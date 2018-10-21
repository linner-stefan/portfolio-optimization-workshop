/**
 * Created by Stefan Linner on 24/01/2018.
 */

/**
 * Input data point
 */
export class ChartForceDatum {

  id: number;

  // original data point
  x: number;
  y: number;
  radius: number;

  label: string;

  // fixed coordinates for force simulation
  fx: number;
  fy: number;
}

/**
 * Input data point with size, used for data point force repulsion purposes
 * Practically just a bounding box around each datum in data in size of the datum.radius
 */
export class ChartForceDatumRepulsion {

  // this fields are updated by a force simulation
  x: number;
  y: number;
  fx: number;
  fy: number;

  size: Size = new Size();

  constructor(
    private datum: ChartForceDatum
  ){
    this.updateFromDatum();
  }

  updateFromDatum(){
      this.x = this.datum.x - this.datum.radius;
      this.y = this.datum.y - this.datum.radius;
      this.fx = this.x;
      this.fy = this.y;
      this.size.width = this.datum.radius * 2;
      this.size.height = this.datum.radius * 2;
  }

  get id(): number{
    return this.datum.id;
  }
  get radius(): number{
    return this.datum.radius;
  }

  get label(): string {
    return this.datum.label;
  }

}

export class ChartForceLabel {

  // this fields are updated by a force simulation
  x: number;
  y: number;

  constructor(
    private datum: ChartForceDatum
  ) {
    this.updateFromDatum();
  }

  updateFromDatum(){
    this.x = this.datum.x - this.datum.radius;
    this.y = this.datum.y - this.datum.radius;
    // will be retrieved from the rendered SVG element
    // it's important to set this value before a force simulation is started
    this.size.width = undefined;
    this.size.height = undefined;
  }

  get id(): number{
    return this.datum.id;
  }
  get xDatum(): number{
    return this.datum.x;
  }
  get yDatum(): number{
    return this.datum.y;
  }
  get radius(): number{
    return this.datum.radius;
  }
  get text(): string{
    return this.datum.label;
  }

  size: Size = new Size();

}

export class ChartForceLink {

  constructor (
    public source: ChartForceDatum,
    public target: ChartForceLabel
  ){}

  get id(): number{
    return this.source.id;
  }
  get distance(): number{
    return this.source.radius;
  }

}

export class Size {
  width: number;
  height: number;
}
