import * as r4 from "fhir/r4";
import { FhirReferences } from "./fhirReferences";

export interface FhirMatch {
  bundle1Only: r4.Reference[];
  bundle2Only: r4.Reference[];
  common: FhirReferences[];
}
