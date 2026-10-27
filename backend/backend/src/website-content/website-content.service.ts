import { Injectable, NotFoundException } from '@nestjs/common';
import { WebsiteContentRepository, WebsiteFeature, WebsiteFaq, WebsiteTestimonial } from './website-content.repository';

@Injectable()
export class WebsiteContentService {
  constructor(private readonly repository: WebsiteContentRepository) {}
  getFeatures(publicOnly = false) { return this.repository.findFeatures(publicOnly); }
  replaceFeatures(features: Array<Omit<WebsiteFeature, 'id'> & { id?: number }>) { return this.repository.replaceFeatures(features); }
  getTestimonials(publicOnly = false) { return this.repository.findTestimonials(publicOnly); }
  createTestimonial(data: Omit<WebsiteTestimonial, 'id'>) { return this.repository.createTestimonial(data); }
  updateTestimonial(id: number, data: Partial<WebsiteTestimonial>) { const item = this.repository.updateTestimonial(id, data); if (!item) throw new NotFoundException(`Testimonial ${id} not found`); return item; }
  deleteTestimonial(id: number) { if (!this.repository.deleteTestimonial(id)) throw new NotFoundException(`Testimonial ${id} not found`); return { message: 'Testimonial deleted' }; }
  getFaqs(publicOnly = false) { return this.repository.findFaqs(publicOnly); }
  createFaq(data: Omit<WebsiteFaq, 'id'>) { return this.repository.createFaq(data); }
  updateFaq(id: number, data: Partial<WebsiteFaq>) { const item = this.repository.updateFaq(id, data); if (!item) throw new NotFoundException(`FAQ ${id} not found`); return item; }
  deleteFaq(id: number) { if (!this.repository.deleteFaq(id)) throw new NotFoundException(`FAQ ${id} not found`); return { message: 'FAQ deleted' }; }
  getContacts() { return this.repository.findContacts(); }
  createContact(data: { name: string; email: string; subject: string; message: string }) { return this.repository.createContact(data); }
  updateContact(id: number, data: { status?: 'new' | 'read' | 'replied' | 'archived'; adminReply?: string }) { return this.repository.updateContact(id, { ...data, ...(data.adminReply ? { repliedAt: new Date().toISOString(), status: 'replied' } : {}) }) ?? (() => { throw new NotFoundException(`Contact ${id} not found`); })(); }
}
