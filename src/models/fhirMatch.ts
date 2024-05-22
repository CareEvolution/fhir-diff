import { Reference } from 'fhir/r4';
import { FhirReferences } from './fhirReferences';
import { KeyStore } from './keyStore';

export interface FhirMatch {
  bundle1Only: Reference[];
  bundle2Only: Reference[];
  common: FhirReferences[];
  bundle1Store: KeyStore;
  bundle2Store: KeyStore;
}
