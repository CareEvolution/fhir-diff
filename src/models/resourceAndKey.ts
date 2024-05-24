import type { Resource, Coding, Reference } from 'fhir/r4';

export interface ResourceAndKey {
  reference: Reference;
  resource: Resource;
  resourceType: string;
  identifier?: string;
  primaryCodeSystem?: string;
  primaryCode?: string;
  primaryCoding?: Coding;
  dateTime?: string;
  date?: string;
  text?: string;
  value?: string;
}
