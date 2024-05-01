import { expect, test, describe } from "@jest/globals";
import { CrossResourcePrimaryCodeDateMatcher } from "./crossResourcePrimaryCodeDateMatcher";
import { ResourceAndKey } from "../models/resourceAndKey";

describe("Labs group", () => {
  test("should match Observation to DiagnosticReport based on primary coding and date", () => {
    const bundle1: ResourceAndKey[] = [
      {
        resource: { resourceType: "Observation", id: "observation_bundle1" },
        resourceType: "Observation",
        primaryCode: "371361000119107",
        primaryCodeSystem: "http://snomed.info/sct",
        date: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "DiagnosticReport",
          id: "diagnosticreport_bundle2",
        },
        resourceType: "DiagnosticReport",
        primaryCode: "371361000119107",
        primaryCodeSystem: "http://snomed.info/sct",
        date: "2021-03-04",
      },
    ];

    const actual = CrossResourcePrimaryCodeDateMatcher(bundle1, bundle2);

    expect(actual.unmatched1.length).toBe(0);
    expect(actual.unmatched2.length).toBe(0);
    expect(actual.matched.length).toBe(1);
    expect(actual.matched[0].bundle1.reference).toBe(
      "Observation/observation_bundle1",
    );
    expect(actual.matched[0].bundle2.reference).toBe(
      "DiagnosticReport/diagnosticreport_bundle2",
    );
  });

  test("should match DiagnosticReport to Observation based on primary coding and date", () => {
    const bundle1: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "DiagnosticReport",
          id: "diagnosticreport_bundle1",
        },
        resourceType: "DiagnosticReport",
        primaryCode: "371361000119107",
        primaryCodeSystem: "http://snomed.info/sct",
        date: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: { resourceType: "Observation", id: "observation_bundle2" },
        resourceType: "Observation",
        primaryCode: "371361000119107",
        primaryCodeSystem: "http://snomed.info/sct",
        date: "2021-03-04",
      },
    ];

    const actual = CrossResourcePrimaryCodeDateMatcher(bundle1, bundle2);

    expect(actual.unmatched1.length).toBe(0);
    expect(actual.unmatched2.length).toBe(0);
    expect(actual.matched.length).toBe(1);
    expect(actual.matched[0].bundle1.reference).toBe(
      "DiagnosticReport/diagnosticreport_bundle1",
    );
    expect(actual.matched[0].bundle2.reference).toBe(
      "Observation/observation_bundle2",
    );
  });

  test("should not match based on different date", () => {
    const bundle1: ResourceAndKey[] = [
      {
        resource: { resourceType: "Observation", id: "observation_bundle1" },
        resourceType: "Observation",
        primaryCode: "371361000119107",
        primaryCodeSystem: "http://snomed.info/sct",
        date: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "DiagnosticReport",
          id: "diagnosticreport_bundle2",
        },
        resourceType: "DiagnosticReport",
        primaryCode: "371361000119107",
        primaryCodeSystem: "http://snomed.info/sct",
        date: "2021-03-05",
      },
    ];

    const actual = CrossResourcePrimaryCodeDateMatcher(bundle1, bundle2);

    expect(actual.unmatched1.length).toBe(1);
    expect(actual.unmatched1[0]).toBe(bundle1[0]);
    expect(actual.unmatched2.length).toBe(1);
    expect(actual.unmatched2[0]).toBe(bundle2[0]);
    expect(actual.matched.length).toBe(0);
  });

  test("should not match based on different code", () => {
    const bundle1: ResourceAndKey[] = [
      {
        resource: { resourceType: "Observation", id: "observation_bundle1" },
        resourceType: "Observation",
        primaryCode: "371361000119107",
        primaryCodeSystem: "http://snomed.info/sct",
        date: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "DiagnosticReport",
          id: "diagnosticreport_bundle2",
        },
        resourceType: "DiagnosticReport",
        primaryCode: "26604007",
        primaryCodeSystem: "http://snomed.info/sct",
        date: "2021-03-04",
      },
    ];

    const actual = CrossResourcePrimaryCodeDateMatcher(bundle1, bundle2);

    expect(actual.unmatched1.length).toBe(1);
    expect(actual.unmatched1[0]).toBe(bundle1[0]);
    expect(actual.unmatched2.length).toBe(1);
    expect(actual.unmatched2[0]).toBe(bundle2[0]);
    expect(actual.matched.length).toBe(0);
  });

  test("should not match missing dates", () => {
    const bundle1: ResourceAndKey[] = [
      {
        resource: { resourceType: "Observation", id: "observation_bundle1" },
        resourceType: "Observation",
        primaryCode: "371361000119107",
        primaryCodeSystem: "http://snomed.info/sct",
        date: undefined,
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "DiagnosticReport",
          id: "diagnosticreport_bundle2",
        },
        resourceType: "DiagnosticReport",
        primaryCode: "26604007",
        primaryCodeSystem: "http://snomed.info/sct",
        date: undefined,
      },
    ];

    const actual = CrossResourcePrimaryCodeDateMatcher(bundle1, bundle2);

    expect(actual.unmatched1.length).toBe(1);
    expect(actual.unmatched1[0]).toBe(bundle1[0]);
    expect(actual.unmatched2.length).toBe(1);
    expect(actual.unmatched2[0]).toBe(bundle2[0]);
    expect(actual.matched.length).toBe(0);
  });

  test("should not match missing code", () => {
    const bundle1: ResourceAndKey[] = [
      {
        resource: { resourceType: "Observation", id: "observation_bundle1" },
        resourceType: "Observation",
        primaryCode: undefined,
        primaryCodeSystem: "http://snomed.info/sct",
        date: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "DiagnosticReport",
          id: "diagnosticreport_bundle2",
        },
        resourceType: "DiagnosticReport",
        primaryCode: undefined,
        primaryCodeSystem: "http://snomed.info/sct",
        date: "2021-03-04",
      },
    ];

    const actual = CrossResourcePrimaryCodeDateMatcher(bundle1, bundle2);

    expect(actual.unmatched1.length).toBe(1);
    expect(actual.unmatched1[0]).toBe(bundle1[0]);
    expect(actual.unmatched2.length).toBe(1);
    expect(actual.unmatched2[0]).toBe(bundle2[0]);
    expect(actual.matched.length).toBe(0);
  });
});

