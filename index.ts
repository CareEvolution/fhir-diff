import * as r4 from "fhir/r4";
import { FhirMatch } from "./models/fhir_match";
import { ResourceAndKey } from "./models/resource_and_key";

const medicationResourceTypes = [
  "MedicationRequest",
  "MedicationStatement",
  "MedicationAdministration",
];

const labResourceTypes = ["Observation", "DiagnosticReport"];

function pick_identifier(identifier?: r4.Identifier[]): string | undefined {
  if (!identifier || identifier.length === 0) {
    return undefined;
  }

  return (
    identifier.find((i) => i.use === "usual")?.value ||
    identifier.find((i) => i.use === "official")?.value ||
    identifier[0].value
  );
}

const rosettaInputCodeSystemRE =
  /http:\/\/rosetta\.careevolution\.com\/codes\/Proprietary.([a-zA-Z0-9._-]+)(\/\w+)?/;
const rosettaInputCodeSystem2RE =
  /http:\/\/rosetta\.careevolution\.com\/codes\/([a-zA-Z0-9._-]+)(\/\w+)?/;
const fhirCodesystemRE = /http:\/\/careevolution\.com\/fhircodes#(\w+)/;
const oidRE = /urn:oid:(.*)/;   // not all things in CDAs that should be OIDs are OIDs, and naive template-based things won't be able to tell it's not an OID

export function clean_code_system(
  coding: r4.Coding | undefined
): r4.Coding | undefined {
  if (!coding?.system) {
    return coding;
  }

  const rosettaMatch = coding.system.match(rosettaInputCodeSystemRE);
  if (rosettaMatch) {
    coding.system = rosettaMatch[1];
  } else {
    const rosetta2Match = coding.system.match(rosettaInputCodeSystem2RE);
    if (rosetta2Match) {
      coding.system = rosetta2Match[1];
    } else {
      const fhirMatch = coding.system.match(fhirCodesystemRE);
      if (fhirMatch) {
        coding.system = fhirMatch[1];
      } else {
        const oidMAtch = coding.system.match(oidRE);
        if (oidMAtch) {
          coding.system = oidMAtch[1];
        }
      }
    }
  }

  return coding;
}

function pick_primary_coding(
  codeableConcept: r4.CodeableConcept | undefined,
  preferredSystems: string[]
): r4.Coding | undefined {
  if (!codeableConcept?.coding) {
    return undefined;
  }

  const userSelected = codeableConcept.coding?.find((c) => c.userSelected);

  if (userSelected) {
    return clean_code_system(userSelected);
  }

  const preferredSystem = codeableConcept.coding?.find((c) =>
    preferredSystems.includes(c.system!)
  );

  if (preferredSystem) {
    return clean_code_system(preferredSystem);
  }

  return clean_code_system(codeableConcept.coding?.[0]);
}

function clean_text(text: string | undefined): string | undefined {
  if (!text) return text;

  return text.replace(/\s+/g, " ").toLowerCase();
}

class KeyStore {
  public all: ResourceAndKey[] = [];
  public byFhirRef: Map<string, ResourceAndKey> = new Map();
  public byFullUrl: Map<string, ResourceAndKey> = new Map();

  public push(entry: r4.BundleEntry, key: ResourceAndKey) {
    this.all.push(key);
    this.byFhirRef.set(build_ref(key.resource), key);
    if (entry.fullUrl) {
      this.byFullUrl.set(entry.fullUrl, key);
    }
  }
}

