/**
 * Created by Stefan Linner on 05/12/2017.
 */
export class GeneralUtil {

  /**
   * Enum in JavaScript
   * {
      0: "ServiceAdmin",
      1: "CompanyAdmin",
      2: "Foreman",
      ServiceAdmin: 0,
      CompanyAdmin: 1,
      Foreman: 2,
      }
   * @param enumType
   * @returns {string[]}
   */
  static getEnumStringKeys(enumType: any): string[]{
    const keys = Object.keys(enumType);
    return keys.slice(keys.length / 2);

  }
}
