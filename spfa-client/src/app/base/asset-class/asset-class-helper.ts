import {AssetClassGroup} from "./asset-class.model";
export class AcHelper {
  static hasSubClasses(acg: AssetClassGroup):boolean{

    let hasSubClasses = Array.isArray( acg.subClasses ) && !! acg.subClasses.length;

    if ( ! hasSubClasses && ! acg.assetClass ){
      console.error("Leaf asset class group must contain asset class object!", acg);
    }

    return hasSubClasses;
  }

}
