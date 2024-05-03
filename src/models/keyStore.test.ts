import { KeyStore } from './keyStore';
import * as r4 from 'fhir/r4';
import { expect, test, describe } from '@jest/globals';

describe('constructor', () => {
  test('should find an identifier', () => {
    const patient: r4.Patient = {
      id: '123',
      resourceType: 'Patient',
      identifier: [
        {
          system: 'http://example.com',
          value: '123456',
        },
      ],
    };

    const keyStore = new KeyStore({
      resourceType: 'Bundle',
      entry: [
        {
          resource: patient,
        },
      ],
      type: 'batch',
    });
    const key = keyStore.all[0];

    expect(key.identifier).toBe('123456');
  });

  test('should find coding for MedicationStatement on linked Medication resource', () => {
    const medicationStatement: r4.MedicationStatement = {
      id: '123',
      resourceType: 'MedicationStatement',
      medicationReference: {
        reference: 'Medication/abc',
      },
      subject: {
        reference: 'Patient/123',
      },
      status: 'active',
    };
    const medication: r4.Medication = {
      id: 'abc',
      resourceType: 'Medication',
      code: {
        coding: [
          {
            system: 'http://example.com',
            code: '123456',
          },
        ],
      },
    };

    const keyStore = new KeyStore({
      resourceType: 'Bundle',
      entry: [
        {
          resource: medicationStatement,
        },
        {
          resource: medication,
        },
      ],
      type: 'batch',
    });

    const medicationStatementKey = keyStore.byFhirRef.get(
      'MedicationStatement/123',
    );
    expect(medicationStatementKey).toBeDefined();
    expect(medicationStatementKey!.primaryCode).toBe('123456');
    expect(medicationStatementKey!.primaryCodeSystem).toBe(
      'http://example.com',
    );
  });
});
