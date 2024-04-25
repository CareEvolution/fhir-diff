import * as r4 from "fhir/r4";
import { FhirMatch } from "./models/fhir_match";
import { ResourceAndKey } from "./models/resource_and_key";

function pick_identifier(identifier?: r4.Identifier[]): string | undefined {
  if (!identifier || identifier.length === 0) {
    return undefined;
  }

  return (
    identifier.find((i) => i.use === "usual")?.value ||
    identifier.find((i) => i.use === "official")?.value ||
    identifier[0].value
  );
}

function pick_primary_coding(
  codeableConcept: r4.CodeableConcept,
  preferredSystems: string[]
): r4.Coding | undefined {
  if (!codeableConcept.coding) {
    console.log("no coding");
    return undefined;
  }

  const userSelected = codeableConcept.coding?.find((c) => c.userSelected);

  if (userSelected) {
    console.log("user selected");
    return userSelected;
  }

  const preferredSystem = codeableConcept.coding?.find((c) =>
    preferredSystems.includes(c.system!)
  );

  if (preferredSystem) {
    console.log("preferred system");
    return preferredSystem;
  }

  console.log("first");

  return codeableConcept.coding?.[0];
}

function build_keys(bundle: r4.Bundle): ResourceAndKey[] {
  const keys: ResourceAndKey[] = [];

  for (let entry of bundle.entry || []) {
    if (!entry?.resource?.resourceType) {
      continue;
    }
    switch (entry.resource.resourceType) {
      case "Patient":
        keys.push({
          resource: entry.resource,
          resourceType: "Patient",
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
        });
        break;
      case "Encounter":
        const primary_coding = entry.resource.class;
        keys.push({
          resource: entry.resource,
          resourceType: "Encounter",
          identifier:
            pick_identifier(entry.resource.identifier) || entry.resource.id,
          primary_code_system: primary_coding?.system,
          primary_code: primary_coding?.code,
          date: entry.resource.period?.start,
        });
        break;
      default:
        console.log("Unhandled resource type: " + entry.resource.resourceType);
        break;
    }
  }

  return keys;
}

function build_reference(resource: ResourceAndKey): r4.Reference {
  return {
    reference: `${resource.resourceType}/${resource.resource.id}`,
  };
}

function find_match_index(
  target: ResourceAndKey,
  candidates: ResourceAndKey[]
): number {
  return candidates.findIndex(
    (k) =>
      k.resourceType === target.resourceType &&
      k.identifier === target.identifier &&
      k.primary_code_system === target.primary_code_system &&
      k.primary_code === target.primary_code &&
      k.date === target.date
  );
}

export function fhir_bundles_match(
  bundle1: r4.Bundle,
  bundle2: r4.Bundle
): FhirMatch {
  var bundle1Keys = build_keys(bundle1);
  var bundle2Keys = build_keys(bundle2);

  const bundle1Only: ResourceAndKey[] = [];
  const bundle2Only: ResourceAndKey[] = [];
  const common: { bundle1: ResourceAndKey; bundle2: ResourceAndKey }[] = [];

  for (let bundle1Key of bundle1Keys) {
    const matchIndex = find_match_index(bundle1Key, bundle2Keys);
    if (matchIndex === -1) {
      bundle1Only.push(bundle1Key);
    } else {
      common.push({ bundle1: bundle1Key, bundle2: bundle2Keys[matchIndex] });
      bundle2Keys.splice(matchIndex, 1);
    }
  }

  bundle2Only.push(...bundle2Keys);

  return {
    bundle1Only: bundle1Only.map(build_reference),
    bundle2Only: bundle2Only.map(build_reference),
    common: common.map((r) => ({
      bundle1: build_reference(r.bundle1),
      bundle2: build_reference(r.bundle2),
    })),
  };
}
