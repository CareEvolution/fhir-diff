import { expect, test, describe } from "@jest/globals";
import { CrossResourceTextMatcher } from "./crossResourceTextMatcher";
import { ResourceAndKey } from "../models/resourceAndKey";

describe("Labs group", () => {
  test("should match Observation to DiagnosticReport based on primary coding and date", () => {
    const bundle1: ResourceAndKey[] = [
      {
        resource: { resourceType: "Observation", id: "observation_bundle1" },
        resourceType: "Observation",
        text: "cbc",
        dateTime: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "DiagnosticReport",
          id: "diagnosticreport_bundle2",
        },
        resourceType: "DiagnosticReport",
        text: "cbc",
        dateTime: "2021-03-04",
      },
    ];

    const actual = CrossResourceTextMatcher(bundle1, bundle2);

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
        text: "cbc",
        dateTime: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: { resourceType: "Observation", id: "observation_bundle2" },
        resourceType: "Observation",
        text: "cbc",
        dateTime: "2021-03-04",
      },
    ];

    const actual = CrossResourceTextMatcher(bundle1, bundle2);

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
        text: "cbc",
        dateTime: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "DiagnosticReport",
          id: "diagnosticreport_bundle2",
        },
        resourceType: "DiagnosticReport",
        text: "cbc",
        dateTime: "2021-03-05",
      },
    ];

    const actual = CrossResourceTextMatcher(bundle1, bundle2);

    expect(actual.unmatched1.length).toBe(1);
    expect(actual.unmatched1[0]).toBe(bundle1[0]);
    expect(actual.unmatched2.length).toBe(1);
    expect(actual.unmatched2[0]).toBe(bundle2[0]);
    expect(actual.matched.length).toBe(0);
  });

  test("should not match based on different text", () => {
    const bundle1: ResourceAndKey[] = [
      {
        resource: { resourceType: "Observation", id: "observation_bundle1" },
        resourceType: "Observation",
        text: "cbc",
        dateTime: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "DiagnosticReport",
          id: "diagnosticreport_bundle2",
        },
        resourceType: "DiagnosticReport",
        text: "cmp",
        dateTime: "2021-03-04",
      },
    ];

    const actual = CrossResourceTextMatcher(bundle1, bundle2);

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
        text: "cbc",
        dateTime: undefined,
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "DiagnosticReport",
          id: "diagnosticreport_bundle2",
        },
        resourceType: "DiagnosticReport",
        text: "cbc",
        dateTime: undefined,
      },
    ];

    const actual = CrossResourceTextMatcher(bundle1, bundle2);

    expect(actual.unmatched1.length).toBe(1);
    expect(actual.unmatched1[0]).toBe(bundle1[0]);
    expect(actual.unmatched2.length).toBe(1);
    expect(actual.unmatched2[0]).toBe(bundle2[0]);
    expect(actual.matched.length).toBe(0);
  });

  test("should not match missing text", () => {
    const bundle1: ResourceAndKey[] = [
      {
        resource: { resourceType: "Observation", id: "observation_bundle1" },
        resourceType: "Observation",
        text: undefined,
        dateTime: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "DiagnosticReport",
          id: "diagnosticreport_bundle2",
        },
        resourceType: "DiagnosticReport",
        text: undefined,
        dateTime: "2021-03-04",
      },
    ];

    const actual = CrossResourceTextMatcher(bundle1, bundle2);

    expect(actual.unmatched1.length).toBe(1);
    expect(actual.unmatched1[0]).toBe(bundle1[0]);
    expect(actual.unmatched2.length).toBe(1);
    expect(actual.unmatched2[0]).toBe(bundle2[0]);
    expect(actual.matched.length).toBe(0);
  });
});

// not going to exhaustively test all of the different medication combinations in all of the different ways it will not match
describe("Medications group", () => {
  test("should match Medication to MedicationRequest based on text and date", () => {
    const bundle1: ResourceAndKey[] = [
      {
        resource: { resourceType: "Medication", id: "medication_bundle1" },
        resourceType: "Medication",
        text: "albuterol inhaler",
        dateTime: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "MedicationRequest",
          id: "medicationrequest_bundle2",
        },
        resourceType: "MedicationRequest",
        text: "albuterol inhaler",
        dateTime: "2021-03-04",
      },
    ];

    const actual = CrossResourceTextMatcher(bundle1, bundle2);

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
        text: "albuterol inhaler",
        dateTime: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "MedicationStatement",
          id: "medicationstatement_bundle2",
        },
        resourceType: "MedicationStatement",
        text: "albuterol inhaler",
        dateTime: "2021-03-04",
      },
    ];

    const actual = CrossResourceTextMatcher(bundle1, bundle2);

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
        text: "albuterol inhaler",
        dateTime: "2021-03-04",
      },
    ];

    const bundle2: ResourceAndKey[] = [
      {
        resource: {
          resourceType: "MedicationAdministration",
          id: "medicationadministration_bundle2",
        },
        resourceType: "MedicationAdministration",
        text: "albuterol inhaler",
        dateTime: "2021-03-04",
      },
    ];

    const actual = CrossResourceTextMatcher(bundle1, bundle2);

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
      dateTime: "2021-03-04",
      text: "allergy to peanuts",
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      resource: { resourceType: "AllergyIntolerance", id: "allergy_bundle2" },
      resourceType: "AllergyIntolerance",
      primaryCode: "371361000119107",
      primaryCodeSystem: "http://snomed.info/sct",
      dateTime: "2021-03-04",
      text: "allergy to peanuts",
    },
  ];

  const actual = CrossResourceTextMatcher(bundle1, bundle2);

  expect(actual.unmatched1).toEqual([...bundle1]);
  expect(actual.unmatched2).toEqual([...bundle2]);
});
