import { ResourceAndKey } from "../models/resourceAndKey";
import { FhirReferences } from "../models/fhirReferences";

export interface MatchResult {
  unmatched1: ResourceAndKey[];
  unmatched2: ResourceAndKey[];
  matched: FhirReferences[];
}

export type Matcher = (
  bundle1: ResourceAndKey[],
  bundle2: ResourceAndKey[],
) => MatchResult;
