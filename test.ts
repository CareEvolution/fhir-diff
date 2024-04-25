import * as r4 from 'fhir/r4';
import { fhir_bundles_match } from ".";

const bundle1 :r4.Bundle = {
    resourceType: "Bundle",
    entry: [
        {
            resource: {
                resourceType: "Patient",
                id: "1"
            }
        },
        {
            resource: {
                resourceType: "Encounter",
                id: "A",
                "class": {
                    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                    code: "AMB",
                    display: "ambulatory"
                },
                "status": "finished",
            }
        }
    ],
    type: "searchset"
};

const bundle2 :r4.Bundle = {
    resourceType: "Bundle",
    entry: [
        {
            resource: {
                resourceType: "Patient",
                id: "1"
            }
        },{
            resource: {
                resourceType: "Encounter",
                id: "A",
                "class": {
                    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                    code: "IMP",
                    display: "inpatient"
                },
                "status": "finished",
            }
        }
    ],
    type: "searchset"
};

const match = fhir_bundles_match(bundle1, bundle2);

for (let ref of match.bundle1Only) {
    console.log(`bundle1Only: ${ref.reference}`);
}

for (let ref of match.common) {
    console.log(`common: ${ref.bundle1.reference} <=> ${ref.bundle2.reference}`);
}

for (let ref of match.bundle2Only) {
    console.log(`bundle2Only: ${ref.reference}`);
}   