function build_keys(bundle: r4.Bundle): KeyStore {
  const keys = new KeyStore();

  for (let entry of bundle.entry || []) {
    if (!entry?.resource?.resourceType) {
      continue;
    }
    switch (entry.resource.resourceType) {
      case "Patient":
        keys.push(entry, {
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
        });
        break;
      case "Encounter":
        const primary_coding = entry.resource.class;
        keys.push(entry, {
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding?.system,
          primary_code: primary_coding?.code,
          date: entry.resource.period?.start,
        });
        break;
      case "Condition":
        const primary_coding_condition = pick_primary_coding(
          entry.resource.code,
          ["http://snomed.info/sct", "http://www.icd10data.com/icd10pcs"]
        );
        keys.push(entry, {
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_condition?.system,
          primary_code: primary_coding_condition?.code,
          date: entry.resource.onsetDateTime,
          text: clean_text(entry.resource.code?.text),
        });
        break;

      case "MedicationAdministration":
        const primary_coding_medadmin = pick_primary_coding(
          entry.resource.medicationCodeableConcept,
          ["http://www.nlm.nih.gov/research/umls/rxnorm"]
        );
        keys.push(entry, {
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_medadmin?.system,
          primary_code: primary_coding_medadmin?.code,
          date: entry.resource.effectiveDateTime,
          text: clean_text(entry.resource.medicationCodeableConcept?.text),
        });
        break;

      case "MedicationRequest":
        const primary_coding_medreq = pick_primary_coding(
          entry.resource.medicationCodeableConcept,
          ["http://www.nlm.nih.gov/research/umls/rxnorm"]
        );
        keys.push(entry, {
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_medreq?.system,
          primary_code: primary_coding_medreq?.code,
          date: entry.resource.authoredOn,
          text: clean_text(entry.resource.medicationCodeableConcept?.text),
        });
        break;

      case "MedicationStatement":
        const primary_coding_medstate = pick_primary_coding(
          entry.resource.medicationCodeableConcept,
          ["http://www.nlm.nih.gov/research/umls/rxnorm"]
        );
        keys.push(entry, {
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_medstate?.system,
          primary_code: primary_coding_medstate?.code,
          date:
            entry.resource.effectiveDateTime ||
            entry.resource.effectivePeriod?.start,
          text: clean_text(entry.resource.medicationCodeableConcept?.text),
        });
        break;

      case "Procedure":
        const primary_coding_procedure = pick_primary_coding(
          entry.resource.code,
          ["http://snomed.info/sct", "http://www.icd10data.com/icd10pcs"]
        );
        keys.push(entry, {
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_procedure?.system,
          primary_code: primary_coding_procedure?.code,
          date:
            entry.resource.performedDateTime ||
            entry.resource.performedPeriod?.start,
          text: clean_text(entry.resource.code?.text),
        });
        break;

      case "AllergyIntolerance":
        const primary_coding_allergy = pick_primary_coding(
          entry.resource.code,
          ["http://snomed.info/sct"]
        );
        keys.push(entry, {
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_allergy?.system,
          primary_code: primary_coding_allergy?.code,
          date: entry.resource.onsetDateTime || entry.resource.recordedDate,
          text: clean_text(entry.resource.code?.text),
        });
        break;

      case "Observation":
        const primary_coding_observation = pick_primary_coding(
          entry.resource.code,
          ["http://loinc.org", "http://snomed.info/sct"]
        );

        let value: string | undefined;

        if (entry.resource.valueString) {
          value = entry.resource.valueString;
        } else if (entry.resource.valueQuantity?.value) {
          if (entry.resource.valueQuantity.unit) {
            value = `${entry.resource.valueQuantity.value} ${entry.resource.valueQuantity.unit}`;
          } else {
            value = entry.resource.valueQuantity.value?.toString();
          }
        } else if (entry.resource.valueInteger) {
          value = entry.resource.valueInteger.toString();
        } else if (entry.resource.valueCodeableConcept?.text) {
          value = entry.resource.valueCodeableConcept.text;
        }

        keys.push(entry, {
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_observation?.system,
          primary_code: primary_coding_observation?.code,
          date: entry.resource.effectiveDateTime,
          text: clean_text(entry.resource.code?.text),
          value: value,
        });
        break;

      case "DiagnosticReport":
        const primary_coding_diagnostic_report = pick_primary_coding(
          entry.resource.code,
          ["http://loinc.org", "http://snomed.info/sct"]
        );

        keys.push(entry, {
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_diagnostic_report?.system,
          primary_code: primary_coding_diagnostic_report?.code,
          date:
            entry.resource.effectiveDateTime ||
            entry.resource.effectivePeriod?.start,
          text: clean_text(entry.resource.code?.text),
        });
        break;

      case "Practitioner":
        keys.push(entry, {
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
        });
        break;

      case "PractitionerRole":
        keys.push(entry, {
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
        });
        break;

      case "Organization":
        keys.push(entry, {
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
        });
        break;

      case "OperationOutcome":
      case "Composition":
        break;

      default:
        console.log("Unhandled resource type: " + entry.resource.resourceType);
        break;
    }
  }

  // back fill dates for resources that have children

  for (let key of keys.all.filter((k) => !k.date)) {
    switch (key.resource.resourceType) {
      case "Observation":
        const observation = key.resource as r4.Observation;
        if (observation.encounter?.reference) {
          const encounterKey = keys.byFhirRef.get(
            observation.encounter.reference
          );
          if (encounterKey && encounterKey.date) {
            key.date = encounterKey.date;
          }
        }

        if (
          !key.date &&
          observation.hasMember &&
          observation.hasMember.length > 0
        ) {
          const memberDates: string[] = [];

          for (let member of observation.hasMember) {
            if (member.reference) {
              const memberKey =
                keys.byFhirRef.get(member.reference) ||
                keys.byFullUrl.get(member.reference);
              if (memberKey && memberKey.date) {
                memberDates.push(memberKey.date);
              }
            }
          }

          const disitinctDates = new Set(memberDates);
          if (disitinctDates.size === 1) {
            key.date = disitinctDates.values().next().value;
          }
        }
    }
  }

  return keys;
}

