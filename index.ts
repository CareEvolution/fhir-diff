import * as r4 from "fhir/r4";
import { FhirMatch } from "./models/fhir_match";
import { ResourceAndKey } from "./models/resource_and_key";
import wellKnownUrls from "./data/well-known-urls";

const medicationResourceTypes = [
  "MedicationRequest",
  "MedicationStatement",
  "MedicationAdministration",
  "Medication",
];

const labResourceTypes = ["Observation", "DiagnosticReport"];

export function pick_identifier(
  identifier?: r4.Identifier[],
): string | undefined {
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
const oidRE = /urn:oid:(.*)/; // not all things in CDAs that should be OIDs are OIDs, and naive template-based things won't be able to tell it's not an OID
const fakeFhirUrlRE = /http:\/\/terminology\.hl7\.org\/CodeSystem\/(.*)/; // MS makes up terminology.hl7.org urls for custom stuff in CDAs

export function clean_code_system(
  coding: r4.Coding | undefined,
): r4.Coding | undefined {
  if (!coding?.system) {
    return coding;
  }

  if (wellKnownUrls.has(coding.system)) {
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
        } else {
          const fakeFhirUrlMatch = coding.system.match(fakeFhirUrlRE);
          if (fakeFhirUrlMatch) {
            coding.system = fakeFhirUrlMatch[1];
          }
        }
      }
    }
  }

  return coding;
}

