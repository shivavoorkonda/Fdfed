import { Injectable } from '@nestjs/common';

export interface WebsiteFeature {
  id: number;
  icon: string;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
}

export interface WebsiteTestimonial {
  id: number;
  name: string;
  role: string;
  college: string;
  text: string;
  avatar?: string;
  rating: number;
  isActive: boolean;
}

export interface WebsiteFaq {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

export type ContactStatus = 'new' | 'read' | 'replied' | 'archived';
export interface WebsiteContactSubmission {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  adminReply?: string;
  createdAt: string;
  repliedAt?: string;
}

@Injectable()
export class WebsiteContentRepository {
  private features: WebsiteFeature[] = [
    { id: 1, icon: 'LayoutDashboard', title: 'Unified placement workspace', description: 'Coordinate opportunities, students, recruiters and outcomes in one place.', order: 1, isActive: true },
    { id: 2, icon: 'BarChart3', title: 'Actionable analytics', description: 'Track placement trends and make informed decisions with live data.', order: 2, isActive: true },
    { id: 3, icon: 'ShieldCheck', title: 'Role-based security', description: 'Give every stakeholder only the tools and information they need.', order: 3, isActive: true },
  ];
  private testimonials: WebsiteTestimonial[] = [
    { id: 1, name: 'Dr. Ganesh Kumar', role: 'College Administrator', college: 'IIIT Sri City', text: 'CareerNest brings our complete placement workflow into one reliable, visible system.', rating: 5, isActive: true },
    { id: 2, name: 'Sneha Reddy', role: 'Alumni Mentor', college: 'IIIT Sri City', text: 'The referral and mentoring workflows make it much easier to give back to students.', rating: 5, isActive: true },
  ];
  private faqs: WebsiteFaq[] = [
    { id: 1, question: 'Who can use CareerNest?', answer: 'CareerNest supports colleges, placement teams, candidates, alumni and recruiter partners.', category: 'general', order: 1, isActive: true },
    { id: 2, question: 'How does a college get started?', answer: 'Submit an onboarding request and an administrator will review your details.', category: 'onboarding', order: 2, isActive: true },
  ];
  private contacts: WebsiteContactSubmission[] = [
    { id: 1, name: 'Meera Iyer', email: 'meera@northstar.edu.in', subject: 'CareerNest demo request', message: 'We would like to understand how CareerNest can support our upcoming placement season.', status: 'new', createdAt: '2026-10-25T09:30:00.000Z' },
    { id: 2, name: 'Arun Malhotra', email: 'arun@futureworks.in', subject: 'Recruiter partnership question', message: 'Please share the recommended workflow for connecting with participating colleges.', status: 'read', createdAt: '2026-10-22T11:00:00.000Z' },
  ];
  private nextFeatureId = 4;
  private nextTestimonialId = 3;
  private nextFaqId = 3;
  private nextContactId = 3;

  findFeatures(activeOnly = false) { return this.features.filter((item) => !activeOnly || item.isActive).sort((a, b) => a.order - b.order); }
  replaceFeatures(items: Array<Omit<WebsiteFeature, 'id'> & { id?: number }>) { this.features = items.map((item, index) => ({ ...item, id: item.id || this.nextFeatureId++, order: item.order ?? index + 1 })); return this.findFeatures(); }

  findTestimonials(activeOnly = false) { return this.testimonials.filter((item) => !activeOnly || item.isActive); }
  createTestimonial(data: Omit<WebsiteTestimonial, 'id'>) { const item = { id: this.nextTestimonialId++, ...data }; this.testimonials.push(item); return item; }
  updateTestimonial(id: number, data: Partial<WebsiteTestimonial>) { const index = this.testimonials.findIndex((item) => item.id === id); if (index < 0) return undefined; this.testimonials[index] = { ...this.testimonials[index], ...data, id }; return this.testimonials[index]; }
  deleteTestimonial(id: number) { const index = this.testimonials.findIndex((item) => item.id === id); if (index < 0) return false; this.testimonials.splice(index, 1); return true; }

  findFaqs(activeOnly = false) { return this.faqs.filter((item) => !activeOnly || item.isActive).sort((a, b) => a.order - b.order); }
  createFaq(data: Omit<WebsiteFaq, 'id'>) { const item = { id: this.nextFaqId++, ...data }; this.faqs.push(item); return item; }
  updateFaq(id: number, data: Partial<WebsiteFaq>) { const index = this.faqs.findIndex((item) => item.id === id); if (index < 0) return undefined; this.faqs[index] = { ...this.faqs[index], ...data, id }; return this.faqs[index]; }
  deleteFaq(id: number) { const index = this.faqs.findIndex((item) => item.id === id); if (index < 0) return false; this.faqs.splice(index, 1); return true; }

  findContacts() { return [...this.contacts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)); }
  createContact(data: Omit<WebsiteContactSubmission, 'id' | 'status' | 'createdAt'>) { const item: WebsiteContactSubmission = { id: this.nextContactId++, ...data, status: 'new', createdAt: new Date().toISOString() }; this.contacts.push(item); return item; }
  updateContact(id: number, data: Partial<WebsiteContactSubmission>) { const index = this.contacts.findIndex((item) => item.id === id); if (index < 0) return undefined; this.contacts[index] = { ...this.contacts[index], ...data, id }; return this.contacts[index]; }
}