function build_ref(resource: r4.Resource): string {
  return `${resource.resourceType}/${resource.id}`;
}

function build_reference(resource: ResourceAndKey): r4.Reference {
  return {
    reference: build_ref(resource.resource),
  };
}

function find_match_index(
  target: ResourceAndKey,
  candidates: ResourceAndKey[]
): number {
  const byIdentifier = candidates.findIndex(
    (k) =>
      k.resourceType === target.resourceType &&
      k.identifier === target.identifier
  );

  if (byIdentifier !== -1) {
    console.log(
      `Matched ${build_ref(target.resource)} <=> ${build_ref(
        candidates[byIdentifier].resource
      )} by identifier ${target.identifier}`
    );
    return byIdentifier;
  }

  if (target.date || target.primary_code_system || target.primary_code) {
    const byNaturalKey = candidates.findIndex(
      (k) =>
        k.resourceType === target.resourceType &&
        k.primary_code_system === target.primary_code_system &&
        k.primary_code === target.primary_code &&
        k.date === target.date
    );

    if (byNaturalKey !== -1) {
      console.log(
        `Matched ${build_ref(target.resource)} <=> ${build_ref(
          candidates[byNaturalKey].resource
        )} by natural key ${target.primary_code_system} ${
          target.primary_code
        } ${target.date}`
      );
      return byNaturalKey;
    }
  }

  return -1;
}

function find_match_index_squishy(
  target: ResourceAndKey,
  candidates: ResourceAndKey[]
): number {
  if (target.primary_code && target.primary_code_system) {
    const byCode = candidates.findIndex(
      (k) =>
        k.resourceType === target.resourceType &&
        k.primary_code_system === target.primary_code_system &&
        k.primary_code === target.primary_code
    );

    if (byCode !== -1) {
      console.log(
        `Matched ${build_ref(target.resource)} <=> ${build_ref(
          candidates[byCode].resource
        )} by code ${target.primary_code_system} ${target.primary_code}`
      );
      return byCode;
    }
  }

  if (target.text) {
    const byText = candidates.findIndex(
      (k) =>
        k.resourceType === target.resourceType &&
        k.text === target.text &&
        k.date === target.date
    );

    if (byText !== -1) {
      console.log(
        `Matched ${build_ref(target.resource)} <=> ${build_ref(
          candidates[byText].resource
        )} by text ${target.text?.substring(0, 50)} and date ${target.date}`
      );
      return byText;
    }
  }

  if (target.value) {
    const byValue = candidates.findIndex(
      (k) =>
        k.resourceType === target.resourceType &&
        k.date === target.date &&
        k.value === target.value
    );

    if (byValue !== -1) {
      console.log(
        `Matched ${build_ref(target.resource)} <=> ${build_ref(
          candidates[byValue].resource
        )} by value ${target.value} and date ${target.date}`
      );

      return byValue;
    }
  }

  return -1;
}

