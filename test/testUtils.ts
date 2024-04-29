import * as r4 from "fhir/r4";

export function fhirR4Bundle(resources: r4.Resource[]): r4.Bundle {
  return {
    resourceType: "Bundle",
    entry: resources.map((resource) => ({ resource }) as r4.BundleEntry),
    type: "batch",
  };
}
