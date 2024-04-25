import * as r4 from 'fhir/r4';

export interface ResourceAndKey {
    resource: r4.Resource;
    resourceType: string;
    identifier?: string;
    primary_code_system?: string;
    primary_code?: string;
    date?: string;
}
