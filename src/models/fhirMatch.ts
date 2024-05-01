import { Reference } from "fhir/r4";
import { FhirReferences } from "./fhirReferences";

export interface FhirMatch {
  bundle1Only: Reference[];
  bundle2Only: Reference[];
  common: FhirReferences[];
}
