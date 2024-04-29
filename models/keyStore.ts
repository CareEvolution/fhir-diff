import * as r4 from "fhir/r4";
import { ResourceAndKey } from "./resourceAndKey";
import { buildRef, pickIdentifier, pickPrimaryCoding } from "./fhirUtil";

function clean_text(text: string | undefined): string | undefined {
  if (!text) return text;

  return text.replace(/\s+/g, " ").toLowerCase();
}

export class KeyStore {
  public all: ResourceAndKey[] = [];
  public byFhirRef: Map<string, ResourceAndKey> = new Map();
  public byFullUrl: Map<string, ResourceAndKey> = new Map();

  public push(entry: r4.BundleEntry) {
    let key: ResourceAndKey | undefined;

    if (!entry.resource?.resourceType) {
      return;
    }

    switch (entry.resource.resourceType) {
      case "Patient":
        key = this.buildKeyPatient(entry.resource);
        break;

      case "Encounter":
        key = this.buildKeyEncounter(entry.resource);
        break;

      case "Condition":
        key = this.buildKeyCondition(entry.resource);
        break;

      case "MedicationAdministration":
        key = this.buildKeyMedicationAdministration(entry.resource);
        break;

      case "MedicationRequest":
        key = this.buildKeyMedicationRequest(entry.resource);
        break;

      case "MedicationStatement":
        key = this.buildKeyMedicationStatement(entry.resource);
        break;

      case "Medication":
        key = this.buildKeyMedication(entry.resource);
        break;

      case "Procedure":
        key = this.buildKeyProcedure(entry.resource);
        break;

      case "AllergyIntolerance":
        key = this.buildKeyAllergyInterolerance(entry.resource);
        break;

      case "Observation":
        key = this.buildKeyObservation(entry.resource);
        break;

      case "DiagnosticReport":
        key = this.buildKeyDiagnosticReport(entry.resource);
        break;

      case "Practitioner":
        key = this.buildKeyPractitioner(entry.resource);
        break;

      case "PractitionerRole":
        key = this.buildKeyPractitionerRole(entry.resource);
        break;

      case "Organization":
        key = this.buildKeyOrganization(entry.resource);
        break;

      case "OperationOutcome":
      case "Composition":
        break;

      default:
        console.log("Unhandled resource type: " + entry.resource.resourceType);
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
      resourceType: "Patient",
      identifier: pickIdentifier(patient.identifier) || patient.id,
    };
  }

  public buildKeyEncounter(encounter: r4.Encounter): ResourceAndKey {
    const primary_coding = encounter.class;
    return {
      resource: encounter,
      resourceType: encounter.resourceType,
      identifier: pickIdentifier(encounter.identifier) || encounter.id,
      primary_code_system: primary_coding?.system,
      primary_code: primary_coding?.code,
      date: encounter.period?.start,
    };
  }

  public buildKeyCondition(condition: r4.Condition): ResourceAndKey {
    const primary_coding = pickPrimaryCoding(condition.code, [
      "http://snomed.info/sct",
      "http://www.icd10data.com/icd10pcs",
    ]);
    return {
      resource: condition,
      resourceType: condition.resourceType,
      identifier: pickIdentifier(condition.identifier) || condition.id,
      primary_code_system: primary_coding?.system,
      primary_code: primary_coding?.code,
      date: condition.onsetDateTime,
      text: clean_text(condition.code?.text),
    };
  }

  public buildKeyMedicationAdministration(
    medadmin: r4.MedicationAdministration,
  ): ResourceAndKey {
    const primary_coding = pickPrimaryCoding(
      medadmin.medicationCodeableConcept,
      ["http://www.nlm.nih.gov/research/umls/rxnorm"],
    );
    return {
      resource: medadmin,
      resourceType: medadmin.resourceType,
      identifier: pickIdentifier(medadmin.identifier) || medadmin.id,
      primary_code_system: primary_coding?.system,
      primary_code: primary_coding?.code,
      date: medadmin.effectiveDateTime,
      text: clean_text(medadmin.medicationCodeableConcept?.text),
    };
  }

  public buildKeyMedicationRequest(
    medRequest: r4.MedicationRequest,
  ): ResourceAndKey {
    const primary_coding = pickPrimaryCoding(
      medRequest.medicationCodeableConcept,
      ["http://www.nlm.nih.gov/research/umls/rxnorm"],
    );
    return {
      resource: medRequest,
      resourceType: medRequest.resourceType,
      identifier: pickIdentifier(medRequest.identifier) || medRequest.id,
      primary_code_system: primary_coding?.system,
      primary_code: primary_coding?.code,
      date: medRequest.authoredOn,
      text: clean_text(medRequest.medicationCodeableConcept?.text),
    };
  }

