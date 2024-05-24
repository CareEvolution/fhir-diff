import { expect, test } from '@jest/globals';
import { BinaryMatcher } from './binaryMatcher';
import { ResourceAndKey } from '../models/resourceAndKey';

test('should match based on contentType and data', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Binary/binary_bundle1' },
      resource: { resourceType: 'Binary', id: 'binary_bundle1' },
      resourceType: 'Binary',
      primaryCode: 'text/html',
      text: 'SGVsbG8=',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Binary/binary_bundle2' },
      resource: { resourceType: 'Binary', id: 'binary_bundle2' },
      resourceType: 'Binary',
      primaryCode: 'text/html',
      text: 'SGVsbG8=',
    },
  ];

  const actual = BinaryMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(0);
  expect(actual.unmatched2.length).toBe(0);
  expect(actual.matched.length).toBe(1);
  expect(actual.matched[0].bundle1.reference).toBe('Binary/binary_bundle1');
  expect(actual.matched[0].bundle2.reference).toBe('Binary/binary_bundle2');
});

test('should not match based on different contentType', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Binary/binary_bundle1' },
      resource: { resourceType: 'Binary', id: 'binary_bundle1' },
      resourceType: 'Binary',
      primaryCode: 'text/html', // from the contentType property
      text: 'SGVsbG8=',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Binary/binary_bundle2' },
      resource: { resourceType: 'Binary', id: 'binary_bundle2' },
      resourceType: 'Binary',
      primaryCode: 'text/plain', // from the contentType property
      text: 'SGVsbG8=',
    },
  ];

  const actual = BinaryMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.matched.length).toBe(0);
});

test('should not match based on different data', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Binary/binary_bundle1' },
      resource: { resourceType: 'Binary', id: 'binary_bundle1' },
      resourceType: 'Binary',
      primaryCode: 'text/html',
      text: 'SGVsbG8=',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Binary/binary_bundle2' },
      resource: { resourceType: 'Binary', id: 'binary_bundle2' },
      resourceType: 'Binary',
      primaryCode: 'text/html',
      text: 'foobar',
    },
  ];

  const actual = BinaryMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.matched.length).toBe(0);
});
