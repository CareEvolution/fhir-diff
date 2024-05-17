import type { Patient, CodeableConcept } from 'fhir/r4';
import { expect, test, describe } from '@jest/globals';
import { buildRef, pickPrimaryCoding } from './fhirUtil';

describe('buildRef', () => {
  test('should return a reference', () => {
    const resource: Patient = {
      id: '123',
      resourceType: 'Patient',
    };

    const ref = buildRef(resource);
    expect(ref).toBe('Patient/123');
  });
});

describe('pickPrimaryCoding', () => {
  test('should return the first coding with a preferred system', () => {
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
      system: 'http://loinc.org',
      code: '1234-5',
    });
  });

  test('should return the first coding with userSelected if there are none in a preferred system', () => {
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

    const actual = pickPrimaryCoding(codeableConcept, ['http://foo.com']);

    expect(actual).toEqual({
      system: 'thinger',
      code: 'foobar',
      userSelected: true,
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
