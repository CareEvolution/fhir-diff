import type {
  Patient,
  MedicationStatement,
  Medication,
  Procedure,
  Encounter,
  QuestionnaireResponse,
} from 'fhir/r4';
import { expect, test, describe } from '@jest/globals';
import { KeyStore } from './keyStore';

describe('constructor', () => {
  test('should find an identifier', () => {
    const patient: Patient = {
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
    const medicationStatement: MedicationStatement = {
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
    const medication: Medication = {
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

  test('should use canonical url for QuestionnaireResponse code', () => {
    const questionnaireResponse: QuestionnaireResponse = {
      id: '123',
      resourceType: 'QuestionnaireResponse',
      questionnaire: 'http://example.com/Questionnaire/123',
      status: 'completed',
    };

    const keyStore = new KeyStore({
      resourceType: 'Bundle',
      entry: [
        {
          resource: questionnaireResponse,
        },
      ],
      type: 'batch',
    });

    const questionnaireResponseKey = keyStore.byFhirRef.get(
      'QuestionnaireResponse/123',
    );
    expect(questionnaireResponseKey).toBeDefined();
    expect(questionnaireResponseKey!.primaryCode).toBe(
      'http://example.com/Questionnaire/123',
    );
    expect(questionnaireResponseKey!.primaryCodeSystem).toBe(
      'https://hl7.org/fhir/r4/datatypes.html#canonical',
    );
  });

  test.only('should backfill dates to procedures when there is a linked encounter', () => {
    const encounter: Encounter = {
      id: '123',
      resourceType: 'Encounter',
      class: { code: 'AMB' },
      period: {
        start: '2021-01-01T00:00:00Z',
        end: '2021-01-02T00:00:00Z',
      },
      status: 'finished',
      subject: {
        reference: 'Patient/123',
      },
    };
    const procedure: Procedure = {
      id: 'abc',
      resourceType: 'Procedure',
      code: {
        coding: [
          {
            system: 'http://example.com',
            code: '123456',
          },
        ],
      },
      encounter: { reference: 'Encounter/123' },
      status: 'completed',
      subject: { reference: 'Patient/123' },
    };

    const keyStore = new KeyStore({
      resourceType: 'Bundle',
      entry: [
        {
          resource: encounter,
        },
        {
          resource: procedure,
        },
      ],
      type: 'batch',
    });

    const procedureKey = keyStore.byFhirRef.get('Procedure/abc');
    expect(procedureKey).toBeDefined();
    expect(procedureKey!.dateTime).toBe('2021-01-01T00:00:00Z');
    expect(procedureKey!.date).toBe('2021-01-01');
  });
});
