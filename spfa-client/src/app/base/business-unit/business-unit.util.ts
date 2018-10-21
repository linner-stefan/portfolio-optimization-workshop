import {BusinessUnit, LegalEntity} from "./business-unit.model";
export class BusinessUnitUtil {

  static getLegalEntities(businessUnits: BusinessUnit[]) : LegalEntity[] {

    let legalEntities: LegalEntity[] = [];

    businessUnits.forEach(businessUnit => {

      businessUnit.legalEntities.forEach(legalEntity => {

        legalEntity.businessUnitId = businessUnit.id;
        legalEntities.push(legalEntity);

      });

    });

    return legalEntities;
  }
}
