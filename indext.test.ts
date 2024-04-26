import * as index from "./index";
import * as r4 from "fhir/r4";
import { expect, test, describe } from "vitest";

describe("buildRef", () => {
  test("should return a reference", () => {
    const resource: r4.Patient = {
      id: "123",
      resourceType: "Patient",
    };

    const ref = index.buildRef(resource);
    expect(ref).toBe("Patient/123");
  });
});
