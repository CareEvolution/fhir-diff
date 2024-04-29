import { KeyStore } from "./keyStore";
import * as r4 from "fhir/r4";
import { expect, test, describe } from "vitest";

describe("buildKeyPatient", () => {
  test("should find an identifier", () => {
    const patient: r4.Patient = {
      id: "123",
      resourceType: "Patient",
      identifier: [
        {
          system: "http://example.com",
          value: "123456",
        },
      ],
    };

    const keyStore = new KeyStore();
    const key = keyStore.buildKeyPatient(patient);

    expect(key.identifier).toBe("123456");
  });
});