  public buildKeyMedicationStatement(
    medStatement: r4.MedicationStatement,
  ): ResourceAndKey {
    const primary_coding = pickPrimaryCoding(
      medStatement.medicationCodeableConcept,
      ["http://www.nlm.nih.gov/research/umls/rxnorm"],
    );
    return {
      resource: medStatement,
      resourceType: medStatement.resourceType,
      identifier: pickIdentifier(medStatement.identifier) || medStatement.id,
      primary_code_system: primary_coding?.system,
      primary_code: primary_coding?.code,
      date:
        medStatement.effectiveDateTime || medStatement.effectivePeriod?.start,
      text: clean_text(medStatement.medicationCodeableConcept?.text),
    };
  }

  public buildKeyMedication(medication: r4.Medication): ResourceAndKey {
    const primary_coding = pickPrimaryCoding(medication.code, [
      "http://www.nlm.nih.gov/research/umls/rxnorm",
    ]);
    return {
      resource: medication,
      resourceType: medication.resourceType,
      identifier: pickIdentifier(medication.identifier) || medication.id,
      primary_code_system: primary_coding?.system,
      primary_code: primary_coding?.code,
      text: clean_text(medication.code?.text),
    };
  }

  public buildKeyProcedure(procedure: r4.Procedure): ResourceAndKey {
    const primary_coding = pickPrimaryCoding(procedure.code, [
      "http://snomed.info/sct",
      "http://www.icd10data.com/icd10pcs",
    ]);
    return {
      resource: procedure,
      resourceType: procedure.resourceType,
      identifier: pickIdentifier(procedure.identifier) || procedure.id,
      primary_code_system: primary_coding?.system,
      primary_code: primary_coding?.code,
      date: procedure.performedDateTime || procedure.performedPeriod?.start,
      text: clean_text(procedure.code?.text),
    };
  }

  public buildKeyAllergyInterolerance(
    allergyIntolerance: r4.AllergyIntolerance,
  ): ResourceAndKey {
    const allergyIntoleranceSystems = ["http://snomed.info/sct"];
    const primary_coding_allergy =
      pickPrimaryCoding(allergyIntolerance.code, allergyIntoleranceSystems) ||
      allergyIntolerance.reaction
        ?.map((reaction) =>
          pickPrimaryCoding(reaction.substance, allergyIntoleranceSystems),
        )
        ?.find((s) => !!s);
    return {
      resource: allergyIntolerance,
      resourceType: allergyIntolerance.resourceType,
      identifier:
        pickIdentifier(allergyIntolerance.identifier) || allergyIntolerance.id,
      primary_code_system: primary_coding_allergy?.system,
      primary_code: primary_coding_allergy?.code,
      date: allergyIntolerance.onsetDateTime || allergyIntolerance.recordedDate,
      text: clean_text(allergyIntolerance.code?.text),
    };
  }

  public buildKeyObservation(observation: r4.Observation): ResourceAndKey {
    const primary_coding_observation = pickPrimaryCoding(observation.code, [
      "http://loinc.org",
      "http://snomed.info/sct",
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

    return {
      resource: observation,
      resourceType: observation.resourceType,
      identifier: pickIdentifier(observation.identifier) || observation.id,
      primary_code_system: primary_coding_observation?.system,
      primary_code: primary_coding_observation?.code,
      date: observation.effectiveDateTime,
      text: clean_text(observation.code?.text),
      value: value,
    };
  }

  public buildKeyDiagnosticReport(
    diagnosticReport: r4.DiagnosticReport,
  ): ResourceAndKey {
    const primary_coding_diagnostic_report = pickPrimaryCoding(
      diagnosticReport.code,
      ["http://loinc.org", "http://snomed.info/sct"],
    );

    return {
      resource: diagnosticReport,
      resourceType: diagnosticReport.resourceType,
      identifier:
        pickIdentifier(diagnosticReport.identifier) || diagnosticReport.id,
      primary_code_system: primary_coding_diagnostic_report?.system,
      primary_code: primary_coding_diagnostic_report?.code,
      date: diagnosticReport.effectiveDateTime,
      text: clean_text(diagnosticReport.code?.text),
    };
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
