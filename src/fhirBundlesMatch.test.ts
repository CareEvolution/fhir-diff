import * as r4 from 'fhir/r4';
import { expect, test, describe } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fhirBundlesMatch } from '.';
import { FhirMatch } from './models/fhirMatch';

function expectMatch(match: FhirMatch, bundle1Ref: string, bundle2Ref: string) {
  const theMatch = match.common.find(
    (m) =>
      m.bundle1.reference === bundle1Ref && m.bundle2.reference === bundle2Ref,
  );

  if (!theMatch) {
    const badMatchForBundle1 = match.common.find(
      (m) => m.bundle1.reference === bundle1Ref,
    );

    if (badMatchForBundle1) {
      console.log(
        `Found bad match for bundle 1 ${bundle1Ref}: ${badMatchForBundle1.bundle2.reference} [${badMatchForBundle1.reason}]`,
      );
    }

    const badMatchForBundle2 = match.common.find(
      (m) => m.bundle2.reference === bundle2Ref,
    );

    if (badMatchForBundle2) {
      console.log(
        `Found bad match for bundle 2 ${bundle2Ref}: ${badMatchForBundle2.bundle1.reference} [${badMatchForBundle2.reason}]`,
      );
    }

    const bundle1 = match.bundle1Store.byFhirRef.get(bundle1Ref);
    const bundle2 = match.bundle2Store.byFhirRef.get(bundle2Ref);

    console.log(bundle1);
    console.log(bundle2);

    throw new Error(`Expected match between ${bundle1Ref} and ${bundle2Ref}`);
  }
}

