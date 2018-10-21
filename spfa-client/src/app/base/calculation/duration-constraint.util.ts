import {DurationConstraint} from "../duration-constraint/duration-constraint.model";
export class DurationConstraintUtil {

  static flattenDurationConstraints( durationConstraints: DurationConstraint[] ) {

    const flat = [].concat(...durationConstraints);

    // durationConstraints.forEach(dc => {
    //
    //   if (dc.subConstraints) {
    //     flat.push(...this.flattenDurationConstraints( dc.subConstraints ) );
    //   }
    // });

    return flat;
  }
}
