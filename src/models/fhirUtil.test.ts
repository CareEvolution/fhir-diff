import type { CodeableConcept, BundleEntry } from 'fhir/r4';
import { expect, test, describe } from '@jest/globals';
import { buildFhirReference, pickPrimaryCoding } from './fhirUtil';

describe('buildFhirReference', () => {
  test('should return local reference if the resource has an id', () => {
    const entry: BundleEntry = {
      fullUrl: 'http://example.com/patient/123',
      resource: {
        id: '123',
        resourceType: 'Patient',
        identifier: [
          {
            system: 'http://example.com/mrns',
            value: '123456',
          },
        ],
      },
    };

    const actual = buildFhirReference(entry);
    expect(actual).toEqual({ reference: 'Patient/123', type: 'Patient' });
  });

  test('should return full url and type if the resource has no id', () => {
    const entry: BundleEntry = {
      fullUrl: 'http://example.com/patient/123',
      resource: {
        resourceType: 'Patient',
        identifier: [
          {
            system: 'http://example.com/mrns',
            value: '123456',
          },
        ],
      },
    };

    const actual = buildFhirReference(entry);
    expect(actual).toEqual({
      reference: 'http://example.com/patient/123',
      type: 'Patient',
    });
  });

  test('should return identifier and type if the resource has no id', () => {
    const entry: BundleEntry = {
      resource: {
        resourceType: 'Patient',
        identifier: [
          {
            system: 'http://example.com/mrns',
            value: '123456',
          },
        ],
      },
    };

    const actual = buildFhirReference(entry);
    expect(actual).toEqual({
      identifier: { system: 'http://example.com/mrns', value: '123456' },
      type: 'Patient',
    });
  });

  test('should return undefined if there is nothing to identify the resource', () => {
    const entry: BundleEntry = {
      resource: {
        resourceType: 'Patient',
      },
    };

    const actual = buildFhirReference(entry);
    expect(actual).toBeUndefined();
  });
});

describe('pickPrimaryCoding', () => {
  test('should return the first coding with userSelected: true', () => {
    const codeableConcept: CodeableConcept = {
      coding: [
        { system: 'thinger', code: 'foobar', userSelected: true },
        {
          system: 'http://loinc.org',
          code: '1234-5',
        },
        {
          system: 'http://snomed.info/sct',
          code: '98764',
        },
      ],
    };

    const actual = pickPrimaryCoding(codeableConcept, ['http://loinc.org']);

    expect(actual).toEqual({
      system: 'thinger',
      code: 'foobar',
      userSelected: true,
    });
  });

  test('should return the first coding with a preferred system if there are none with userSelected: true', () => {
    const codeableConcept: CodeableConcept = {
      coding: [
        { system: 'thinger', code: 'foobar' },
        {
          system: 'http://loinc.org',
          code: '1234-5',
        },
        {
          system: 'http://snomed.info/sct',
          code: '98764',
        },
      ],
    };

    const actual = pickPrimaryCoding(codeableConcept, ['http://loinc.org']);

    expect(actual).toEqual({
      system: 'http://loinc.org',
      code: '1234-5',
    });
  });

  test('should return the first coding if there are none in a preffered system and none are userSelected', () => {
    const codeableConcept: CodeableConcept = {
      coding: [
        {
          system: 'http://loinc.org',
          code: '1234-5',
        },
        {
          system: 'http://snomed.info/sct',
          code: '98764',
        },
      ],
    };

    const actual = pickPrimaryCoding(codeableConcept, ['http://foo.com']);

    expect(actual).toEqual({
      system: 'http://loinc.org',
      code: '1234-5',
    });
  });
});
