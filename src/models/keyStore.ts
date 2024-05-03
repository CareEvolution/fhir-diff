import * as r4 from 'fhir/r4';
import { ResourceAndKey } from './resourceAndKey';
import { buildRef, pickIdentifier, pickPrimaryCoding } from './fhirUtil';

function cleanText(text: string | undefined): string | undefined {
  if (!text) return text;

  return text.replace(/\s+/g, ' ').toLowerCase();
}

const dateRegex = /^(\d{4}-\d{2}-\d{2})/;

export class KeyStore {
  public all: ResourceAndKey[] = [];
  public byFhirRef: Map<string, ResourceAndKey> = new Map();
  public byFullUrl: Map<string, ResourceAndKey> = new Map();

  constructor(bundle: r4.Bundle) {
    for (const entry of bundle.entry || []) {
      this.push(entry);
    }
    // back fill dates for resources that have children
    // back fill codes for resources that have links to other resource
    for (const key of this.all) {
      switch (key.resource.resourceType) {
        case 'Observation':
          if (!key.date) {
            this.setObservationDate(key);
          }
          break;
        case 'DiagnosticReport':
          if (!key.date) {
            this.setDiagnosticReportDate(key);
          }
          break;
        case 'MedicationStatement':
          if (!key.primaryCode) {
            this.setMedicationStatementCode(key);
          }
          break;
      }
    }
  }

  private setDateAndDateTime(key: ResourceAndKey, dateField?: string) {
    if (!dateField) {
      return;
    }

    const dateMatch = dateField.match(dateRegex);
    if (dateMatch) {
      key.date = dateMatch[1];

      if (key.date !== dateField) {
        key.dateTime = dateField;
      }
    }
  }

  private setObservationDate(observationKey: ResourceAndKey) {
    if (observationKey.dateTime) {
      return;
    }

    const observation = observationKey.resource as r4.Observation;

    if (observation.encounter?.reference) {
      const encounterKey = this.byFhirRef.get(observation.encounter.reference);
      if (encounterKey && encounterKey.dateTime) {
        this.setDateAndDateTime(observationKey, encounterKey.dateTime);
        return;
      }
    }

    if (observation.hasMember && observation.hasMember.length > 0) {
      const memberDates: string[] = [];

      for (const member of observation.hasMember) {
        if (member.reference) {
          const memberKey = this.byFhirRef.get(member.reference);
          if (memberKey && memberKey.dateTime) {
            memberDates.push(memberKey.dateTime);
          }
        }
      }

      const disitinctDates = new Set(memberDates);
      if (disitinctDates.size === 1) {
        this.setDateAndDateTime(
          observationKey,
          disitinctDates.values().next().value,
        );
        return;
      }
    }
  }

  private setDiagnosticReportDate(diagnosticReportKey: ResourceAndKey) {
    if (diagnosticReportKey.dateTime) {
      return;
    }

    const diagnosticReport =
      diagnosticReportKey.resource as r4.DiagnosticReport;
    if (diagnosticReport.encounter?.reference) {
      const encounterKey = this.byFhirRef.get(
        diagnosticReport.encounter.reference,
      );
      if (encounterKey && encounterKey.dateTime) {
        this.setDateAndDateTime(diagnosticReportKey, encounterKey.dateTime);
        return;
      }
    }

    if (
      !diagnosticReportKey.dateTime &&
      diagnosticReport.result &&
      diagnosticReport.result.length > 0
    ) {
      const resultDates: string[] = [];

      for (const result of diagnosticReport.result) {
        if (result.reference) {
          const resultKey =
            this.byFhirRef.get(result.reference) ||
            this.byFullUrl.get(result.reference);
          if (resultKey && resultKey.dateTime) {
            resultDates.push(resultKey.dateTime);
          }
        }
      }

      const disitinctDates = new Set(resultDates);
      if (disitinctDates.size === 1) {
        this.setDateAndDateTime(
          diagnosticReportKey,
          disitinctDates.values().next().value,
        );
        return;
      }
    }
  }

  private setMedicationStatementCode(medicationStatementKey: ResourceAndKey) {
    if (medicationStatementKey.primaryCode) {
      return;
    }

    const medicationStatement =
      medicationStatementKey.resource as r4.MedicationStatement;
    if (medicationStatement.medicationReference?.reference) {
      console.log(
        `fetching medication code for ${medicationStatement.id} from ${medicationStatement.medicationReference.reference}`,
      );
      const medicationKey = this.byFhirRef.get(
        medicationStatement.medicationReference.reference,
      );
      if (medicationKey && medicationKey.primaryCode) {
        medicationStatementKey.primaryCode = medicationKey.primaryCode;
        medicationStatementKey.primaryCodeSystem =
          medicationKey.primaryCodeSystem;
      }
    }
  }