describe('fhirBundlesMatch', () => {
  test('should match things between bundles', () => {
    const bundle1: r4.Bundle = {
      resourceType: 'Bundle',
      entry: [
        {
          resource: {
            id: '123',
            resourceType: 'Patient',
            identifier: [
              {
                system: 'http://example.com',
                value: '123456',
              },
            ],
          },
        },
      ],
      type: 'batch',
    };

    const bundle2: r4.Bundle = {
      resourceType: 'Bundle',
      entry: [
        {
          resource: {
            id: 'abcd',
            resourceType: 'Patient',
            identifier: [
              {
                system: 'http://example.com',
                value: '123456',
              },
            ],
          },
        },
      ],
      type: 'batch',
    };

    const fhirMatch = fhirBundlesMatch(bundle1, bundle2);

    expect(fhirMatch.bundle1Only.length).toBe(0);
    expect(fhirMatch.bundle2Only.length).toBe(0);
    expect(fhirMatch.common.length).toBe(1);
    expect(fhirMatch.common[0].bundle1.reference).toBe('Patient/123');
    expect(fhirMatch.common[0].bundle2.reference).toBe('Patient/abcd');
    expect(fhirMatch.common[0].reason).toBe('identifiers matched');
  });

  describe('should match things between known bundles', () => {
    test('careevolution and microsoft', () => {
      const dataPath = './data/synthetic';

      const bundle1 = JSON.parse(
        readFileSync(join(dataPath, 'careevolution.json'), 'utf8'),
      ) as r4.Bundle;
      const bundle2 = JSON.parse(
        readFileSync(join(dataPath, 'microsoft.json'), 'utf8'),
      ) as r4.Bundle;

      const match = fhirBundlesMatch(bundle1, bundle2);

      // match.bundle1Only.forEach((ref) =>
      //   console.log(`bundle1Only: ${ref.reference}`),
      // );

      // match.common.forEach((ref) =>
      //   console.log(
      //     `common: ${ref.bundle1.reference} <=> ${ref.bundle2.reference} [${ref.reason}]`,
      //   ),
      // );

      // match.bundle2Only.forEach((ref) =>
      //   console.log(`bundle2Only: ${ref.reference}`),
      // );

      expectMatch(
        match,
        'MedicationRequest/5565ac16-c63c-4314-adab-7d67437ac617',
        'MedicationStatement/193bf286-d45c-a0c6-f366-74f91efc3388',
      );

      expectMatch(
        match,
        'Patient/4176e464-6fdc-4666-b987-7b4172bc7c0e',
        'Patient/c1d19a38-f7ee-fdd1-80e3-ca0536be55ef',
      );
      expectMatch(
        match,
        'Condition/5.347b58ec1b99422e9621647f52228553',
        'Condition/5ee81fef-5228-9d25-3841-2d92edc06df2',
      );
      expectMatch(
        match,
        'DiagnosticReport/4.f754af09568d4a5ba8cb8adfdbb17fca',
        'DiagnosticReport/bfa5834f-51f9-78e1-df7c-cb52cdda9dac',
      );
      expectMatch(
        match,
        'Observation/2.e5292aa979ba41d2aecb8a561323517d',
        'Observation/11933e5d-f1a1-ea3d-0ef6-e286f00207dd',
      );
      expectMatch(
        match,
        'AllergyIntolerance/37d1bf60-2d8f-472d-adfd-8bf280283126',
        'AllergyIntolerance/23df8363-b150-0c37-d0e3-98b5311d4ff7',
      );
      expectMatch(
        match,
        'DiagnosticReport/4.a7142abfcb2c4a0a9982b3c5c0f88346',
        'DiagnosticReport/e5cc6935-4be2-bd16-dcf7-8032d6ed9804',
      );
      expectMatch(
        match,
        'DiagnosticReport/4.88c9f6ed743a435486a0a3a683b6d62b',
        'DiagnosticReport/a45b105c-7c71-352c-5a70-bf35bf5b0fc2',
      );
      expectMatch(
        match,
        'DiagnosticReport/4.e8c47d13c3fa4ba486499c2af631c640',
        'DiagnosticReport/03eeb1e6-b257-9234-e68c-fce5fac75e9b',
      );
      expectMatch(
        match,
        'Observation/2.87b26e22525f4e3a8d43b5e716cd5908',
        'Observation/179ca117-13ac-38b3-afaa-63a3481cdbf2',
      );
      expectMatch(
        match,
        'Observation/2.231eb3f2cff14f1d87119e64989328ae',
        'Observation/3eba3781-a604-afcc-4312-f2fe122508f4',
      );
      expectMatch(
        match,
        'Observation/2.39ab3646d7b546c28b198ca407c13006',
        'Observation/2987cbcd-147c-9b26-46b5-57f99b41524d',
      );
      expectMatch(
        match,
        'Observation/2.5c916c178eb94adea0524b4d2b9e2e0f',
        'Observation/f3819394-ff61-a8b0-6fa8-acdc70aeebd2',
      );
      expectMatch(
        match,
        'Observation/2.e02fa5caa8264002850f11d397e16932',
        'Observation/48ce9514-669a-91d4-88bf-ffb7d915f52f',
      );
      expectMatch(
        match,
        'Observation/2.6acbfb3d4e5d4a599cab033a6571f424',
        'Observation/ba5fbb70-4d8e-24c5-42c9-86145683f683',
      );
      expectMatch(
        match,
        'Procedure/7.c711293fa0694b8f9865fa2247284594',
        'Procedure/45cd38db-6012-4068-6155-18665355a40b',
      );
      expectMatch(
        match,
        'Procedure/7.67562bb2012244f681380defa98fbcb2',
        'Procedure/f784bbb7-bb4b-5d5e-dc72-c263d804bcd0',
      );
      expectMatch(
        match,
        'MedicationAdministration/ce10a4bb-d859-472e-85e9-fa78e383b744',
        'MedicationStatement/35ce7e24-8cff-c1fe-e908-74fa5bd88c7a',
      );
      expectMatch(
        match,
        'MedicationAdministration/a686db74-827d-4936-b398-27ed47148aa4',
        'MedicationStatement/3c21318a-c6cf-22e2-55ee-82305acd1868',
      );
      expectMatch(
        match,
        'MedicationRequest/5565ac16-c63c-4314-adab-7d67437ac617',
        'MedicationStatement/193bf286-d45c-a0c6-f366-74f91efc3388',
      );
      expectMatch(
        match,
        'MedicationRequest/8d0e40be-78d1-4711-a84b-4fcae18d361b',
        'MedicationStatement/43449fe2-0cf4-f5d6-b183-42a0f3306b7e',
      );
      expectMatch(
        match,
        'MedicationAdministration/3885ff9b-eed5-40b1-9ccd-add3c0211c8e',
        'MedicationStatement/6b488c8b-9d78-83dc-dd1c-5f921b5292d1',
      );

      expect(match.bundle1Only.map((m) => m.reference)).toEqual([
        'Encounter/4f9bfd32-f5bd-45a1-96e6-679017033b89',
        'Encounter/69e5503a-b450-4519-a9dc-4a63cd486ac6',
        'Practitioner/ca87692a-59f2-434c-a51e-618a9a86119c',
        'MedicationRequest/2214b125-6a7b-47bc-a503-c9b74a44f5eb',
        'MedicationRequest/a71de59e-98db-4b0d-a408-046716f0168c',
        'MedicationRequest/a5251097-9640-4312-9845-027b85dab4f7',
        'Procedure/7.3d4f2997d00047eab85769e40dc6d10b',
        'Procedure/7.32d71738f7204881b94a3e6bd9b1d45b',
      ]);

      expect(match.bundle2Only.map((m) => m.reference)).toEqual([
        'Organization/1ead1c85-34c9-57ba-285f-2a9dea43acf8',
        'Device/ddc4cf86-442b-f14f-6083-5a8953135d7b',
        'Organization/c338e857-85ae-7414-3417-084ad5156dcb',
        'Medication/dd7f8269-2d27-3ff6-012b-87a9e1d15fd1',
        'Medication/ca2da949-0d6f-fa4e-2ec7-d260c112988b',
        'Medication/cfe00b2c-a1ad-d094-2086-e12083efbd9a',
        'Medication/ab4b9d60-c85a-c3dc-a8e6-0a6b4cd6fcf0',
        'Medication/521387df-1672-0d0d-7de4-84ca84511098',
        'Observation/4c990874-9bd2-6625-260e-f01c2f38f7c9',
        'Procedure/9c9a4cb4-5f0e-6677-9162-9c2119bb7d12',
        'Procedure/0cab07d6-91f8-9632-ae4b-d3263cbe2248',
        'DocumentReference/153e098e-83d6-65ff-da2e-b5eac2e4c607',
      ]);
    });

    test('careevolution and health_samurai', () => {
      const dataPath = './data/synthetic';

      const bundle1 = JSON.parse(
        readFileSync(join(dataPath, 'careevolution.json'), 'utf8'),
      ) as r4.Bundle;
      const bundle2 = JSON.parse(
        readFileSync(join(dataPath, 'health_samurai_1.json'), 'utf8'),
      ) as r4.Bundle;

      const match = fhirBundlesMatch(bundle1, bundle2);

      // match.bundle1Only.forEach((ref) =>
      //   console.log(`bundle1Only: ${ref.reference}`),
      // );

      // match.common.forEach((ref) =>
      //   console.log(
      //     `common: ${ref.bundle1.reference} <=> ${ref.bundle2.reference} [${ref.reason}]`,
      //   ),
      // );

      // match.bundle2Only.forEach((ref) =>
      //   console.log(`bundle2Only: ${ref.reference}`),
      // );

      expect(match.common.length).toBe(16);

      expectMatch(
        match,
        'Patient/4176e464-6fdc-4666-b987-7b4172bc7c0e',
        'Patient/patient',
      );
      expectMatch(
        match,
        'Encounter/4f9bfd32-f5bd-45a1-96e6-679017033b89',
        'Encounter/2d031eac-f775-b1bc-fffe-f3f9a90ad0a3',
      );
      expectMatch(
        match,
        'Encounter/69e5503a-b450-4519-a9dc-4a63cd486ac6',
        'Encounter/f5ddea8f-977e-f542-3408-25b3f2a78baf',
      );
      expectMatch(
        match,
        'Observation/2.e5292aa979ba41d2aecb8a561323517d',
        'Observation/4e43fa06-acc1-d1ed-9ff7-3fefc27b0ba9',
      );
      expectMatch(
        match,
        'Observation/2.87b26e22525f4e3a8d43b5e716cd5908',
        'Observation/bd2339d5-3bf1-d3c0-5115-fc66290a9cb2',
      );
      expectMatch(
        match,
        'Observation/2.231eb3f2cff14f1d87119e64989328ae',
        'Observation/8a0e8d33-1ab7-6cb7-1ed8-500e1aa12880',
      );
      expectMatch(
        match,
        'Observation/2.39ab3646d7b546c28b198ca407c13006',
        'Observation/3b7561b9-2cb0-a7c2-eeb7-8270939ea03a',
      );
      expectMatch(
        match,
        'Observation/2.5c916c178eb94adea0524b4d2b9e2e0f',
        'Observation/a2af6714-fcc6-308d-84b6-bade108dfa70',
      );
      expectMatch(
        match,
        'Observation/2.e02fa5caa8264002850f11d397e16932',
        'Observation/9f76f28f-c676-6649-300d-cd2f7b32c028',
      );
      expectMatch(
        match,
        'Observation/2.6acbfb3d4e5d4a599cab033a6571f424',
        'Observation/663c6a21-2ddf-d195-cd35-14fe98d43021',
      );
      expectMatch(
        match,
        'Procedure/7.c711293fa0694b8f9865fa2247284594',
        'Procedure/dab6e73d-1940-fa2c-12dc-cfb3318e6aa2',
      );
      expectMatch(
        match,
        'Procedure/7.67562bb2012244f681380defa98fbcb2',
        'Procedure/26b2ff9e-9b02-fe28-3f27-a910af26318e',
      );
      expectMatch(
        match,
        'MedicationRequest/5565ac16-c63c-4314-adab-7d67437ac617',
        'MedicationStatement/6f83279e-5af2-80f1-08e1-a56c0a6dda31',
      );
      expectMatch(
        match,
        'MedicationRequest/8d0e40be-78d1-4711-a84b-4fcae18d361b',
        'MedicationStatement/d6bc332c-a2e8-68cb-3542-a3a985a92c85',
      );
      expectMatch(
        match,
        'MedicationAdministration/a686db74-827d-4936-b398-27ed47148aa4',
        'MedicationAdministration/09f57d90-7b6c-0a0c-0973-a23239408e3a',
      );

      expect(match.bundle1Only.map((m) => m.reference)).toEqual([
        'AllergyIntolerance/37d1bf60-2d8f-472d-adfd-8bf280283126',
        'Condition/5.347b58ec1b99422e9621647f52228553',
        'DiagnosticReport/4.a7142abfcb2c4a0a9982b3c5c0f88346',
        'DiagnosticReport/4.88c9f6ed743a435486a0a3a683b6d62b',
        'DiagnosticReport/4.e8c47d13c3fa4ba486499c2af631c640',
        'DiagnosticReport/4.f754af09568d4a5ba8cb8adfdbb17fca',
        'Practitioner/ca87692a-59f2-434c-a51e-618a9a86119c',
        'MedicationAdministration/ce10a4bb-d859-472e-85e9-fa78e383b744',
        'MedicationRequest/2214b125-6a7b-47bc-a503-c9b74a44f5eb',
        'MedicationRequest/a71de59e-98db-4b0d-a408-046716f0168c',
        'MedicationRequest/a5251097-9640-4312-9845-027b85dab4f7',
        'Procedure/7.3d4f2997d00047eab85769e40dc6d10b',
        'Procedure/7.32d71738f7204881b94a3e6bd9b1d45b',
      ]);

      expect(match.bundle2Only.map((m) => m.reference)).toEqual([
        'Procedure/0b52ead7-41ab-4951-e696-79da26b461b2',
        'Procedure/b062e809-4a75-5c26-1d4f-336f2891237e',
        'Organization/1.3.6.1.4.1.37608',
        'Encounter/66fbf518-f24b-7819-c7d6-072df459eb10',
        'MedicationAdministration/8e60b004-7209-b158-79a2-4308206b1f79',
        'AllergyIntolerance/58ba1d37-5874-cd3a-c446-e57e429fb271',
        'PractitionerRole/a56d19b4-71cb-84e5-ba18-197715dedefa',
        'PractitionerRole/WVHIN',
        'Practitioner/be633384-8138-5548-7c96-f7ef99b5695d',
        'Practitioner/WVHIN',
        'Condition/225bcfcf-0850-c8a2-60db-d73854b117cc',
        'Observation/7621da5c-44b0-8c90-3431-730ce0179af7',
        'Observation/5a9b6f97-fc75-1fac-3566-b483d8b6895b',
        'Observation/0057a015-560a-7d64-22de-6e0e589f3b36',
        'Observation/22476306-f0c3-ee02-00cd-a385448818e0',
        'Observation/c185ed25-8382-446f-92fd-a6779cde15f5',
      ]);
    });
  });
});