export function pick_primary_coding(
  codeableConcept: r4.CodeableConcept | undefined,
  preferredSystems: string[],
): r4.Coding | undefined {
  if (!codeableConcept?.coding) {
    return undefined;
  }

  const userSelected = codeableConcept.coding?.find(
    (c) => c.userSelected === undefined || c.userSelected === true,
  );

  if (userSelected) {
    return clean_code_system(userSelected);
  }

  const preferredSystem = codeableConcept.coding?.find((c) =>
    preferredSystems.includes(c.system!),
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

export class KeyStore {
  public all: ResourceAndKey[] = [];
  public byFhirRef: Map<string, ResourceAndKey> = new Map();
  public byFullUrl: Map<string, ResourceAndKey> = new Map();

  public push(entry: r4.BundleEntry, key: ResourceAndKey) {
    this.all.push(key);
    this.byFhirRef.set(buildRef(key.resource), key);
    if (entry.fullUrl) {
      this.byFullUrl.set(entry.fullUrl, key);
    }
  }
}

function buildKeyPatient(patient: r4.Patient): ResourceAndKey {
  return {
    resource: patient,
    resourceType: "Patient",
    identifier: pick_identifier(patient.identifier) || patient.id,
  };
}

function buildKeyEncounter(encounter: r4.Encounter): ResourceAndKey {
  const primary_coding = encounter.class;
  return {
    resource: encounter,
    resourceType: encounter.resourceType,
    identifier: pick_identifier(encounter.identifier) || encounter.id,
    primary_code_system: primary_coding?.system,
    primary_code: primary_coding?.code,
    date: encounter.period?.start,
  };
}

function buildKeyCondition(condition: r4.Condition): ResourceAndKey {
  const primary_coding = pick_primary_coding(condition.code, [
    "http://snomed.info/sct",
    "http://www.icd10data.com/icd10pcs",
  ]);
  return {
    resource: condition,
    resourceType: condition.resourceType,
    identifier: pick_identifier(condition.identifier) || condition.id,
    primary_code_system: primary_coding?.system,
    primary_code: primary_coding?.code,
    date: condition.onsetDateTime,
    text: clean_text(condition.code?.text),
  };
}

function buildKeyMedicationAdministration(
  medadmin: r4.MedicationAdministration,
): ResourceAndKey {
  const primary_coding = pick_primary_coding(
    medadmin.medicationCodeableConcept,
    ["http://www.nlm.nih.gov/research/umls/rxnorm"],
  );
  return {
    resource: medadmin,
    resourceType: medadmin.resourceType,
    identifier: pick_identifier(medadmin.identifier) || medadmin.id,
    primary_code_system: primary_coding?.system,
    primary_code: primary_coding?.code,
    date: medadmin.effectiveDateTime,
    text: clean_text(medadmin.medicationCodeableConcept?.text),
  };
}

function buildKeyMedicationRequest(
  medRequest: r4.MedicationRequest,
): ResourceAndKey {
  const primary_coding = pick_primary_coding(
    medRequest.medicationCodeableConcept,
    ["http://www.nlm.nih.gov/research/umls/rxnorm"],
  );
  return {
    resource: medRequest,
    resourceType: medRequest.resourceType,
    identifier: pick_identifier(medRequest.identifier) || medRequest.id,
    primary_code_system: primary_coding?.system,
    primary_code: primary_coding?.code,
    date: medRequest.authoredOn,
    text: clean_text(medRequest.medicationCodeableConcept?.text),
  };
}

function buildKeyMedicationStatement(
  medStatement: r4.MedicationStatement,
): ResourceAndKey {
  const primary_coding = pick_primary_coding(
    medStatement.medicationCodeableConcept,
    ["http://www.nlm.nih.gov/research/umls/rxnorm"],
  );
  return {
    resource: medStatement,
    resourceType: medStatement.resourceType,
    identifier: pick_identifier(medStatement.identifier) || medStatement.id,
    primary_code_system: primary_coding?.system,
    primary_code: primary_coding?.code,
    date: medStatement.effectiveDateTime || medStatement.effectivePeriod?.start,
    text: clean_text(medStatement.medicationCodeableConcept?.text),
  };
}

function buildKeyMedication(medication: r4.Medication): ResourceAndKey {
  const primary_coding = pick_primary_coding(medication.code, [
    "http://www.nlm.nih.gov/research/umls/rxnorm",
  ]);
  return {
    resource: medication,
    resourceType: medication.resourceType,
    identifier: pick_identifier(medication.identifier) || medication.id,
    primary_code_system: primary_coding?.system,
    primary_code: primary_coding?.code,
    text: clean_text(medication.code?.text),
  };
}

function buildKeyProcedure(procedure: r4.Procedure): ResourceAndKey {
  const primary_coding = pick_primary_coding(procedure.code, [
    "http://snomed.info/sct",
    "http://www.icd10data.com/icd10pcs",
  ]);
  return {
    resource: procedure,
    resourceType: procedure.resourceType,
    identifier: pick_identifier(procedure.identifier) || procedure.id,
    primary_code_system: primary_coding?.system,
    primary_code: primary_coding?.code,
    date: procedure.performedDateTime || procedure.performedPeriod?.start,
    text: clean_text(procedure.code?.text),
  };
}

function buildKeyAllergyInterolerance(
  allergyIntolerance: r4.AllergyIntolerance,
): ResourceAndKey {
  const allergyIntoleranceSystems = ["http://snomed.info/sct"];
  const primary_coding_allergy =
    pick_primary_coding(allergyIntolerance.code, allergyIntoleranceSystems) ||
    allergyIntolerance.reaction
      ?.map((reaction) =>
        pick_primary_coding(reaction.substance, allergyIntoleranceSystems),
      )
      ?.find((s) => !!s);
  return {
    resource: allergyIntolerance,
    resourceType: allergyIntolerance.resourceType,
    identifier:
      pick_identifier(allergyIntolerance.identifier) || allergyIntolerance.id,
    primary_code_system: primary_coding_allergy?.system,
    primary_code: primary_coding_allergy?.code,
    date: allergyIntolerance.onsetDateTime || allergyIntolerance.recordedDate,
    text: clean_text(allergyIntolerance.code?.text),
  };
}

function buildKeyObservation(observation: r4.Observation): ResourceAndKey {
  const primary_coding_observation = pick_primary_coding(observation.code, [
    "http://loinc.org",
    "http://snomed.info/sct",
  ]);

  let value: string | undefined;

  if (observation.valueString) {
    value = observation.valueString;
  } else if (observation.valueQuantity?.value) {
    if (observation.valueQuantity.unit) {
      value = `${observation.valueQuantity.value} ${observation.valueQuantity.unit}`;
    } else {
      value = observation.valueQuantity.value?.toString();
    }
  } else if (observation.valueInteger) {
    value = observation.valueInteger.toString();
  } else if (observation.valueCodeableConcept?.text) {
    value = observation.valueCodeableConcept.text;
  }

  return {
    resource: observation,
    resourceType: observation.resourceType,
    identifier: pick_identifier(observation.identifier) || observation.id,
    primary_code_system: primary_coding_observation?.system,
    primary_code: primary_coding_observation?.code,
    date: observation.effectiveDateTime,
    text: clean_text(observation.code?.text),
    value: value,
  };
}

function buildKeyDiagnosticReport(
  diagnosticReport: r4.DiagnosticReport,
): ResourceAndKey {
  const primary_coding_diagnostic_report = pick_primary_coding(
    diagnosticReport.code,
    ["http://loinc.org", "http://snomed.info/sct"],
  );

  return {
    resource: diagnosticReport,
    resourceType: diagnosticReport.resourceType,
    identifier:
      pick_identifier(diagnosticReport.identifier) || diagnosticReport.id,
    primary_code_system: primary_coding_diagnostic_report?.system,
    primary_code: primary_coding_diagnostic_report?.code,
    date: diagnosticReport.effectiveDateTime,
    text: clean_text(diagnosticReport.code?.text),
  };
}

function buildKeyPractitioner(practitioner: r4.Practitioner): ResourceAndKey {
  return {
    resource: practitioner,
    resourceType: practitioner.resourceType,
    identifier: pick_identifier(practitioner.identifier) || practitioner.id,
  };
}

function buildKeyPractitionerRole(
  practitionerRole: r4.PractitionerRole,
): ResourceAndKey {
  return {
    resource: practitionerRole,
    resourceType: practitionerRole.resourceType,
    identifier:
      pick_identifier(practitionerRole.identifier) || practitionerRole.id,
  };
}

function buildKeyOrganization(organization: r4.Organization): ResourceAndKey {
  return {
    resource: organization,
    resourceType: organization.resourceType,
    identifier: pick_identifier(organization.identifier) || organization.id,
  };
}

function setObservationDate(observationKey: ResourceAndKey, keys: KeyStore) {
  if (observationKey.date) {
    return;
  }

  const observation = observationKey.resource as r4.Observation;

  if (observation.encounter?.reference) {
    const encounterKey = keys.byFhirRef.get(observation.encounter.reference);
    if (encounterKey && encounterKey.date) {
      observationKey.date = encounterKey.date;
      return;
    }
  }

  if (observation.hasMember && observation.hasMember.length > 0) {
    const memberDates: string[] = [];

    for (const member of observation.hasMember) {
      if (member.reference) {
        const memberKey = keys.byFhirRef.get(member.reference);
        if (memberKey && memberKey.date) {
          memberDates.push(memberKey.date);
        }
      }
    }

    const disitinctDates = new Set(memberDates);
    if (disitinctDates.size === 1) {
      observationKey.date = disitinctDates.values().next().value;
      return;
    }
  }
}

function setDiagnosticReportDate(
  diagnosticReportKey: ResourceAndKey,
  keys: KeyStore,
) {
  if (diagnosticReportKey.date) {
    return;
  }

  const diagnosticReport = diagnosticReportKey.resource as r4.DiagnosticReport;
  if (diagnosticReport.encounter?.reference) {
    const encounterKey = keys.byFhirRef.get(
      diagnosticReport.encounter.reference,
    );
    if (encounterKey && encounterKey.date) {
      diagnosticReportKey.date = encounterKey.date;
      return;
    }
  }

  if (
    !diagnosticReportKey.date &&
    diagnosticReport.result &&
    diagnosticReport.result.length > 0
  ) {
    const resultDates: string[] = [];

    for (const result of diagnosticReport.result) {
      if (result.reference) {
        const resultKey =
          keys.byFhirRef.get(result.reference) ||
          keys.byFullUrl.get(result.reference);
        if (resultKey && resultKey.date) {
          resultDates.push(resultKey.date);
        }
      }
    }

    const disitinctDates = new Set(resultDates);
    if (disitinctDates.size === 1) {
      diagnosticReportKey.date = disitinctDates.values().next().value;
      return;
    }
  }
}

export function build_keys(bundle: r4.Bundle): KeyStore {
  const keys = new KeyStore();

  for (const entry of bundle.entry || []) {
    if (!entry?.resource?.resourceType) {
      continue;
    }
    switch (entry.resource.resourceType) {
      case "Patient":
        keys.push(entry, buildKeyPatient(entry.resource));
        break;

      case "Encounter":
        keys.push(entry, buildKeyEncounter(entry.resource));
        break;

      case "Condition":
        keys.push(entry, buildKeyCondition(entry.resource));
        break;

      case "MedicationAdministration":
        keys.push(entry, buildKeyMedicationAdministration(entry.resource));
        break;

      case "MedicationRequest":
        keys.push(entry, buildKeyMedicationRequest(entry.resource));
        break;

      case "MedicationStatement":
        keys.push(entry, buildKeyMedicationStatement(entry.resource));
        break;

      case "Medication":
        keys.push(entry, buildKeyMedication(entry.resource));
        break;

      case "Procedure":
        keys.push(entry, buildKeyProcedure(entry.resource));
        break;

      case "AllergyIntolerance":
        keys.push(entry, buildKeyAllergyInterolerance(entry.resource));
        break;

      case "Observation":
        keys.push(entry, buildKeyObservation(entry.resource));
        break;

      case "DiagnosticReport":
        keys.push(entry, buildKeyDiagnosticReport(entry.resource));
        break;

      case "Practitioner":
        keys.push(entry, buildKeyPractitioner(entry.resource));
        break;

      case "PractitionerRole":
        keys.push(entry, buildKeyPractitionerRole(entry.resource));
        break;

      case "Organization":
        keys.push(entry, buildKeyOrganization(entry.resource));
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

  for (const key of keys.all.filter((k) => !k.date)) {
    switch (key.resource.resourceType) {
      case "Observation":
        setObservationDate(key, keys);
        break;
      case "DiagnosticReport":
        setDiagnosticReportDate(key, keys);
        break;
    }
  }

  return keys;
}

export function buildRef(resource: r4.Resource): string {
  return `${resource.resourceType}/${resource.id}`;
}

function build_reference(resource: ResourceAndKey): r4.Reference {
  return {
    reference: buildRef(resource.resource),
  };
}

function find_match_index(
  target: ResourceAndKey,
  candidates: ResourceAndKey[],
): number {
  const byIdentifier = candidates.findIndex(
    (k) =>
      k.resourceType === target.resourceType &&
      k.identifier === target.identifier,
  );

  if (byIdentifier !== -1) {
    console.log(
      `Matched ${buildRef(target.resource)} <=> ${buildRef(
        candidates[byIdentifier].resource,
      )} by identifier ${target.identifier}`,
    );
    return byIdentifier;
  }

  if (target.date || target.primary_code_system || target.primary_code) {
    const byNaturalKey = candidates.findIndex(
      (k) =>
        k.resourceType === target.resourceType &&
        k.primary_code_system === target.primary_code_system &&
        k.primary_code === target.primary_code &&
        k.date === target.date,
    );

    if (byNaturalKey !== -1) {
      console.log(
        `Matched ${buildRef(target.resource)} <=> ${buildRef(
          candidates[byNaturalKey].resource,
        )} by natural key ${target.primary_code_system} ${
          target.primary_code
        } ${target.date}`,
      );
      return byNaturalKey;
    }
  }

  return -1;
}

function find_match_index_squishy(
  target: ResourceAndKey,
  candidates: ResourceAndKey[],
): number {
  if (target.primary_code && target.primary_code_system) {
    const byCodeAndSystem = candidates.findIndex(
      (k) =>
        k.resourceType === target.resourceType &&
        k.primary_code_system === target.primary_code_system &&
        k.primary_code === target.primary_code &&
        k.date == target.date,
    );

    if (byCodeAndSystem !== -1) {
      console.log(
        `Matched ${buildRef(target.resource)} <=> ${buildRef(
          candidates[byCodeAndSystem].resource,
        )} by code ${target.primary_code_system} ${target.primary_code}`,
      );
      return byCodeAndSystem;
    }
  }

  if (target.text) {
    const byText = candidates.findIndex(
      (k) =>
        k.resourceType === target.resourceType &&
        k.text === target.text &&
        k.date === target.date,
    );

    if (byText !== -1) {
      console.log(
        `Matched ${buildRef(target.resource)} <=> ${buildRef(
          candidates[byText].resource,
        )} by text ${target.text?.substring(0, 50)} and date ${target.date}`,
      );
      return byText;
    }
  }

  if (target.value) {
    const byValue = candidates.findIndex(
      (k) =>
        k.resourceType === target.resourceType &&
        k.date === target.date &&
        k.value === target.value,
    );

    if (byValue !== -1) {
      console.log(
        `Matched ${buildRef(target.resource)} <=> ${buildRef(
          candidates[byValue].resource,
        )} by value ${target.value} and date ${target.date}`,
      );

      return byValue;
    }
  }

  if (target.primary_code) {
    const byCodeOnly = candidates.findIndex(
      (k) =>
        k.resourceType === target.resourceType &&
        k.primary_code === target.primary_code &&
        k.date == target.date,
    );

    if (byCodeOnly !== -1) {
      console.log(
        `Matched ${buildRef(target.resource)} <=> ${buildRef(
          candidates[byCodeOnly].resource,
        )} by code only ${target.primary_code}`,
      );
      return byCodeOnly;
    }
  }

  return -1;
}

function find_match_index_cross_resource(
  target: ResourceAndKey,
  candidates: ResourceAndKey[],
  resourceTypes: string[],
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
        k.primary_code === target.primary_code,
    );

    if (byCode !== -1) {
      console.log(
        `Matched ${buildRef(target.resource)} <=> ${buildRef(
          candidates[byCode].resource,
        )} by code ${target.primary_code_system} ${target.primary_code}`,
      );
      return byCode;
    }
  }

  if (target.text) {
    const byText = candidates.findIndex(
      (k) =>
        resourceTypes.includes(k.resourceType) &&
        k.text === target.text &&
        k.date === target.date,
    );

    if (byText !== -1) {
      console.log(
        `Matched ${buildRef(target.resource)} <=> ${buildRef(
          candidates[byText].resource,
        )} by text ${target.text?.substring(0, 50)} and date ${target.date}`,
      );
      return byText;
    }
  }

  if (
    target.resourceType === "Observation" ||
    target.resourceType === "DiagnosticReport"
  ) {
    console.log(
      `target: ${buildRef(target.resource)} ${target.identifier} ${
        target.primary_code_system
      }/${target.primary_code} ${target.date} ${target.text?.substring(0, 50)}`,
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
  bundle2: r4.Bundle,
): FhirMatch {
  console.log("--- bundle1 ---");
  const bundle1KeyStore = build_keys(bundle1);

  console.log("--- bundle2 ---");
  const bundle2KeyStore = build_keys(bundle2);

  console.log("--- matching ---");

  const bundle1Only: ResourceAndKey[] = [];
  const bundle2Only: ResourceAndKey[] = [];
  const common: { bundle1: ResourceAndKey; bundle2: ResourceAndKey }[] = [];

  const unmatchedBundle1: ResourceAndKey[] = [];

  const bundle1Keys = [...bundle1KeyStore.all];
  const bundle2Keys = [...bundle2KeyStore.all];

  // try strong matches first
  for (const bundle1Key of bundle1Keys) {
    const matchIndex = find_match_index(bundle1Key, bundle2Keys);
    if (matchIndex === -1) {
      unmatchedBundle1.push(bundle1Key);
    } else {
      common.push({ bundle1: bundle1Key, bundle2: bundle2Keys[matchIndex] });
      bundle2Keys.splice(matchIndex, 1);
    }
  }

  // now try squishy matches for terrible non-CE data
  for (const bundle2Key of bundle2Keys) {
    const matchIndex = find_match_index_squishy(bundle2Key, unmatchedBundle1);
    if (matchIndex === -1) {
      const resourceTypeGroup = get_resource_type_group(
        bundle2Key.resourceType,
      );

      if (resourceTypeGroup) {
        const crossResourceIndex = find_match_index_cross_resource(
          bundle2Key,
          unmatchedBundle1,
          resourceTypeGroup,
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
