const medicationResourceTypes = [
  'MedicationRequest',
  'MedicationStatement',
  'MedicationAdministration',
  'Medication',
];

const labResourceTypes = ['Observation', 'DiagnosticReport'];

export function getResourceTypeGroup(
  resourceType: string,
): string[] | undefined {
  if (medicationResourceTypes.includes(resourceType)) {
    return medicationResourceTypes;
  }
  if (labResourceTypes.includes(resourceType)) {
    return labResourceTypes;
  }
  return undefined;
}
