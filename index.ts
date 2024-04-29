import * as r4 from "fhir/r4";
import { FhirMatch } from "./models/fhirMatch";
import { ResourceAndKey } from "./models/resourceAndKey";
import { KeyStore } from "./models/keyStore";
import { buildRef, buildReference } from "./models/fhirUtil";

const medicationResourceTypes = [
  "MedicationRequest",
  "MedicationStatement",
  "MedicationAdministration",
  "Medication",
];

const labResourceTypes = ["Observation", "DiagnosticReport"];

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

export function buildKeys(bundle: r4.Bundle): KeyStore {
  const keys = new KeyStore();

  for (const entry of bundle.entry || []) {
    keys.push(entry);
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

function findMatchIndex(
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

function findMatchIndexSquishy(
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

function findMatchIndexCrossResource(
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

function getResourceTypeGroup(resourceType: string): string[] | undefined {
  if (medicationResourceTypes.includes(resourceType)) {
    return medicationResourceTypes;
  }
  if (labResourceTypes.includes(resourceType)) {
    return labResourceTypes;
  }
  return undefined;
}

export function fhirBundlesMatch(
  bundle1: r4.Bundle,
  bundle2: r4.Bundle,
): FhirMatch {
  console.log("--- bundle1 ---");
  const bundle1KeyStore = buildKeys(bundle1);

  console.log("--- bundle2 ---");
  const bundle2KeyStore = buildKeys(bundle2);

  console.log("--- matching ---");

  const bundle1Only: ResourceAndKey[] = [];
  const bundle2Only: ResourceAndKey[] = [];
  const common: { bundle1: ResourceAndKey; bundle2: ResourceAndKey }[] = [];

  const unmatchedBundle1: ResourceAndKey[] = [];

  const bundle1Keys = [...bundle1KeyStore.all];
  const bundle2Keys = [...bundle2KeyStore.all];

  // try strong matches first
  for (const bundle1Key of bundle1Keys) {
    const matchIndex = findMatchIndex(bundle1Key, bundle2Keys);
    if (matchIndex === -1) {
      unmatchedBundle1.push(bundle1Key);
    } else {
      common.push({ bundle1: bundle1Key, bundle2: bundle2Keys[matchIndex] });
      bundle2Keys.splice(matchIndex, 1);
    }
  }

  // now try squishy matches for terrible non-CE data
  for (const bundle2Key of bundle2Keys) {
    const matchIndex = findMatchIndexSquishy(bundle2Key, unmatchedBundle1);
    if (matchIndex === -1) {
      const resourceTypeGroup = getResourceTypeGroup(bundle2Key.resourceType);

      if (resourceTypeGroup) {
        const crossResourceIndex = findMatchIndexCrossResource(
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
    bundle1Only: bundle1Only.map(buildReference),
    bundle2Only: bundle2Only.map(buildReference),
    common: common.map((r) => ({
      bundle1: buildReference(r.bundle1),
      bundle2: buildReference(r.bundle2),
    })),
  };
}
