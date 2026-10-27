import { Injectable } from '@nestjs/common';

export type OnboardingStatus = 'pending' | 'approved' | 'rejected';

export interface OnboardingRequest {
  id: number;
  collegeName: string;
  collegeCode: string;
  collegeEmail: string;
  collegePhone?: string;
  collegeAddress?: string;
  collegeWebsite?: string;
  contactName: string;
  contactEmail: string;
  contactDesignation: string;
  contactPhone?: string;
  expectedStudents?: string;
  message?: string;
  status: OnboardingStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdCollegeId?: number;
  createdAdminId?: number;
}

@Injectable()
export class OnboardingRequestsRepository {
  private requests: OnboardingRequest[] = [];
  private nextId = 1;

  findAll(): OnboardingRequest[] {
    return [...this.requests].sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
  }

  findById(id: number): OnboardingRequest | undefined {
    return this.requests.find((request) => request.id === id);
  }

  create(data: Omit<OnboardingRequest, 'id' | 'status' | 'submittedAt'>): OnboardingRequest {
    const request: OnboardingRequest = { id: this.nextId++, ...data, status: 'pending', submittedAt: new Date().toISOString() };
    this.requests.push(request);
    return request;
  }

  update(id: number, data: Partial<OnboardingRequest>): OnboardingRequest | undefined {
    const index = this.requests.findIndex((request) => request.id === id);
    if (index < 0) return undefined;
    this.requests[index] = { ...this.requests[index], ...data };
    return this.requests[index];
  }
}
