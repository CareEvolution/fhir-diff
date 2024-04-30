import * as r4 from "fhir/r4";
import { expect, test, describe } from "vitest";
import { fhirBundlesMatch } from ".";
import { readFileSync } from "fs";
import { join } from "path";
import { FhirMatch } from "./models/fhirMatch";

function expectMatch(match: FhirMatch, bundle1Ref: string, bundle2Ref: string) {
  expect(
    match.common.map((m) => ({
      bundle1Ref: m.bundle1.reference,
      bundle2Ref: m.bundle2.reference,
    })),
  ).toContainEqual({ bundle1Ref, bundle2Ref });
}

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

    const fhirMatch = fhirBundlesMatch(bundle1, bundle2);

    expect(fhirMatch.bundle1Only.length).toBe(0);
    expect(fhirMatch.bundle2Only.length).toBe(0);
    expect(fhirMatch.common.length).toBe(1);
    expect(fhirMatch.common[0].bundle1.reference).toBe("Patient/123");
    expect(fhirMatch.common[0].bundle2.reference).toBe("Patient/abcd");
    expect(fhirMatch.common[0].reason).toBe("identifiers matched");
  });

  describe("should match things between known bundles", () => {
    test("careevolution and microsoft", () => {
      const dataPath = "./data/synthetic";

      const bundle1 = JSON.parse(
        readFileSync(join(dataPath, "careevolution.json"), "utf8"),
      ) as r4.Bundle;
      const bundle2 = JSON.parse(
        readFileSync(join(dataPath, "microsoft.json"), "utf8"),
      ) as r4.Bundle;

      const match = fhirBundlesMatch(bundle1, bundle2);

      for (const ref of match.bundle1Only) {
        console.log(`bundle1Only: ${ref.reference}`);
      }

      for (const ref of match.common) {
        console.log(
          `common: ${ref.bundle1.reference} <=> ${ref.bundle2.reference} [${ref.reason}]`,
        );
      }

      for (const ref of match.bundle2Only) {
        console.log(`bundle2Only: ${ref.reference}`);
      }

      expectMatch(
        match,
        "MedicationRequest/5565ac16-c63c-4314-adab-7d67437ac617",
        "MedicationStatement/193bf286-d45c-a0c6-f366-74f91efc3388",
      );
    });

    test("careevolution and health_samurai", () => {
      const dataPath = "./data/synthetic";

      const bundle1 = JSON.parse(
        readFileSync(join(dataPath, "careevolution.json"), "utf8"),
      ) as r4.Bundle;
      const bundle2 = JSON.parse(
        readFileSync(join(dataPath, "health_samurai_1.json"), "utf8"),
      ) as r4.Bundle;

      const match = fhirBundlesMatch(bundle1, bundle2);

      for (const ref of match.bundle1Only) {
        console.log(`bundle1Only: ${ref.reference}`);
      }

      for (const ref of match.common) {
        console.log(
          `common: ${ref.bundle1.reference} <=> ${ref.bundle2.reference} [${ref.reason}]`,
        );
      }

      for (const ref of match.bundle2Only) {
        console.log(`bundle2Only: ${ref.reference}`);
      }
    });
  });
});
