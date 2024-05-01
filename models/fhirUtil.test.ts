import * as r4 from "fhir/r4";
import { expect, test, describe } from "@jest/globals";
import { buildRef } from "./fhirUtil";

describe("buildRef", () => {
  test("should return a reference", () => {
    const resource: r4.Patient = {
      id: "123",
      resourceType: "Patient",
    };

    const ref = buildRef(resource);
    expect(ref).toBe("Patient/123");
  });
});
