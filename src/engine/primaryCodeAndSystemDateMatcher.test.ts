import { expect, test } from '@jest/globals';
import { PrimaryCodeAndSystemDateMatcher } from './primaryCodeAndSystemDateMatcher';
import { ResourceAndKey } from '../models/resourceAndKey';

test('should match based on primary coding and date and resource type', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle1' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle1' },
      resourceType: 'Procedure',
      primaryCode: '142496001',
      primaryCodeSystem: 'http://snomed.info/sct',
      date: '2021-03-04',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle2' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle2' },
      resourceType: 'Procedure',
      primaryCode: '142496001',
      primaryCodeSystem: 'http://snomed.info/sct',
      date: '2021-03-04',
    },
  ];

  const actual = PrimaryCodeAndSystemDateMatcher(bundle1, bundle2);

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
      primaryCode: '142496001',
      primaryCodeSystem: 'http://snomed.info/sct',
      date: '2021-03-04',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle2' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle2' },
      resourceType: 'Procedure',
      primaryCode: '142496001',
      primaryCodeSystem: 'http://snomed.info/sct',
      date: '2021-03-05',
    },
  ];

  const actual = PrimaryCodeAndSystemDateMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched1[0]).toBe(bundle1[0]);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.unmatched2[0]).toBe(bundle2[0]);
  expect(actual.matched.length).toBe(0);
});

test('should not match based on different code', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle1' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle1' },
      resourceType: 'Procedure',
      primaryCode: '142496001',
      primaryCodeSystem: 'http://snomed.info/sct',
      date: '2021-03-04',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle2' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle2' },
      resourceType: 'Procedure',
      primaryCode: '22778000',
      primaryCodeSystem: 'http://snomed.info/sct',
      date: '2021-03-04',
    },
  ];

  const actual = PrimaryCodeAndSystemDateMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched1[0]).toBe(bundle1[0]);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.unmatched2[0]).toBe(bundle2[0]);
  expect(actual.matched.length).toBe(0);
});

test('should not match based on different system', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle1' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle1' },
      resourceType: 'Procedure',
      primaryCode: '142496001',
      primaryCodeSystem: 'http://snomed.info/sct',
      date: '2021-03-04',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle2' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle2' },
      resourceType: 'Procedure',
      primaryCode: '142496001',
      primaryCodeSystem: 'something not snomed',
      date: '2021-03-04',
    },
  ];

  const actual = PrimaryCodeAndSystemDateMatcher(bundle1, bundle2);

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
      primaryCode: '142496001',
      primaryCodeSystem: 'http://snomed.info/sct',
      date: '2021-03-04',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Observation/observation_bundle2' },
      resource: { resourceType: 'Observation', id: 'observation_bundle2' },
      resourceType: 'Observation',
      primaryCode: '142496001',
      primaryCodeSystem: 'http://snomed.info/sct',
      date: '2021-03-04',
    },
  ];

  const actual = PrimaryCodeAndSystemDateMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched1[0]).toBe(bundle1[0]);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.unmatched2[0]).toBe(bundle2[0]);
  expect(actual.matched.length).toBe(0);
});

test('should not match missing dates', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle1' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle1' },
      resourceType: 'Procedure',
      primaryCode: '142496001',
      primaryCodeSystem: 'http://snomed.info/sct',
      date: undefined,
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle2' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle2' },
      resourceType: 'Procedure',
      primaryCode: '142496001',
      primaryCodeSystem: 'http://snomed.info/sct',
      date: undefined,
    },
  ];

  const actual = PrimaryCodeAndSystemDateMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched1[0]).toBe(bundle1[0]);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.unmatched2[0]).toBe(bundle2[0]);
  expect(actual.matched.length).toBe(0);
});

test('should not match missing system', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle1' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle1' },
      resourceType: 'Procedure',
      primaryCode: '142496001',
      primaryCodeSystem: undefined,
      dateTime: '2021-03-04',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle2' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle2' },
      resourceType: 'Procedure',
      primaryCode: '142496001',
      primaryCodeSystem: undefined,
      date: '2021-03-04',
    },
  ];

  const actual = PrimaryCodeAndSystemDateMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched1[0]).toBe(bundle1[0]);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.unmatched2[0]).toBe(bundle2[0]);
  expect(actual.matched.length).toBe(0);
});

test('should not match missing code', () => {
  const bundle1: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle1' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle1' },
      resourceType: 'Procedure',
      primaryCode: undefined,
      primaryCodeSystem: 'http://snomed.info/sct',
      date: '2021-03-04',
    },
  ];

  const bundle2: ResourceAndKey[] = [
    {
      reference: { reference: 'Procedure/procedure_bundle2' },
      resource: { resourceType: 'Procedure', id: 'procedure_bundle2' },
      resourceType: 'Procedure',
      primaryCode: undefined,
      primaryCodeSystem: 'http://snomed.info/sct',
      date: '2021-03-04',
    },
  ];

  const actual = PrimaryCodeAndSystemDateMatcher(bundle1, bundle2);

  expect(actual.unmatched1.length).toBe(1);
  expect(actual.unmatched1[0]).toBe(bundle1[0]);
  expect(actual.unmatched2.length).toBe(1);
  expect(actual.unmatched2[0]).toBe(bundle2[0]);
  expect(actual.matched.length).toBe(0);
});