  public push(entry: r4.BundleEntry) {
    let key: ResourceAndKey | undefined;

    if (!entry.resource?.resourceType) {
      return;
    }

    switch (entry.resource.resourceType) {
      case 'Patient':
        key = this.buildKeyPatient(entry.resource);
        break;

      case 'Encounter':
        key = this.buildKeyEncounter(entry.resource);
        break;

      case 'Condition':
        key = this.buildKeyCondition(entry.resource);
        break;

      case 'MedicationAdministration':
        key = this.buildKeyMedicationAdministration(entry.resource);
        break;

      case 'MedicationRequest':
        key = this.buildKeyMedicationRequest(entry.resource);
        break;

      case 'MedicationStatement':
        key = this.buildKeyMedicationStatement(entry.resource);
        break;

      case 'Medication':
        key = this.buildKeyMedication(entry.resource);
        break;

      case 'Procedure':
        key = this.buildKeyProcedure(entry.resource);
        break;

      case 'AllergyIntolerance':
        key = this.buildKeyAllergyInterolerance(entry.resource);
        break;

      case 'Observation':
        key = this.buildKeyObservation(entry.resource);
        break;

      case 'DiagnosticReport':
        key = this.buildKeyDiagnosticReport(entry.resource);
        break;

      case 'Practitioner':
        key = this.buildKeyPractitioner(entry.resource);
        break;

      case 'PractitionerRole':
        key = this.buildKeyPractitionerRole(entry.resource);
        break;

      case 'Organization':
        key = this.buildKeyOrganization(entry.resource);
        break;

      case 'OperationOutcome':
      case 'Composition':
        break;

      default:
        console.log('Unhandled resource type: ' + entry.resource.resourceType);
        break;
    }

    if (!key) {
      return;
    }

    this.all.push(key);
    this.byFhirRef.set(buildRef(key.resource), key);
    if (entry.fullUrl) {
      this.byFullUrl.set(entry.fullUrl, key);
    }
  }

  public buildKeyPatient(patient: r4.Patient): ResourceAndKey {
    return {
      resource: patient,
      resourceType: 'Patient',
      identifier: pickIdentifier(patient.identifier) || patient.id,
    };
  }

  public buildKeyEncounter(encounter: r4.Encounter): ResourceAndKey {
    const primaryCoding = encounter.class;
    const key = {
      resource: encounter,
      resourceType: encounter.resourceType,
      identifier: pickIdentifier(encounter.identifier) || encounter.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: primaryCoding?.code,
    };
    this.setDateAndDateTime(key, encounter.period?.start);
    return key;
  }

