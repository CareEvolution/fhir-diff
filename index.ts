import * as r4 from "fhir/r4";
import { FhirMatch } from "./models/fhir_match";
import { ResourceAndKey } from "./models/resource_and_key";

const medicationResourceTypes = [
  "MedicationRequest",
  "MedicationStatement",
  "MedicationAdministration",
];

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

function pick_primary_coding(
  codeableConcept: r4.CodeableConcept | undefined,
  preferredSystems: string[]
): r4.Coding | undefined {
  if (!codeableConcept?.coding) {
    return undefined;
  }

  const userSelected = codeableConcept.coding?.find((c) => c.userSelected);

  if (userSelected) {
    return userSelected;
  }

  const preferredSystem = codeableConcept.coding?.find((c) =>
    preferredSystems.includes(c.system!)
  );

  if (preferredSystem) {
    return preferredSystem;
  }

  return codeableConcept.coding?.[0];
}

function build_keys(bundle: r4.Bundle): ResourceAndKey[] {
  const keys: ResourceAndKey[] = [];

  for (let entry of bundle.entry || []) {
    if (!entry?.resource?.resourceType) {
      continue;
    }
    switch (entry.resource.resourceType) {
      case "Patient":
        keys.push({
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
        });
        break;
      case "Encounter":
        const primary_coding = entry.resource.class;
        keys.push({
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
        keys.push({
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_condition?.system,
          primary_code: primary_coding_condition?.code,
          date: entry.resource.onsetDateTime,
          text: entry.resource.code?.text,
        });
        break;

      case "MedicationAdministration":
        const primary_coding_medadmin = pick_primary_coding(
          entry.resource.medicationCodeableConcept,
          ["http://www.nlm.nih.gov/research/umls/rxnorm"]
        );
        keys.push({
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_medadmin?.system,
          primary_code: primary_coding_medadmin?.code,
          date: entry.resource.effectiveDateTime,
          text: entry.resource.medicationCodeableConcept?.text,
        });
        break;

      case "MedicationRequest":
        const primary_coding_medreq = pick_primary_coding(
          entry.resource.medicationCodeableConcept,
          ["http://www.nlm.nih.gov/research/umls/rxnorm"]
        );
        keys.push({
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_medreq?.system,
          primary_code: primary_coding_medreq?.code,
          date: entry.resource.authoredOn,
          text: entry.resource.medicationCodeableConcept?.text,
        });
        break;

      case "MedicationStatement":
        const primary_coding_medstate = pick_primary_coding(
          entry.resource.medicationCodeableConcept,
          ["http://www.nlm.nih.gov/research/umls/rxnorm"]
        );
        keys.push({
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_medstate?.system,
          primary_code: primary_coding_medstate?.code,
          date:
            entry.resource.effectiveDateTime ||
            entry.resource.effectivePeriod?.start,
          text: entry.resource.medicationCodeableConcept?.text,
        });
        break;

      case "Procedure":
        const primary_coding_procedure = pick_primary_coding(
          entry.resource.code,
          ["http://snomed.info/sct", "http://www.icd10data.com/icd10pcs"]
        );
        keys.push({
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_procedure?.system,
          primary_code: primary_coding_procedure?.code,
          date:
            entry.resource.performedDateTime ||
            entry.resource.performedPeriod?.start,
          text: entry.resource.code?.text,
        });
        break;

      case "AllergyIntolerance":
        const primary_coding_allergy = pick_primary_coding(
          entry.resource.code,
          ["http://snomed.info/sct"]
        );
        keys.push({
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_allergy?.system,
          primary_code: primary_coding_allergy?.code,
          date: entry.resource.onsetDateTime || entry.resource.recordedDate,
          text: entry.resource.code?.text,
        });
        break;

      case "Observation":
        const primary_coding_observation = pick_primary_coding(
          entry.resource.code,
          ["http://loinc.org", "http://snomed.info/sct"]
        );

        keys.push({
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_observation?.system,
          primary_code: primary_coding_observation?.code,
          date: entry.resource.effectiveDateTime,
          text: entry.resource.code?.text,
        });
        break;

      case "DiagnosticReport":
        const primary_coding_diagnostic_report = pick_primary_coding(
          entry.resource.code,
          ["http://loinc.org", "http://snomed.info/sct"]
        );

        keys.push({
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding_diagnostic_report?.system,
          primary_code: primary_coding_diagnostic_report?.code,
          date:
            entry.resource.effectiveDateTime ||
            entry.resource.effectivePeriod?.start,
          text: entry.resource.code?.text,
        });
        break;

      case "Practitioner":
        keys.push({
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
        });
        break;

      case "PractitionerRole":
        keys.push({
          resource: entry.resource,
          resourceType: entry.resource.resourceType,
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
        });
        break;

      case "Organization":
        keys.push({
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

  return keys;
}

function build_reference(resource: ResourceAndKey): r4.Reference {
  return {
    reference: `${resource.resourceType}/${resource.resource.id}`,
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
    return byIdentifier;
  }

  const byNaturalKey = candidates.findIndex(
    (k) =>
      k.resourceType === target.resourceType &&
      k.primary_code_system === target.primary_code_system &&
      k.primary_code === target.primary_code &&
      k.date === target.date
  );
  return byNaturalKey;
}

function find_match_index_squishy(
  target: ResourceAndKey,
  candidates: ResourceAndKey[]
): number {
  const byCode = candidates.findIndex(
    (k) =>
      k.resourceType === target.resourceType &&
      k.primary_code_system === target.primary_code_system &&
      k.primary_code === target.primary_code
  );

  if (byCode !== -1) {
    return byCode;
  }

  const byText = candidates.findIndex(
    (k) =>
      k.resourceType === target.resourceType &&
      k.text === target.text &&
      k.date === target.date
  );

  const byDate = candidates.findIndex(
    (k) => k.resourceType === target.resourceType && k.date === target.date
  );
  return byDate;
}

function find_match_index_cross_resource_medications(
  target: ResourceAndKey,
  candidates: ResourceAndKey[]
): number {
  if (!medicationResourceTypes.includes(target.resourceType)) {
    return -1;
  }

  const byCode = candidates.findIndex(
    (k) =>
      medicationResourceTypes.includes(k.resourceType) &&
      k.resourceType === target.resourceType &&
      k.primary_code_system === target.primary_code_system &&
      k.primary_code === target.primary_code
  );

  if (byCode !== -1) {
    return byCode;
  }

  const byText = candidates.findIndex(
    (k) =>
      medicationResourceTypes.includes(k.resourceType) &&
      k.text === target.text &&
      k.date === target.date
  );

  const byDate = candidates.findIndex(
    (k) =>
      medicationResourceTypes.includes(k.resourceType) && k.date === target.date
  );
  return byDate;
}

export function fhir_bundles_match(
  bundle1: r4.Bundle,
  bundle2: r4.Bundle
): FhirMatch {
  console.log("--- bundle1 ---");
  var bundle1Keys = build_keys(bundle1);

  console.log("--- bundle2 ---");
  var bundle2Keys = build_keys(bundle2);

  console.log("--- matching ---");

  const bundle1Only: ResourceAndKey[] = [];
  const bundle2Only: ResourceAndKey[] = [];
  const common: { bundle1: ResourceAndKey; bundle2: ResourceAndKey }[] = [];

  const unmatchedBundle1: ResourceAndKey[] = [];

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
      const crossResourceIndex = find_match_index_cross_resource_medications(
        bundle2Key,
        unmatchedBundle1
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
