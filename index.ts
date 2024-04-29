import * as r4 from "fhir/r4";
import { FhirMatch } from "./models/fhirMatch";
import { ResourceAndKey } from "./models/resourceAndKey";
import { KeyStore } from "./models/keyStore";
import { Matcher } from "./engine/matcher";
import { IdentifierMatcher } from "./engine/identifierMatcher";
import { PrimaryCodeAndSystemMatcher } from "./engine/primaryCodeAndSystemMatcher";
import { TextMatcher } from "./engine/textMatcher";
import { ValueMatcher } from "./engine/valueMatcher";
import { PrimaryCodeMatcher } from "./engine/primaryCodeMatcher";
import { CrossResourceNaturalKeyMatcher } from "./engine/crossResourceNaturalKeyMatcher";
import { CrossResourceTextMatcher } from "./engine/crossResourceTextMatcher";

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

export function fhirBundlesMatch(
  bundle1: r4.Bundle,
  bundle2: r4.Bundle,
): FhirMatch {
  console.log("--- bundle1 ---");
  const bundle1KeyStore = buildKeys(bundle1);

  console.log("--- bundle2 ---");
  const bundle2KeyStore = buildKeys(bundle2);

  console.log("--- matching ---");

  const overallMatch: FhirMatch = {
    bundle1Only: [],
    bundle2Only: [],
    common: [],
  };

  const matchers: Matcher[] = [
    IdentifierMatcher,
    PrimaryCodeAndSystemMatcher,
    TextMatcher,
    ValueMatcher,
    PrimaryCodeMatcher,
    CrossResourceNaturalKeyMatcher,
    CrossResourceTextMatcher,
  ];

  let unmatchedBundle1 = bundle1KeyStore.all;
  let unmatchedBundle2 = bundle2KeyStore.all;

  for (const matcher of matchers) {
    const result = matcher(unmatchedBundle1, unmatchedBundle2);

    console.log(result);

    overallMatch.common.push(...result.matched);

    if (result.unmatched1.length === 0 && result.unmatched2.length === 0) {
      break;
    }

    unmatchedBundle1 = result.unmatched1;
    unmatchedBundle2 = result.unmatched2;
  }

  return overallMatch;
}
