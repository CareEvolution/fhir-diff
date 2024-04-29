import { buildReference } from "../models/fhirUtil";
import { ResourceAndKey } from "../models/resourceAndKey";
import { getResourceTypeGroup } from "./getResourceTypeGroup";
import { MatchResult, Matcher } from "./matcher";

const CrossResourceTextMatcher: Matcher = (
  bundle1: ResourceAndKey[],
  bundle2: ResourceAndKey[],
) => {
  const result: MatchResult = {
    unmatched1: [],
    unmatched2: [],
    matched: [],
  };

  bundle2 = [...bundle2];

  for (let bundle1Index = 0; bundle1Index < bundle1.length; bundle1Index++) {
    const bundle1Key = bundle1[bundle1Index];

    if (!bundle1Key.date || !bundle1Key.text) {
      result.unmatched1.push(bundle1Key);
      continue;
    }

    const resourceTypeGroup = getResourceTypeGroup(bundle1Key.resourceType);

    if (!resourceTypeGroup) continue;

    const bundle2Key = bundle2.findIndex(
      (k) =>
        resourceTypeGroup.includes(k.resourceType) &&
        k.date == bundle1Key.date &&
        k.text == bundle1Key.text,
    );

    if (bundle2Key === -1) {
      result.unmatched1.push(bundle1Key);
    } else {
      result.matched.push({
        bundle1: buildReference(bundle1Key),
        bundle2: buildReference(bundle2[bundle2Key]),
        reason: "cross-reference text matched",
      });
      bundle2.splice(bundle2Key, 1);
    }
  }

  result.unmatched2 = bundle2;

  return result;
};

export { CrossResourceTextMatcher };
