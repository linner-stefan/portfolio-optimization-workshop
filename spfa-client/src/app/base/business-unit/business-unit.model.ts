export class BusinessUnit {

  id: number;
  name: string;
  legalEntities: LegalEntity[];
}

export class LegalEntity {

  id: number;
  accountUnit: string;
  name: string;

  businessUnitId: number;
}
