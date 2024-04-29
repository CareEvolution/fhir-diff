import * as fs from "fs";
import * as path from "path";
import * as r4 from "fhir/r4";
import { fhirBundlesMatch } from ".";

const dataPath = "./data/synthetic";

const bundle1 = JSON.parse(
  fs.readFileSync(path.join(dataPath, "careevolution.json"), "utf8"),
) as r4.Bundle;
const bundle2 = JSON.parse(
  fs.readFileSync(path.join(dataPath, "microsoft.json"), "utf8"),
) as r4.Bundle;

const match = fhirBundlesMatch(bundle1, bundle2);

for (const ref of match.bundle1Only) {
  console.log(`bundle1Only: ${ref.reference}`);
}

for (const ref of match.common) {
  console.log(`common: ${ref.bundle1.reference} <=> ${ref.bundle2.reference}`);
}

for (const ref of match.bundle2Only) {
  console.log(`bundle2Only: ${ref.reference}`);
}