// not going to exhaustively test all of the different medication combinations in all of the different ways it will not match
describe("Medications group", () => {
  test("should match Medication to MedicationRequest based on primary coding and date", () => {
    const bundle1: ResourceAndKey[] = [
      {
        resource: { resourceType: "Medication", id: "medication_bundle1" },
        resourceType: "Medication",
        primaryCode: "102377",
        primaryCodeSystem: "http://www.nlm.nih.gov/research/umls/rxnorm",
        date: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "MedicationRequest",
          id: "medicationrequest_bundle2",
        },
        resourceType: "MedicationRequest",
        primaryCode: "102377",
        primaryCodeSystem: "http://www.nlm.nih.gov/research/umls/rxnorm",
        date: "2021-03-04",
      },
    ];

    const actual = CrossResourcePrimaryCodeDateMatcher(bundle1, bundle2);

    expect(actual.unmatched1.length).toBe(0);
    expect(actual.unmatched2.length).toBe(0);
    expect(actual.matched.length).toBe(1);
    expect(actual.matched[0].bundle1.reference).toBe(
      "Medication/medication_bundle1",
    );
    expect(actual.matched[0].bundle2.reference).toBe(
      "MedicationRequest/medicationrequest_bundle2",
    );
  });

  test("should match Medication to MedicationStatement based on primary coding and date", () => {
    const bundle1: ResourceAndKey[] = [
      {
        resource: { resourceType: "Medication", id: "medication_bundle1" },
        resourceType: "Medication",
        primaryCode: "102377",
        primaryCodeSystem: "http://www.nlm.nih.gov/research/umls/rxnorm",
        date: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "MedicationStatement",
          id: "medicationstatement_bundle2",
        },
        resourceType: "MedicationStatement",
        primaryCode: "102377",
        primaryCodeSystem: "http://www.nlm.nih.gov/research/umls/rxnorm",
        date: "2021-03-04",
      },
    ];

    const actual = CrossResourcePrimaryCodeDateMatcher(bundle1, bundle2);

    expect(actual.unmatched1.length).toBe(0);
    expect(actual.unmatched2.length).toBe(0);
    expect(actual.matched.length).toBe(1);
    expect(actual.matched[0].bundle1.reference).toBe(
      "Medication/medication_bundle1",
    );
    expect(actual.matched[0].bundle2.reference).toBe(
      "MedicationStatement/medicationstatement_bundle2",
    );
  });

  test("should match Medication to MedicationAdministration based on primary coding and date", () => {
    const bundle1: ResourceAndKey[] = [
      {
        resource: { resourceType: "Medication", id: "medication_bundle1" },
        resourceType: "Medication",
        primaryCode: "102377",
        primaryCodeSystem: "http://www.nlm.nih.gov/research/umls/rxnorm",
        date: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "MedicationAdministration",
          id: "medicationadministration_bundle2",
        },
        resourceType: "MedicationAdministration",
        primaryCode: "102377",
        primaryCodeSystem: "http://www.nlm.nih.gov/research/umls/rxnorm",
        date: "2021-03-04",
      },
    ];

    const actual = CrossResourcePrimaryCodeDateMatcher(bundle1, bundle2);

    expect(actual.unmatched1.length).toBe(0);
    expect(actual.unmatched2.length).toBe(0);
    expect(actual.matched.length).toBe(1);
    expect(actual.matched[0].bundle1.reference).toBe(
      "Medication/medication_bundle1",
    );
    expect(actual.matched[0].bundle2.reference).toBe(
      "MedicationAdministration/medicationadministration_bundle2",
    );
  });
});

test("should pass on resources that are cannot be matched cross-resource in unmatched", () => {
  const bundle1: ResourceAndKey[] = [
    {
      resource: { resourceType: "AllergyIntolerance", id: "allergy_bundle1" },
      resourceType: "AllergyIntolerance",
      primaryCode: "371361000119107",
      primaryCodeSystem: "http://snomed.info/sct",
      date: "2021-03-04",
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      resource: { resourceType: "AllergyIntolerance", id: "allergy_bundle2" },
      resourceType: "AllergyIntolerance",
      primaryCode: "371361000119107",
      primaryCodeSystem: "http://snomed.info/sct",
      date: "2021-03-04",
    },
  ];

  const actual = CrossResourcePrimaryCodeDateMatcher(bundle1, bundle2);

  expect(actual.unmatched1).toEqual(bundle1);
  expect(actual.unmatched2).toEqual(bundle2);
});
