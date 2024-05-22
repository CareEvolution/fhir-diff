import type { Resource, Coding } from 'fhir/r4';

export interface ResourceAndKey {
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
