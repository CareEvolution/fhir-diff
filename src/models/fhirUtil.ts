import type {
  Coding,
  Reference,
  CodeableConcept,
  Identifier,
  Resource,
} from 'fhir/r4';
import wellKnownUrls from '../../data/wellKnownUrls';
import { ResourceAndKey } from './resourceAndKey';

export function buildRef(resource: Resource): string {
  return `${resource.resourceType}/${resource.id}`;
}

export function buildReference(resource: ResourceAndKey): Reference {
  return {
    reference: buildRef(resource.resource),
  };
}

export function pickIdentifier(identifier?: Identifier[]): string | undefined {
  if (!identifier || identifier.length === 0) {
    return undefined;
  }

  return (
    identifier.find((i) => i.use === 'usual')?.value ||
    identifier.find((i) => i.use === 'official')?.value ||
    identifier[0].value
  );
}

const rosettaInputCodeSystemRE =
  /http:\/\/rosetta\.careevolution\.com\/codes\/Proprietary.([a-zA-Z0-9._-]+)(\/\w+)?/;
const rosettaInputCodeSystem2RE =
  /http:\/\/rosetta\.careevolution\.com\/codes\/([a-zA-Z0-9._-]+)(\/\w+)?/;
const fhirCodesystemRE = /http:\/\/careevolution\.com\/fhircodes#(\w+)/;
const oidRE = /urn:oid:(.*)/; // not all things in CDAs that should be OIDs are OIDs, and naive template-based things won't be able to tell it's not an OID
const fakeFhirUrlRE = /http:\/\/terminology\.hl7\.org\/CodeSystem\/(.*)/; // MS makes up terminology.hl7.org urls for custom stuff in CDAs

export function cleanCodeSystem(
  coding: Coding | undefined,
): Coding | undefined {
  if (!coding?.system) {
    return coding;
  }

  if (wellKnownUrls.has(coding.system)) {
    return coding;
  }

  const cleanedCoding = { ...coding };
  const rosettaMatch = coding.system.match(rosettaInputCodeSystemRE);
  if (rosettaMatch) {
    cleanedCoding.system = rosettaMatch[1];
  } else {
    const rosetta2Match = coding.system.match(rosettaInputCodeSystem2RE);
    if (rosetta2Match) {
      cleanedCoding.system = rosetta2Match[1];
    } else {
      const fhirMatch = coding.system.match(fhirCodesystemRE);
      if (fhirMatch) {
        cleanedCoding.system = fhirMatch[1];
      } else {
        const oidMAtch = coding.system.match(oidRE);
        if (oidMAtch) {
          cleanedCoding.system = oidMAtch[1];
        } else {
          const fakeFhirUrlMatch = coding.system.match(fakeFhirUrlRE);
          if (fakeFhirUrlMatch) {
            cleanedCoding.system = fakeFhirUrlMatch[1];
          }
        }
      }
    }
  }

  return cleanedCoding;
}

// we want to be able to match things like ICD9/10 and NDC codes that may or may not have consistent formatting
export function cleanCode(coding: Coding | undefined): string | undefined {
  if (!coding?.code) {
    return undefined;
  }

  return coding.code.replace(/\s\.-]/g, '');
}

export function pickPrimaryCoding(
  codeableConcept: CodeableConcept | undefined,
  preferredSystems: string[],
): Coding | undefined {
  if (!codeableConcept?.coding) {
    return undefined;
  }

  const userSelected = codeableConcept.coding.find(
    (c) => c.userSelected === true,
  );

  if (userSelected) {
    return cleanCodeSystem(userSelected);
  }

  const preferredSystem = codeableConcept.coding.find(
    (c) => c.system && preferredSystems.includes(c.system),
  );

  if (preferredSystem) {
    return cleanCodeSystem(preferredSystem);
  }

  return cleanCodeSystem(codeableConcept.coding[0]);
}

export function pickPrimaryCodingFromMultiple(
  codeableConcepts: CodeableConcept[] | undefined,
  preferredSystems: string[],
): Coding | undefined {
  if (!codeableConcepts || codeableConcepts.length === 0) {
    return undefined;
  }

  return codeableConcepts.find((cc) => pickPrimaryCoding(cc, preferredSystems));
}