  public buildKeyCondition(condition: r4.Condition): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(condition.code, [
      'http://snomed.info/sct',
      'http://www.icd10data.com/icd10pcs',
    ]);
    const key = {
      resource: condition,
      resourceType: condition.resourceType,
      identifier: pickIdentifier(condition.identifier) || condition.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: primaryCoding?.code,
      text: cleanText(condition.code?.text),
    };
    this.setDateAndDateTime(key, condition.onsetDateTime);
    return key;
  }

  public buildKeyMedicationAdministration(
    medadmin: r4.MedicationAdministration,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(
      medadmin.medicationCodeableConcept,
      ['http://www.nlm.nih.gov/research/umls/rxnorm'],
    );
    const key = {
      resource: medadmin,
      resourceType: medadmin.resourceType,
      identifier: pickIdentifier(medadmin.identifier) || medadmin.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: primaryCoding?.code,
      text: cleanText(medadmin.medicationCodeableConcept?.text),
    };
    this.setDateAndDateTime(key, medadmin.effectiveDateTime);
    return key;
  }

  public buildKeyMedicationRequest(
    medRequest: r4.MedicationRequest,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(
      medRequest.medicationCodeableConcept,
      ['http://www.nlm.nih.gov/research/umls/rxnorm'],
    );
    const key = {
      resource: medRequest,
      resourceType: medRequest.resourceType,
      identifier: pickIdentifier(medRequest.identifier) || medRequest.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: primaryCoding?.code,
      text: cleanText(medRequest.medicationCodeableConcept?.text),
    };
    this.setDateAndDateTime(key, medRequest.authoredOn);
    return key;
  }

  public buildKeyMedicationStatement(
    medStatement: r4.MedicationStatement,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(
      medStatement.medicationCodeableConcept,
      ['http://www.nlm.nih.gov/research/umls/rxnorm'],
    );
    const key = {
      resource: medStatement,
      resourceType: medStatement.resourceType,
      identifier: pickIdentifier(medStatement.identifier) || medStatement.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: primaryCoding?.code,
      text: cleanText(medStatement.medicationCodeableConcept?.text),
    };
    this.setDateAndDateTime(
      key,
      medStatement.effectiveDateTime || medStatement.effectivePeriod?.start,
    );
    return key;
  }

  public buildKeyMedication(medication: r4.Medication): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(medication.code, [
      'http://www.nlm.nih.gov/research/umls/rxnorm',
    ]);
    return {
      resource: medication,
      resourceType: medication.resourceType,
      identifier: pickIdentifier(medication.identifier) || medication.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: primaryCoding?.code,
      text: cleanText(medication.code?.text),
    };
  }

  public buildKeyProcedure(procedure: r4.Procedure): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(procedure.code, [
      'http://snomed.info/sct',
      'http://www.icd10data.com/icd10pcs',
    ]);
    const key = {
      resource: procedure,
      resourceType: procedure.resourceType,
      identifier: pickIdentifier(procedure.identifier) || procedure.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: primaryCoding?.code,
      text: cleanText(procedure.code?.text),
    };
    this.setDateAndDateTime(
      key,
      procedure.performedDateTime || procedure.performedPeriod?.start,
    );
    return key;
  }

  public buildKeyAllergyInterolerance(
    allergyIntolerance: r4.AllergyIntolerance,
  ): ResourceAndKey {
    const allergyIntoleranceSystems = ['http://snomed.info/sct'];
    const primaryCoding =
      pickPrimaryCoding(allergyIntolerance.code, allergyIntoleranceSystems) ||
      allergyIntolerance.reaction
        ?.map((reaction) =>
          pickPrimaryCoding(reaction.substance, allergyIntoleranceSystems),
        )
        ?.find((s) => !!s);
    const key = {
      resource: allergyIntolerance,
      resourceType: allergyIntolerance.resourceType,
      identifier:
        pickIdentifier(allergyIntolerance.identifier) || allergyIntolerance.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: primaryCoding?.code,
      text: cleanText(allergyIntolerance.code?.text),
    };
    this.setDateAndDateTime(
      key,
      allergyIntolerance.onsetDateTime || allergyIntolerance.recordedDate,
    );
    return key;
  }

  public buildKeyObservation(observation: r4.Observation): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(observation.code, [
      'http://loinc.org',
      'http://snomed.info/sct',
    ]);

    let value: string | undefined;

    if (observation.valueString) {
      value = observation.valueString;
    } else if (observation.valueQuantity?.value) {
      if (observation.valueQuantity.unit) {
        value = `${observation.valueQuantity.value} ${observation.valueQuantity.unit}`;
      } else {
        value = observation.valueQuantity.value?.toString();
      }
    } else if (observation.valueInteger) {
      value = observation.valueInteger.toString();
    } else if (observation.valueCodeableConcept?.text) {
      value = observation.valueCodeableConcept.text;
    }

    const key = {
      resource: observation,
      resourceType: observation.resourceType,
      identifier: pickIdentifier(observation.identifier) || observation.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: primaryCoding?.code,
      text: cleanText(observation.code?.text),
      value: value,
    };
    this.setDateAndDateTime(key, observation.effectiveDateTime);
    return key;
  }

  public buildKeyDiagnosticReport(
    diagnosticReport: r4.DiagnosticReport,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(diagnosticReport.code, [
      'http://loinc.org',
      'http://snomed.info/sct',
    ]);

    const key = {
      resource: diagnosticReport,
      resourceType: diagnosticReport.resourceType,
      identifier:
        pickIdentifier(diagnosticReport.identifier) || diagnosticReport.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: primaryCoding?.code,
      text: cleanText(diagnosticReport.code?.text),
    };
    this.setDateAndDateTime(
      key,
      diagnosticReport.effectiveDateTime ||
        diagnosticReport.effectivePeriod?.start,
    );
    return key;
  }

  public buildKeyPractitioner(practitioner: r4.Practitioner): ResourceAndKey {
    return {
      resource: practitioner,
      resourceType: practitioner.resourceType,
      identifier: pickIdentifier(practitioner.identifier) || practitioner.id,
    };
  }

  public buildKeyPractitionerRole(
    practitionerRole: r4.PractitionerRole,
  ): ResourceAndKey {
    return {
      resource: practitionerRole,
      resourceType: practitionerRole.resourceType,
      identifier:
        pickIdentifier(practitionerRole.identifier) || practitionerRole.id,
    };
  }

  public buildKeyOrganization(organization: r4.Organization): ResourceAndKey {
    return {
      resource: organization,
      resourceType: organization.resourceType,
      identifier: pickIdentifier(organization.identifier) || organization.id,
    };
  }
}