function find_match_index_cross_resource(
  target: ResourceAndKey,
  candidates: ResourceAndKey[],
  resourceTypes: string[]
): number {
  if (!resourceTypes.includes(target.resourceType)) {
    return -1;
  }

  if (target.primary_code && target.primary_code_system) {
    const byCode = candidates.findIndex(
      (k) =>
        resourceTypes.includes(k.resourceType) &&
        k.resourceType === target.resourceType &&
        k.primary_code_system === target.primary_code_system &&
        k.primary_code === target.primary_code
    );

    if (byCode !== -1) {
      console.log(
        `Matched ${build_ref(target.resource)} <=> ${build_ref(
          candidates[byCode].resource
        )} by code ${target.primary_code_system} ${target.primary_code}`
      );
      return byCode;
    }
  }

  if (target.text) {
    const byText = candidates.findIndex(
      (k) =>
        resourceTypes.includes(k.resourceType) &&
        k.text === target.text &&
        k.date === target.date
    );

    if (byText !== -1) {
      console.log(
        `Matched ${build_ref(target.resource)} <=> ${build_ref(
          candidates[byText].resource
        )} by text ${target.text?.substring(0, 50)} and date ${target.date}`
      );
      return byText;
    }
  }

  if (
    target.resourceType === "Observation" ||
    target.resourceType === "DiagnosticReport"
  ) {
    console.log(
      `target: ${build_ref(target.resource)} ${target.identifier} ${
        target.primary_code_system
      }/${target.primary_code} ${target.date} ${target.text?.substring(0, 50)}`
    );
  }

  return -1;
}

function get_resource_type_group(resourceType: string): string[] | undefined {
  if (medicationResourceTypes.includes(resourceType)) {
    return medicationResourceTypes;
  }
  if (labResourceTypes.includes(resourceType)) {
    return labResourceTypes;
  }
  return undefined;
}

export function fhir_bundles_match(
  bundle1: r4.Bundle,
  bundle2: r4.Bundle
): FhirMatch {
  console.log("--- bundle1 ---");
  var bundle1KeyStore = build_keys(bundle1);

  console.log("--- bundle2 ---");
  var bundle2KeyStore = build_keys(bundle2);

  console.log("--- matching ---");

  const bundle1Only: ResourceAndKey[] = [];
  const bundle2Only: ResourceAndKey[] = [];
  const common: { bundle1: ResourceAndKey; bundle2: ResourceAndKey }[] = [];

  const unmatchedBundle1: ResourceAndKey[] = [];

  const bundle1Keys = [...bundle1KeyStore.all];
  const bundle2Keys = [...bundle2KeyStore.all];

  // try strong matches first
  for (let bundle1Key of bundle1Keys) {
    const matchIndex = find_match_index(bundle1Key, bundle2Keys);
    if (matchIndex === -1) {
      unmatchedBundle1.push(bundle1Key);
    } else {
      common.push({ bundle1: bundle1Key, bundle2: bundle2Keys[matchIndex] });
      bundle2Keys.splice(matchIndex, 1);
    }
  }

  // now try squishy matches for terrible non-CE data
  for (let bundle2Key of bundle2Keys) {
    const matchIndex = find_match_index_squishy(bundle2Key, unmatchedBundle1);
    if (matchIndex === -1) {
      const resourceTypeGroup = get_resource_type_group(
        bundle2Key.resourceType
      );

      if (resourceTypeGroup) {
        const crossResourceIndex = find_match_index_cross_resource(
          bundle2Key,
          unmatchedBundle1,
          resourceTypeGroup
        );

        if (crossResourceIndex === -1) {
          bundle2Only.push(bundle2Key);
        } else {
          common.push({
            bundle1: unmatchedBundle1[crossResourceIndex],
            bundle2: bundle2Key,
          });
          unmatchedBundle1.splice(crossResourceIndex, 1);
        }
      } else {
        bundle2Only.push(bundle2Key);
      }
    } else {
      common.push({
        bundle1: unmatchedBundle1[matchIndex],
        bundle2: bundle2Key,
      });
      unmatchedBundle1.splice(matchIndex, 1);
    }
  }

  bundle1Only.push(...unmatchedBundle1);

  return {
    bundle1Only: bundle1Only.map(build_reference),
    bundle2Only: bundle2Only.map(build_reference),
    common: common.map((r) => ({
      bundle1: build_reference(r.bundle1),
      bundle2: build_reference(r.bundle2),
    })),
  };
}
