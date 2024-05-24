import { ResourceAndKey } from '../models/resourceAndKey';
import { getResourceTypeGroup } from './getResourceTypeGroup';
import { MatchResult, Matcher } from './matcher';

const CrossResourceTextMatcher: Matcher = (
  bundle1: ResourceAndKey[],
  bundle2: ResourceAndKey[],
) => {
  const result: MatchResult = {
    unmatched1: [],
    unmatched2: [],
    matched: [],
  };

  const bundle2Copy = [...bundle2];

  for (let bundle1Index = 0; bundle1Index < bundle1.length; bundle1Index++) {
    const bundle1Key = bundle1[bundle1Index];

    if (!bundle1Key.dateTime || !bundle1Key.text) {
      result.unmatched1.push(bundle1Key);
      continue;
    }

    const resourceTypeGroup = getResourceTypeGroup(bundle1Key.resourceType);

    if (!resourceTypeGroup) {
      result.unmatched1.push(bundle1Key);
      continue;
    }

    const bundle2Key = bundle2Copy.findIndex(
      (k) =>
        resourceTypeGroup.includes(k.resourceType) &&
        k.dateTime === bundle1Key.dateTime &&
        k.text === bundle1Key.text,
    );

    if (bundle2Key === -1) {
      result.unmatched1.push(bundle1Key);
    } else {
      result.matched.push({
        bundle1: bundle1Key.reference,
        bundle2: bundle2Copy[bundle2Key].reference,
        reason: 'cross-reference text + dateTime matched',
      });
      bundle2Copy.splice(bundle2Key, 1);
    }
  }

  result.unmatched2 = bundle2Copy;

  return result;
};

export { CrossResourceTextMatcher };
