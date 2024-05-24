import { Bundle } from 'fhir/r4';
import { FhirMatch } from './models/fhirMatch';
import { KeyStore } from './models/keyStore';
import { Matcher } from './engine/matcher';
import { IdentifierMatcher } from './engine/identifierMatcher';
import { BinaryMatcher } from './engine/binaryMatcher';
import { PrimaryCodeAndSystemMatcher } from './engine/primaryCodeAndSystemMatcher';
import { TextMatcher } from './engine/textMatcher';
import { ValueMatcher } from './engine/valueMatcher';
import { PrimaryCodeMatcher } from './engine/primaryCodeMatcher';
import { CrossResourceNaturalKeyMatcher } from './engine/crossResourceNaturalKeyMatcher';
import { CrossResourceNaturalKeyDateMatcher } from './engine/crossResourceNaturalKeyDateMatcher';
import { CrossResourceTextMatcher } from './engine/crossResourceTextMatcher';
import { PrimaryCodeAndSystemDateMatcher } from './engine/primaryCodeAndSystemDateMatcher';
import { PrimaryCodeDateMatcher } from './engine/primaryCodeDateMatcher';
import { CrossResourcePrimaryCodeDateMatcher } from './engine/crossResourcePrimaryCodeDateMatcher';
import { ResourceIdMatcher } from './engine/resourceIdMatcher';

export const fhirBundlesMatch = (
  bundle1: Bundle,
  bundle2: Bundle,
  debug: boolean = false,
): FhirMatch => {
  if (debug) {
    console.log('--- bundle1 ---');
  }
  const bundle1KeyStore = new KeyStore(bundle1);

  if (debug) {
    bundle1KeyStore.all.forEach((key) => console.log(key));
    console.log('--- bundle2 ---');
  }
  const bundle2KeyStore = new KeyStore(bundle2);
  if (debug) {
    bundle2KeyStore.all.forEach((key) => console.log(key));
    console.log('--- matching ---');
  }

  const overallMatch: FhirMatch = {
    bundle1Only: [],
    bundle2Only: [],
    common: [],
    bundle1Store: bundle1KeyStore,
    bundle2Store: bundle2KeyStore,
  };

  const matchers: Matcher[] = [
    ResourceIdMatcher,
    IdentifierMatcher,
    BinaryMatcher,
    PrimaryCodeAndSystemMatcher,
    TextMatcher,
    ValueMatcher,
    PrimaryCodeMatcher,
    PrimaryCodeAndSystemDateMatcher,
    PrimaryCodeDateMatcher,
    CrossResourceNaturalKeyMatcher,
    CrossResourceTextMatcher,
    CrossResourceNaturalKeyDateMatcher,
    CrossResourcePrimaryCodeDateMatcher,
  ];

  let unmatchedBundle1 = bundle1KeyStore.all;
  let unmatchedBundle2 = bundle2KeyStore.all;

  // eslint-disable-next-line no-restricted-syntax
  for (const matcher of matchers) {
    const result = matcher(unmatchedBundle1, unmatchedBundle2);

    overallMatch.common.push(...result.matched);

    unmatchedBundle1 = result.unmatched1;
    unmatchedBundle2 = result.unmatched2;

    if (
      overallMatch.common.length + unmatchedBundle1.length !==
      bundle1KeyStore.all.length
    ) {
      throw new Error(`lost resource from bundle1 in ${matcher.name}`);
    }

    if (
      overallMatch.common.length + unmatchedBundle2.length !==
      bundle2KeyStore.all.length
    ) {
      throw new Error(`lost resource from bundle2 in ${matcher.name}`);
    }

    if (result.unmatched1.length === 0 || result.unmatched2.length === 0) {
      break;
    }
  }

  overallMatch.bundle1Only = unmatchedBundle1.map((x) => x.reference);
  overallMatch.bundle2Only = unmatchedBundle2.map((x) => x.reference);

  return overallMatch;
};
