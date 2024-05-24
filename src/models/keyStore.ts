import type {
  AllergyIntolerance,
  Binary,
  Bundle,
  BundleEntry,
  CarePlan,
  Claim,
  Condition,
  Coverage,
  Device,
  DiagnosticReport,
  DocumentReference,
  Encounter,
  ExplanationOfBenefit,
  FamilyMemberHistory,
  Goal,
  Immunization,
  Location,
  Medication,
  MedicationAdministration,
  MedicationDispense,
  MedicationRequest,
  MedicationStatement,
  Observation,
  Organization,
  Patient,
  Practitioner,
  PractitionerRole,
  Procedure,
  QuestionnaireResponse,
  Reference,
  RelatedPerson,
  ServiceRequest,
  Specimen,
  Task,
} from 'fhir/r4';
import { ResourceAndKey } from './resourceAndKey';
import {
  buildFhirReference,
  cleanCode,
  pickIdentifier,
  pickPrimaryCoding,
  pickPrimaryCodingFromMultiple,
} from './fhirUtil';

function cleanText(text: string | undefined): string | undefined {
  if (!text) return text;

  return text.replace(/\s+/g, ' ').toLowerCase();
}

function getPrimaryCode(
  code: string | undefined,
  system: string,
): { code: string; system: string } | undefined {
  if (code) {
    return { code, system };
  }
  return undefined;
}

const dateRegex = /^(\d{4}-\d{2}-\d{2})/;

export class KeyStore {
  public all: ResourceAndKey[] = [];
  public byFhirRef: Map<string, ResourceAndKey> = new Map();
  public byFullUrl: Map<string, ResourceAndKey> = new Map();

  constructor(bundle: Bundle) {
    const entries = bundle.entry || [];
    entries.forEach((entry) => this.push(entry));

    // back fill dates for resources that have children
    // back fill codes for resources that have links to other resource
    // back fill dates for resources linked to an encounter
    this.all.forEach((key) => {
      switch (key.resource.resourceType) {
        case 'Observation':
          this.setObservationDate(key);
          break;

        case 'DiagnosticReport':
          this.setDiagnosticReportDate(key);
          break;

        case 'MedicationStatement':
          this.setMedicationStatementCode(key);
          break;

        case 'Procedure':
          this.setProcedureDate(key);
          break;

        case 'Condition':
          this.setConditionDate(key);
          break;

        default:
          break;
      }
    });
  }

  private setDateAndDateTime(key: ResourceAndKey, dateField?: string) {
    if (!dateField) {
      return;
    }

    const dateMatch = dateField.match(dateRegex);
    if (dateMatch) {
      // eslint-disable-next-line no-param-reassign
      [, key.date] = dateMatch;

      if (key.date !== dateField) {
        // eslint-disable-next-line no-param-reassign
        key.dateTime = dateField;
      }
    }
  }

  private setObservationDate(observationKey: ResourceAndKey) {
    if (observationKey.dateTime) {
      return;
    }

    const observation = observationKey.resource as Observation;

    if (observation.encounter?.reference) {
      const encounterKey = this.byFhirRef.get(observation.encounter.reference);
      if (encounterKey && encounterKey.dateTime) {
        this.setDateAndDateTime(observationKey, encounterKey.dateTime);
        return;
      }
    }

    if (observation.hasMember && observation.hasMember.length > 0) {
      const memberDates: string[] = [];

      observation.hasMember.forEach((member) => {
        if (member.reference) {
          const memberKey = this.byFhirRef.get(member.reference);
          if (memberKey && memberKey.dateTime) {
            memberDates.push(memberKey.dateTime);
          }
        }
      });

      const disitinctDates = new Set(memberDates);
      if (disitinctDates.size === 1) {
        this.setDateAndDateTime(observationKey, Array.from(disitinctDates)[0]);
      }
    }
  }

