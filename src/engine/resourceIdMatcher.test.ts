import { expect, test } from '@jest/globals';
import { ResourceIdMatcher } from './resourceIdMatcher';
import { ResourceAndKey } from '../models/resourceAndKey';

test('should match based on id with same resource type', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Patient/123456789' },
      resource: { resourceType: 'Patient', id: '123456789' },
      resourceType: 'Patient',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Patient/123456789' },
      resource: { resourceType: 'Patient', id: '123456789' },
      resourceType: 'Patient',
    },
  ];

  const actual = ResourceIdMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(0);
  expect(actual.unmatched2.length).toBe(0);
  expect(actual.matched.length).toBe(1);
  expect(actual.matched[0].bundle1.reference).toBe('Patient/123456789');
  expect(actual.matched[0].bundle2.reference).toBe('Patient/123456789');
});

test('should not match based on same id with different resource type', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Patient/patient_bundle1' },
      resource: { resourceType: 'Encounter', id: '123456789' },
      resourceType: 'Encounter',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Patient/patient_bundle2' },
      resource: { resourceType: 'Patient', id: '123456789' },
      resourceType: 'Patient',
    },
  ];

  const actual = ResourceIdMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched1[0]).toBe(bundle1[0]);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.unmatched2[0]).toBe(bundle2[0]);
  expect(actual.matched.length).toBe(0);
});

test('should not match based on no ids', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'http://example.com/mrn/123456' },
      resource: { resourceType: 'Patient' },
      resourceType: 'Patient',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'http://example.com/mrn/987654' },
      resource: { resourceType: 'Patient' },
      resourceType: 'Patient',
    },
  ];

  const actual = ResourceIdMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched1[0]).toBe(bundle1[0]);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.unmatched2[0]).toBe(bundle2[0]);
  expect(actual.matched.length).toBe(0);
});
