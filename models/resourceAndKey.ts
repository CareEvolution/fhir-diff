import * as r4 from "fhir/r4";

export interface ResourceAndKey {
  resource: r4.Resource;
  resourceType: string;
  identifier?: string;
  primaryCodeSystem?: string;
  primaryCode?: string;
  dateTime?: string;
  date?: string;
  text?: string;
  value?: string;
}