  private setDiagnosticReportDate(diagnosticReportKey: ResourceAndKey) {
    if (diagnosticReportKey.dateTime) {
      return;
    }

    const diagnosticReport = diagnosticReportKey.resource as DiagnosticReport;
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

      diagnosticReport.result.forEach((result) => {
        if (result.reference) {
          const resultKey =
            this.byFhirRef.get(result.reference) ||
            this.byFullUrl.get(result.reference);
          if (resultKey && resultKey.dateTime) {
            resultDates.push(resultKey.dateTime);
          }
        }
      });

      const disitinctDates = new Set(resultDates);
      if (disitinctDates.size === 1) {
        this.setDateAndDateTime(
          diagnosticReportKey,
          Array.from(disitinctDates)[0],
        );
      }
    }
  }

  private setMedicationStatementCode(medicationStatementKey: ResourceAndKey) {
    if (medicationStatementKey.primaryCode) {
      return;
    }

    const medicationStatement =
      medicationStatementKey.resource as MedicationStatement;
    if (medicationStatement.medicationReference?.reference) {
      const medicationKey = this.byFhirRef.get(
        medicationStatement.medicationReference.reference,
      );
      if (medicationKey && medicationKey.primaryCode) {
        // eslint-disable-next-line no-param-reassign
        medicationStatementKey.primaryCode = medicationKey.primaryCode;
        // eslint-disable-next-line no-param-reassign
        medicationStatementKey.primaryCodeSystem =
          medicationKey.primaryCodeSystem;
        // eslint-disable-next-line no-param-reassign
        medicationStatementKey.primaryCoding = medicationKey.primaryCoding;
      }
    }
  }

  private setProcedureDate(procedureKey: ResourceAndKey) {
    if (procedureKey.dateTime) {
      return;
    }

    const procedure = procedureKey.resource as Procedure;

    if (procedure.encounter?.reference) {
      const encounterKey = this.byFhirRef.get(procedure.encounter.reference);
      if (encounterKey && encounterKey.dateTime) {
        this.setDateAndDateTime(procedureKey, encounterKey.dateTime);
      }
    }
  }

  private setConditionDate(conditionKey: ResourceAndKey) {
    if (conditionKey.dateTime) {
      return;
    }

    const condition = conditionKey.resource as Condition;

    if (condition.encounter?.reference) {
      const encounterKey = this.byFhirRef.get(condition.encounter.reference);
      if (encounterKey && encounterKey.dateTime) {
        this.setDateAndDateTime(conditionKey, encounterKey.dateTime);
      }
    }
  }

  public push(entry: BundleEntry) {
    let key: ResourceAndKey | undefined;

    if (!entry.resource?.resourceType) {
      return;
    }

    const reference = buildFhirReference(entry);

    if (!reference) {
      return;
    }

    switch (entry.resource.resourceType) {
      case 'Patient':
        key = this.buildKeyPatient(reference, entry.resource);
        break;

      case 'Encounter':
        key = this.buildKeyEncounter(reference, entry.resource);
        break;

      case 'Condition':
        key = this.buildKeyCondition(reference, entry.resource);
        break;

      case 'MedicationAdministration':
        key = this.buildKeyMedicationAdministration(reference, entry.resource);
        break;

      case 'MedicationRequest':
        key = this.buildKeyMedicationRequest(reference, entry.resource);
        break;

      case 'MedicationDispense':
        key = this.buildKeyMedicationDispense(reference, entry.resource);
        break;

      case 'MedicationStatement':
        key = this.buildKeyMedicationStatement(reference, entry.resource);
        break;

      case 'Medication':
        key = this.buildKeyMedication(reference, entry.resource);
        break;

      case 'Immunization':
        key = this.buildKeyImmunization(reference, entry.resource);
        break;

      case 'Procedure':
        key = this.buildKeyProcedure(reference, entry.resource);
        break;

      case 'ServiceRequest':
        key = this.buildKeyServiceRequest(reference, entry.resource);
        break;

      case 'AllergyIntolerance':
        key = this.buildKeyAllergyInterolerance(reference, entry.resource);
        break;

      case 'Observation':
        key = this.buildKeyObservation(reference, entry.resource);
        break;

      case 'QuestionnaireResponse':
        key = this.buildKeyQuestionnaireResponse(reference, entry.resource);
        break;

      case 'DiagnosticReport':
        key = this.buildKeyDiagnosticReport(reference, entry.resource);
        break;

      case 'DocumentReference':
        key = this.buildKeyDocumentReference(reference, entry.resource);
        break;

      case 'Binary':
        key = this.buildKeyBinary(reference, entry.resource);
        break;

      case 'Practitioner':
        key = this.buildKeyPractitioner(reference, entry.resource);
        break;

      case 'PractitionerRole':
        key = this.buildKeyPractitionerRole(reference, entry.resource);
        break;

      case 'Organization':
        key = this.buildKeyOrganization(reference, entry.resource);
        break;

      case 'RelatedPerson':
        key = this.buildKeyRelatedPerson(reference, entry.resource);
        break;

      case 'Specimen':
        key = this.buildKeySpecimen(reference, entry.resource);
        break;

      case 'CarePlan':
        key = this.buildKeyCarePlan(reference, entry.resource);
        break;

      case 'Goal':
        key = this.buildKeyGoal(reference, entry.resource);
        break;

      case 'Task':
        key = this.buildKeyTask(reference, entry.resource);
        break;

      case 'FamilyMemberHistory':
        key = this.buildKeyFamilyMemberHistory(reference, entry.resource);
        break;

      case 'Claim':
        key = this.buildKeyClaim(reference, entry.resource);
        break;

      case 'ExplanationOfBenefit':
        key = this.buildKeyExplanationOfBenefit(reference, entry.resource);
        break;

      case 'Coverage':
        key = this.buildKeyCoverage(reference, entry.resource);
        break;

      case 'Device':
        key = this.buildKeyDevice(reference, entry.resource);
        break;

      case 'Location':
        key = this.buildKeyLocation(reference, entry.resource);
        break;

      case 'OperationOutcome':
      case 'Composition':
        break;

      default:
        console.log(`Unhandled resource type: ${entry.resource.resourceType}`);
        break;
    }

    if (!key) {
      return;
    }

    this.all.push(key);
    if (key.reference?.reference) {
      this.byFhirRef.set(key.reference?.reference, key);
    }
    if (entry.fullUrl) {
      this.byFullUrl.set(entry.fullUrl, key);
    }
  }

  public buildKeyPatient(
    reference: Reference,
    patient: Patient,
  ): ResourceAndKey {
    return {
      reference,
      resource: patient,
      resourceType: 'Patient',
      identifier: pickIdentifier(patient.identifier) || patient.id,
    };
  }

  public buildKeyEncounter(
    reference: Reference,
    encounter: Encounter,
  ): ResourceAndKey {
    const primaryCoding = encounter.class;
    const key: ResourceAndKey = {
      reference,
      resource: encounter,
      resourceType: encounter.resourceType,
      identifier: pickIdentifier(encounter.identifier) || encounter.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
    };
    this.setDateAndDateTime(key, encounter.period?.start);
    return key;
  }

  public buildKeyCondition(
    reference: Reference,
    condition: Condition,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(condition.code, [
      'http://snomed.info/sct',
      'http://www.icd10data.com/icd10pcs',
    ]);
    const key: ResourceAndKey = {
      reference,
      resource: condition,
      resourceType: condition.resourceType,
      identifier: pickIdentifier(condition.identifier) || condition.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(condition.code?.text),
    };
    this.setDateAndDateTime(
      key,
      condition.onsetDateTime || condition.onsetPeriod?.start,
    );
    return key;
  }

  public buildKeyMedicationAdministration(
    reference: Reference,
    medadmin: MedicationAdministration,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(
      medadmin.medicationCodeableConcept,
      ['http://www.nlm.nih.gov/research/umls/rxnorm'],
    );
    const key: ResourceAndKey = {
      reference,
      resource: medadmin,
      resourceType: medadmin.resourceType,
      identifier: pickIdentifier(medadmin.identifier) || medadmin.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(medadmin.medicationCodeableConcept?.text),
    };
    this.setDateAndDateTime(
      key,
      medadmin.effectiveDateTime || medadmin.effectivePeriod?.start,
    );
    return key;
  }

  public buildKeyMedicationRequest(
    reference: Reference,
    medRequest: MedicationRequest,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(
      medRequest.medicationCodeableConcept,
      ['http://www.nlm.nih.gov/research/umls/rxnorm'],
    );
    const key: ResourceAndKey = {
      reference,
      resource: medRequest,
      resourceType: medRequest.resourceType,
      identifier: pickIdentifier(medRequest.identifier) || medRequest.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(medRequest.medicationCodeableConcept?.text),
    };
    this.setDateAndDateTime(key, medRequest.authoredOn);
    return key;
  }

  public buildKeyMedicationDispense(
    reference: Reference,
    medDispense: MedicationDispense,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(
      medDispense.medicationCodeableConcept,
      ['http://www.nlm.nih.gov/research/umls/rxnorm'],
    );
    const key: ResourceAndKey = {
      reference,
      resource: medDispense,
      resourceType: medDispense.resourceType,
      identifier: pickIdentifier(medDispense.identifier) || medDispense.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(medDispense.medicationCodeableConcept?.text),
    };
    this.setDateAndDateTime(
      key,
      medDispense.whenPrepared || medDispense.whenHandedOver,
    );
    return key;
  }

  public buildKeyMedicationStatement(
    reference: Reference,
    medStatement: MedicationStatement,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(
      medStatement.medicationCodeableConcept,
      ['http://www.nlm.nih.gov/research/umls/rxnorm'],
    );
    const key: ResourceAndKey = {
      reference,
      resource: medStatement,
      resourceType: medStatement.resourceType,
      identifier: pickIdentifier(medStatement.identifier) || medStatement.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(medStatement.medicationCodeableConcept?.text),
    };
    this.setDateAndDateTime(
      key,
      medStatement.effectiveDateTime || medStatement.effectivePeriod?.start,
    );
    return key;
  }

  public buildKeyMedication(
    reference: Reference,
    medication: Medication,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(medication.code, [
      'http://www.nlm.nih.gov/research/umls/rxnorm',
    ]);
    return {
      reference,
      resource: medication,
      resourceType: medication.resourceType,
      identifier: pickIdentifier(medication.identifier) || medication.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(medication.code?.text),
    };
  }

  public buildKeyImmunization(
    reference: Reference,
    immunization: Immunization,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(immunization.vaccineCode, [
      'http://hl7.org/fhir/sid/cvx',
      'http://www.nlm.nih.gov/research/umls/rxnorm',
      'https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets',
    ]);
    const key: ResourceAndKey = {
      reference,
      resource: immunization,
      resourceType: immunization.resourceType,
      identifier: pickIdentifier(immunization.identifier) || immunization.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(immunization.vaccineCode?.text),
    };
    this.setDateAndDateTime(
      key,
      immunization.occurrenceDateTime ||
        immunization.occurrenceString ||
        immunization.recorded,
    );
    return key;
  }

  public buildKeyProcedure(
    reference: Reference,
    procedure: Procedure,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(procedure.code, [
      'http://snomed.info/sct',
      'https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets',
      'http://www.icd10data.com/icd10pcs',
    ]);
    const key: ResourceAndKey = {
      reference,
      resource: procedure,
      resourceType: procedure.resourceType,
      identifier: pickIdentifier(procedure.identifier) || procedure.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(procedure.code?.text),
    };
    this.setDateAndDateTime(
      key,
      procedure.performedDateTime || procedure.performedPeriod?.start,
    );
    return key;
  }

  public buildKeyServiceRequest(
    reference: Reference,
    serviceRequest: ServiceRequest,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(serviceRequest.code, [
      'http://snomed.info/sct',
      'https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets',
      'http://www.icd10data.com/icd10pcs',
    ]);
    const key: ResourceAndKey = {
      reference,
      resource: serviceRequest,
      resourceType: serviceRequest.resourceType,
      identifier:
        pickIdentifier(serviceRequest.identifier) || serviceRequest.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(serviceRequest.code?.text),
    };
    this.setDateAndDateTime(
      key,
      serviceRequest.authoredOn ||
        serviceRequest.occurrenceDateTime ||
        serviceRequest.occurrencePeriod?.start,
    );
    return key;
  }

  public buildKeyAllergyInterolerance(
    reference: Reference,
    allergyIntolerance: AllergyIntolerance,
  ): ResourceAndKey {
    const allergyIntoleranceSystems = ['http://snomed.info/sct'];
    const primaryCoding =
      pickPrimaryCoding(allergyIntolerance.code, allergyIntoleranceSystems) ||
      allergyIntolerance.reaction
        ?.map((reaction) =>
          pickPrimaryCoding(reaction.substance, allergyIntoleranceSystems),
        )
        ?.find((s) => !!s);
    const key: ResourceAndKey = {
      reference,
      resource: allergyIntolerance,
      resourceType: allergyIntolerance.resourceType,
      identifier:
        pickIdentifier(allergyIntolerance.identifier) || allergyIntolerance.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(allergyIntolerance.code?.text),
    };
    this.setDateAndDateTime(
      key,
      allergyIntolerance.onsetDateTime ||
        allergyIntolerance.onsetPeriod?.start ||
        allergyIntolerance.recordedDate,
    );
    return key;
  }

  public buildKeyObservation(
    reference: Reference,
    observation: Observation,
  ): ResourceAndKey {
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

    const key: ResourceAndKey = {
      reference,
      resource: observation,
      resourceType: observation.resourceType,
      identifier: pickIdentifier(observation.identifier) || observation.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(observation.code?.text),
      value,
    };
    this.setDateAndDateTime(
      key,
      observation.effectiveDateTime ||
        observation.effectivePeriod?.start ||
        observation.effectiveInstant,
    );
    return key;
  }

  public buildKeyQuestionnaireResponse(
    reference: Reference,
    questionnaireResponse: QuestionnaireResponse,
  ): ResourceAndKey {
    // QuestionnaireResponse doesn't have a code, so we use the canonical URL for the  questionnaire as the primary code
    const primaryCoding = getPrimaryCode(
      questionnaireResponse.questionnaire,
      'https://hl7.org/fhir/r4/datatypes.html#canonical',
    );

    const key: ResourceAndKey = {
      reference,
      resource: questionnaireResponse,
      resourceType: questionnaireResponse.resourceType,
      identifier:
        questionnaireResponse.identifier?.value || questionnaireResponse.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
    };
    this.setDateAndDateTime(key, questionnaireResponse.authored);
    return key;
  }

  public buildKeyDiagnosticReport(
    reference: Reference,
    diagnosticReport: DiagnosticReport,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(diagnosticReport.code, [
      'http://loinc.org',
      'http://snomed.info/sct',
    ]);

    const key: ResourceAndKey = {
      reference,
      resource: diagnosticReport,
      resourceType: diagnosticReport.resourceType,
      identifier:
        pickIdentifier(diagnosticReport.identifier) || diagnosticReport.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(diagnosticReport.code?.text),
    };
    this.setDateAndDateTime(
      key,
      diagnosticReport.effectiveDateTime ||
        diagnosticReport.effectivePeriod?.start,
    );
    return key;
  }

  public buildKeyDocumentReference(
    reference: Reference,
    documentReference: DocumentReference,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(documentReference.type, [
      'http://loinc.org',
      'http://snomed.info/sct',
    ]);

    const key: ResourceAndKey = {
      reference,
      resource: documentReference,
      resourceType: documentReference.resourceType,
      identifier:
        pickIdentifier(documentReference.identifier) || documentReference.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(documentReference.type?.text),
    };
    this.setDateAndDateTime(key, documentReference.date);
    return key;
  }

  public buildKeyBinary(reference: Reference, binary: Binary): ResourceAndKey {
    const primaryCoding = getPrimaryCode(binary.contentType, 'urn:ietf:bcp:13');
    return {
      reference,
      resource: binary,
      resourceType: binary.resourceType,
      identifier: binary.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: binary.data,
    };
  }

  public buildKeyPractitioner(
    reference: Reference,
    practitioner: Practitioner,
  ): ResourceAndKey {
    // should probably do something with name for text
    return {
      reference,
      resource: practitioner,
      resourceType: practitioner.resourceType,
      identifier: pickIdentifier(practitioner.identifier) || practitioner.id,
    };
  }

  public buildKeyPractitionerRole(
    reference: Reference,
    practitionerRole: PractitionerRole,
  ): ResourceAndKey {
    return {
      reference,
      resource: practitionerRole,
      resourceType: practitionerRole.resourceType,
      identifier:
        pickIdentifier(practitionerRole.identifier) || practitionerRole.id,
    };
  }

  public buildKeyOrganization(
    reference: Reference,
    organization: Organization,
  ): ResourceAndKey {
    return {
      reference,
      resource: organization,
      resourceType: organization.resourceType,
      identifier: pickIdentifier(organization.identifier) || organization.id,
    };
  }

  public buildKeyRelatedPerson(
    reference: Reference,
    relatedPerson: RelatedPerson,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCodingFromMultiple(
      relatedPerson.relationship,
      ['http://terminology.hl7.org/CodeSystem/v3-RoleCode'],
    );
    // should probably do something with name for text
    return {
      reference,
      resource: relatedPerson,
      resourceType: relatedPerson.resourceType,
      identifier: pickIdentifier(relatedPerson.identifier) || relatedPerson.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
    };
  }

  public buildKeySpecimen(
    reference: Reference,
    specimen: Specimen,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(specimen.type, [
      'http://snomed.info/sct',
    ]);
    const key: ResourceAndKey = {
      reference,
      resource: specimen,
      resourceType: specimen.resourceType,
      identifier: pickIdentifier(specimen.identifier) || specimen.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(specimen.type?.text),
    };
    this.setDateAndDateTime(
      key,
      specimen.collection?.collectedDateTime ||
        specimen.collection?.collectedPeriod?.start ||
        specimen.receivedTime,
    );
    return key;
  }

  public buildKeyCarePlan(
    reference: Reference,
    carePlan: CarePlan,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCodingFromMultiple(carePlan.category, [
      'http://snomed.info/sct',
      'http://loinc.org',
    ]);
    const key: ResourceAndKey = {
      reference,
      resource: carePlan,
      resourceType: carePlan.resourceType,
      identifier: pickIdentifier(carePlan.identifier) || carePlan.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(carePlan.title || carePlan.description),
    };
    this.setDateAndDateTime(key, carePlan.period?.start || carePlan.created);
    return key;
  }

  public buildKeyGoal(reference: Reference, goal: Goal): ResourceAndKey {
    const primaryCoding = pickPrimaryCodingFromMultiple(goal.category, [
      'http://snomed.info/sct',
      'http://loinc.org',
    ]);
    const key: ResourceAndKey = {
      reference,
      resource: goal,
      resourceType: goal.resourceType,
      identifier: pickIdentifier(goal.identifier) || goal.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(goal.description?.text),
    };
    this.setDateAndDateTime(key, goal.startDate);
    return key;
  }

  public buildKeyTask(reference: Reference, task: Task): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(task.code, [
      'http://snomed.info/sct',
      'http://loinc.org',
    ]);
    const key: ResourceAndKey = {
      reference,
      resource: task,
      resourceType: task.resourceType,
      identifier: pickIdentifier(task.identifier) || task.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(task.description),
    };
    this.setDateAndDateTime(
      key,
      task.executionPeriod?.start || task.authoredOn || task.lastModified,
    );
    return key;
  }

  public buildKeyFamilyMemberHistory(
    reference: Reference,
    familyMemberHistory: FamilyMemberHistory,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(familyMemberHistory.relationship, [
      'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
    ]);
    const key: ResourceAndKey = {
      reference,
      resource: familyMemberHistory,
      resourceType: familyMemberHistory.resourceType,
      identifier:
        pickIdentifier(familyMemberHistory.identifier) ||
        familyMemberHistory.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(familyMemberHistory.relationship?.text),
    };
    this.setDateAndDateTime(key, familyMemberHistory.date);
    return key;
  }

  public buildKeyClaim(reference: Reference, claim: Claim): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(claim.type, [
      'http://hl7.org/fhir/claim-type',
    ]);
    const key: ResourceAndKey = {
      reference,
      resource: claim,
      resourceType: claim.resourceType,
      identifier: pickIdentifier(claim.identifier) || claim.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
    };
    this.setDateAndDateTime(key, claim.billablePeriod?.start);
    return key;
  }

  public buildKeyExplanationOfBenefit(
    reference: Reference,
    eob: ExplanationOfBenefit,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(eob.type, [
      'http://hl7.org/fhir/claim-type',
    ]);
    const key: ResourceAndKey = {
      reference,
      resource: eob,
      resourceType: eob.resourceType,
      identifier: pickIdentifier(eob.identifier) || eob.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
    };
    this.setDateAndDateTime(key, eob.billablePeriod?.start);
    return key;
  }

  public buildKeyCoverage(
    reference: Reference,
    coverage: Coverage,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(coverage.type, []);
    const key: ResourceAndKey = {
      reference,
      resource: coverage,
      resourceType: coverage.resourceType,
      identifier: pickIdentifier(coverage.identifier) || coverage.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
    };
    this.setDateAndDateTime(key, coverage.period?.start);
    return key;
  }

  public buildKeyDevice(reference: Reference, device: Device): ResourceAndKey {
    const primaryCoding = pickPrimaryCoding(device.type, [
      'http://snomed.info/sct',
    ]);
    const key: ResourceAndKey = {
      reference,
      resource: device,
      resourceType: device.resourceType,
      identifier: pickIdentifier(device.identifier) || device.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(
        device.serialNumber ||
          device.modelNumber ||
          device.partNumber ||
          device.type?.text ||
          device.type?.coding?.[0].display,
      ),
    };
    return key;
  }

  public buildKeyLocation(
    reference: Reference,
    location: Location,
  ): ResourceAndKey {
    const primaryCoding = pickPrimaryCodingFromMultiple(location.type, [
      'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
    ]);
    const key: ResourceAndKey = {
      reference,
      resource: location,
      resourceType: location.resourceType,
      identifier: pickIdentifier(location.identifier) || location.id,
      primaryCodeSystem: primaryCoding?.system,
      primaryCode: cleanCode(primaryCoding),
      primaryCoding,
      text: cleanText(location.name),
    };
    return key;
  }
}
