import { VendorOnboardingService } from './vendor-onboarding.service';

describe('VendorOnboardingService', () => {
  function build() {
    const profiles: any[] = [];
    const docs: any[] = [];
    let n = 0;
    const prisma: any = {
      vendorProfile: {
        upsert: async ({ where, create, update }: any) => {
          const existing = profiles.find((p) => p.userId === where.userId);
          if (existing) return Object.assign(existing, update);
          const p = { id: `vp-${++n}`, ...create };
          profiles.push(p);
          return p;
        },
        findUnique: async ({ where }: any) => profiles.find((p) => p.userId === where.userId) ?? null,
      },
      document: {
        create: async ({ data }: any) => {
          const d = { id: `doc-${++n}`, createdAt: new Date(), ...data };
          docs.push(d);
          return d;
        },
        findMany: async ({ where }: any) => docs.filter((d) => d.vendorProfileId === where.vendorProfileId),
      },
    };
    return new VendorOnboardingService(prisma);
  }

  it('stores the profile for the session user and returns the record', async () => {
    const svc = build();
    const res = await svc.createProfile('u1', { companyName: 'Acme', contactEmail: 'a@acme.test' });
    expect(res).toEqual({ id: expect.any(String), companyName: 'Acme', contactEmail: 'a@acme.test' });
  });

  it('rejects a profile missing fields', async () => {
    await expect(build().createProfile('u1', { companyName: '', contactEmail: '' })).rejects.toThrow();
  });

  it('stores an uploaded document as pending and lists it in the library', async () => {
    const svc = build();
    await svc.createProfile('u1', { companyName: 'Acme', contactEmail: 'a@acme.test' });
    const doc = await svc.createDocument('u1', { filename: 'iso9001.pdf' });
    expect(doc.status).toBe('pending');
    expect(await svc.listDocuments('u1')).toEqual([{ id: doc.id, filename: 'iso9001.pdf', status: 'pending' }]);
    expect(await svc.listDocuments('u2')).toEqual([]);
  });

  it('refuses documents before a profile exists', async () => {
    await expect(build().createDocument('u1', { filename: 'x.pdf' })).rejects.toThrow();
  });
});
