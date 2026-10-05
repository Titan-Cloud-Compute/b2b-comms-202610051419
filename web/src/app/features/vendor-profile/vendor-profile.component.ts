import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClient, MockApiClient } from '../../shared/api/api-client';

interface VendorProfile {
  id: string;
  companyName: string;
  contactEmail: string;
}

interface VendorDocument {
  id: string;
  filename: string;
  status: string;
}

@Component({
  selector: 'app-vendor-profile',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page vendor-profile-page" data-testid="vendor-profile-screen">
      <h1 class="page-title">Vendor Profile</h1>

      <section class="card">
        <h2 class="section-title">Company profile</h2>
        <p data-testid="vendor-profile-outcome">
          When you submit your company profile and contact details, the profile is stored and returns 201 with the created VendorProfile record.
        </p>
        <form class="form-stack" data-testid="vendor-profile-form" (ngSubmit)="submitProfile()">
          <label class="form-label">Company name
            <input class="form-control" name="companyName" data-testid="vendor-company-name" [(ngModel)]="companyName" required />
          </label>
          <label class="form-label">Contact email
            <input class="form-control" name="contactEmail" type="email" data-testid="vendor-contact-email" [(ngModel)]="contactEmail" required />
          </label>
          <button class="btn btn-primary" type="submit" data-testid="vendor-profile-submit" [disabled]="savingProfile">Save profile</button>
        </form>
        @if (profile) {
          <p data-testid="vendor-profile-saved">Saved {{ profile.companyName }} ({{ profile.contactEmail }}).</p>
        }
        @if (profileError) {
          <p class="alert alert-error" role="alert" data-testid="vendor-profile-error">{{ profileError }}</p>
        }
      </section>

      <section class="card">
        <h2 class="section-title">Compliance documents</h2>
        <p data-testid="vendor-document-outcome">
          When you upload a required compliance document, the document is stored with status "pending" and displays in the vendor document library.
        </p>
        <form class="form-stack" data-testid="vendor-document-upload" (ngSubmit)="uploadDocument()">
          <label class="form-label">Document
            <input type="file" data-testid="vendor-document-file" (change)="onFileSelected($event)" />
          </label>
          <button class="btn btn-primary" type="submit" data-testid="vendor-document-submit" [disabled]="!selectedFilename || uploading">Upload</button>
        </form>
        @if (documentError) {
          <p class="alert alert-error" role="alert" data-testid="vendor-document-error">{{ documentError }}</p>
        }

        <div data-testid="vendor-document-library">
          <h3>Document library</h3>
          @if (documents.length === 0) {
            <p>No documents uploaded yet.</p>
          } @else {
            <ul>
              @for (doc of documents; track doc.id) {
                <li data-testid="vendor-document-item">
                  {{ doc.filename }} — <span data-testid="vendor-document-status">{{ doc.status }}</span>
                </li>
              }
            </ul>
          }
        </div>
      </section>
    </div>
  `,
})
export class VendorProfileComponent implements OnInit {
  private readonly api = inject(ApiClient);

  companyName = '';
  contactEmail = '';
  profile: VendorProfile | null = null;
  profileError = '';
  savingProfile = false;

  selectedFilename = '';
  uploading = false;
  documentError = '';
  documents: VendorDocument[] = [];

  constructor() {
    if (this.api instanceof MockApiClient) registerVendorOnboardingMocks(this.api);
  }

  ngOnInit(): void {
    void this.loadDocuments();
  }

  async loadDocuments(): Promise<void> {
    try {
      const docs = await this.api.get<VendorDocument[]>('/api/vendor/documents');
      this.documents = Array.isArray(docs) ? docs : [];
    } catch {
      this.documents = [];
    }
  }

  async submitProfile(): Promise<void> {
    this.profileError = '';
    if (!this.companyName.trim() || !this.contactEmail.trim()) {
      this.profileError = 'Company name and contact email are required.';
      return;
    }
    this.savingProfile = true;
    try {
      this.profile = await this.api.post<VendorProfile>('/api/vendor/profile', {
        companyName: this.companyName.trim(),
        contactEmail: this.contactEmail.trim(),
      });
    } catch (e: any) {
      this.profileError = e?.message || 'Could not save profile.';
    } finally {
      this.savingProfile = false;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFilename = input.files?.[0]?.name ?? '';
  }

  async uploadDocument(): Promise<void> {
    this.documentError = '';
    if (!this.selectedFilename) return;
    this.uploading = true;
    try {
      await this.api.post<VendorDocument>('/api/vendor/documents', { filename: this.selectedFilename });
      this.selectedFilename = '';
      await this.loadDocuments();
    } catch (e: any) {
      this.documentError = e?.message || 'Could not upload document.';
    } finally {
      this.uploading = false;
    }
  }
}

function registerVendorOnboardingMocks(mock: MockApiClient): void {
  const docs: VendorDocument[] = [];
  let seq = 0;
  mock.registerMock('POST', '/api/vendor/profile', async (body) => {
    const b = body as { companyName: string; contactEmail: string };
    return { id: `mock-vp-${++seq}`, companyName: b.companyName, contactEmail: b.contactEmail };
  });
  mock.registerMock('POST', '/api/vendor/documents', async (body) => {
    const doc = { id: `mock-doc-${++seq}`, filename: (body as { filename: string }).filename, status: 'pending' };
    docs.unshift(doc);
    return doc;
  });
  mock.registerMock('GET', '/api/vendor/documents', async () => [...docs]);
}
