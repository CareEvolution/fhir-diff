import * as r4 from "fhir/r4";
import { expect, test, describe } from "vitest";
import { fhirBundlesMatch } from ".";

describe("fhirBundlesMatch", () => {
  test("should match things between bundles", () => {
    const bundle1: r4.Bundle = {
      resourceType: "Bundle",
      entry: [
        {
          resource: {
            id: "123",
            resourceType: "Patient",
            identifier: [
              {
                system: "http://example.com",
                value: "123456",
              },
            ],
          },
        },
      ],
      type: "batch",
    };

    const bundle2: r4.Bundle = {
      resourceType: "Bundle",
      entry: [
        {
          resource: {
            id: "abcd",
            resourceType: "Patient",
            identifier: [
              {
                system: "http://example.com",
                value: "123456",
              },
            ],
          },
        },
      ],
      type: "batch",
    };

    const ref = fhirBundlesMatch(bundle1, bundle2);

    console.log(ref);

    expect(ref.bundle1Only.length).toBe(0);
    expect(ref.bundle2Only.length).toBe(0);
    expect(ref.common.length).toBe(1);
    expect(ref.common[0].bundle1.reference).toBe("Patient/123");
    expect(ref.common[0].bundle2.reference).toBe("Patient/abcd");
    expect(ref.common[0].reason).toBe("identifiers matched");
  });
});
