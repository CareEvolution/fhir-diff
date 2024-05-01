import { expect, test } from "@jest/globals";
import { IdentifierMatcher } from "./identifierMatcher";
import { ResourceAndKey } from "../models/resourceAndKey";

test("should match based on identifier with same resource type", () => {
  const bundle1: ResourceAndKey[] = [
    {
      resource: { resourceType: "Patient", id: "patient_bundle1" },
      resourceType: "Patient",
      identifier: "123456",
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      resource: { resourceType: "Patient", id: "patient_bundle2" },
      resourceType: "Patient",
      identifier: "123456",
    },
  ];

  const actual = IdentifierMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(0);
  expect(actual.unmatched2.length).toBe(0);
  expect(actual.matched.length).toBe(1);
  expect(actual.matched[0].bundle1.reference).toBe("Patient/patient_bundle1");
  expect(actual.matched[0].bundle2.reference).toBe("Patient/patient_bundle2");
});

test("should not match based on identifier with different resource type", () => {
  const bundle1: ResourceAndKey[] = [
    {
      resource: { resourceType: "Encounter", id: "encounter_bundle1" },
      resourceType: "Encounter",
      identifier: "123456",
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      resource: { resourceType: "Patient", id: "patient_bundle2" },
      resourceType: "Patient",
      identifier: "123456",
    },
  ];

  const actual = IdentifierMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched1[0]).toBe(bundle1[0]);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.unmatched2[0]).toBe(bundle2[0]);
  expect(actual.matched.length).toBe(0);
});
