import { expect, test } from '@jest/globals';
import { TextMatcher } from './textMatcher';
import { ResourceAndKey } from '../models/resourceAndKey';

test('should match based on text and date and resource type', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle1' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle1' },
      resourceType: 'Procedure',
      text: 'Colonoscopy went well',
      dateTime: '2021-03-04',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle2' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle2' },
      resourceType: 'Procedure',
      text: 'Colonoscopy went well',
      dateTime: '2021-03-04',
    },
  ];

  const actual = TextMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(0);
  expect(actual.unmatched2.length).toBe(0);
  expect(actual.matched.length).toBe(1);
  expect(actual.matched[0].bundle1.reference).toBe(
    'Procedure/procedure_bundle1',
  );
  expect(actual.matched[0].bundle2.reference).toBe(
    'Procedure/procedure_bundle2',
  );
});

test('should not match based on different date', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle1' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle1' },
      resourceType: 'Procedure',
      text: 'Colonoscopy went well',
      dateTime: '2021-03-04',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle2' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle2' },
      resourceType: 'Procedure',
      text: 'Colonoscopy went well',
      dateTime: '2021-03-05',
    },
  ];

  const actual = TextMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched1[0]).toBe(bundle1[0]);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.unmatched2[0]).toBe(bundle2[0]);
  expect(actual.matched.length).toBe(0);
});

test('should not match based on different resourceType', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle1' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle1' },
      resourceType: 'Procedure',
      text: 'Colonoscopy went well',
      dateTime: '2021-03-04',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Observation/observation_bundle2' },
      resource: { resourceType: 'Observation', id: 'observation_bundle2' },
      resourceType: 'Observation',
      text: 'Colonoscopy went well',
      dateTime: '2021-03-04',
    },
  ];

  const actual = TextMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched1[0]).toBe(bundle1[0]);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.unmatched2[0]).toBe(bundle2[0]);
  expect(actual.matched.length).toBe(0);
});

test('should not match based on different text', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle1' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle1' },
      resourceType: 'Procedure',
      text: 'Colonoscopy went well',
      dateTime: '2021-03-04',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle2' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle2' },
      resourceType: 'Procedure',
      text: 'Venipuncture',
      dateTime: '2021-03-04',
    },
  ];

  const actual = TextMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched1[0]).toBe(bundle1[0]);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.unmatched2[0]).toBe(bundle2[0]);
  expect(actual.matched.length).toBe(0);
});
