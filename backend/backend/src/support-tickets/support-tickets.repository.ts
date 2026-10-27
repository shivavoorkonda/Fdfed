import { Injectable } from '@nestjs/common';

export type TicketCategory = 'technical' | 'billing' | 'account' | 'feature_request' | 'general';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketResponse {
  id: number;
  ticketId: number;
  userId: number;
  userName: string;
  userRole: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: number;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  raisedBy: number;
  raisedByName: string;
  raisedByRole: string;
  collegeId: number;
  collegeName: string;
  assignedTo?: number;
  assignedToName?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  responses: TicketResponse[];
}

@Injectable()
export class SupportTicketsRepository {
  private tickets: SupportTicket[] = [
    {
      id: 1, title: 'Unable to upload student resumes', description: 'The placement cell cannot upload PDF resumes for several candidates.', category: 'technical', priority: 'high', status: 'open',
      raisedBy: 201, raisedByName: 'Dr. Ganesh Kumar', raisedByRole: 'college_admin', collegeId: 1, collegeName: 'IIIT Sri City',
      createdAt: '2026-10-24T07:30:00.000Z', updatedAt: '2026-10-24T07:30:00.000Z', responses: [],
    },
    {
      id: 2, title: 'Question about account billing', description: 'Please clarify the billing date and payment method for our organization account.', category: 'billing', priority: 'medium', status: 'in_progress',
      raisedBy: 203, raisedByName: 'Dr. Ramesh Sharma', raisedByRole: 'college_admin', collegeId: 3, collegeName: 'SRM Institute', assignedTo: 204, assignedToName: 'Rajesh Kumar',
      createdAt: '2026-10-22T09:15:00.000Z', updatedAt: '2026-10-25T11:20:00.000Z', responses: [{ id: 1, ticketId: 2, userId: 204, userName: 'Rajesh Kumar', userRole: 'admin', message: 'We are reviewing the invoice details and will update you shortly.', createdAt: '2026-10-25T11:20:00.000Z' }],
    },
    {
      id: 3, title: 'Add a new placement officer', description: 'We need guidance on creating a second placement officer account.', category: 'account', priority: 'low', status: 'resolved',
      raisedBy: 202, raisedByName: 'Dr. Priya Menon', raisedByRole: 'college_admin', collegeId: 2, collegeName: 'VIT University', assignedTo: 205, assignedToName: 'Priya Sharma', resolution: 'The college workspace now supports multiple officers.',
      createdAt: '2026-10-17T08:00:00.000Z', updatedAt: '2026-10-19T10:00:00.000Z', responses: [{ id: 2, ticketId: 3, userId: 205, userName: 'Priya Sharma', userRole: 'admin', message: 'Your request is complete. You can now add another officer from the Officers page.', createdAt: '2026-10-19T10:00:00.000Z' }],
    },
    {
      id: 4, title: 'Export placement report', description: 'Could the reports screen provide a downloadable CSV export?', category: 'feature_request', priority: 'medium', status: 'open',
      raisedBy: 201, raisedByName: 'Dr. Ganesh Kumar', raisedByRole: 'college_admin', collegeId: 1, collegeName: 'IIIT Sri City',
      createdAt: '2026-10-26T06:10:00.000Z', updatedAt: '2026-10-26T06:10:00.000Z', responses: [],
    },
    {
      id: 5, title: 'College admin cannot reset a student password', description: 'The administrator needs help guiding a student through a password reset.', category: 'account', priority: 'low', status: 'closed',
      raisedBy: 202, raisedByName: 'Dr. Priya Menon', raisedByRole: 'college_admin', collegeId: 2, collegeName: 'VIT University', assignedTo: 205, assignedToName: 'Priya Sharma', resolution: 'Shared the self-service password reset flow and confirmed the student can sign in.',
      createdAt: '2026-10-12T04:30:00.000Z', updatedAt: '2026-10-13T08:45:00.000Z', responses: [{ id: 3, ticketId: 5, userId: 205, userName: 'Priya Sharma', userRole: 'admin', message: 'The student can use Forgot password from the sign-in page. The reset has been verified.', createdAt: '2026-10-13T08:45:00.000Z' }],
    },
    {
      id: 6, title: 'Scheduled maintenance notification request', description: 'Please announce the planned network maintenance window to our placement stakeholders.', category: 'general', priority: 'high', status: 'in_progress',
      raisedBy: 203, raisedByName: 'Dr. Ramesh Sharma', raisedByRole: 'college_admin', collegeId: 3, collegeName: 'SRM Institute', assignedTo: 204, assignedToName: 'Rajesh Kumar',
      createdAt: '2026-10-25T12:00:00.000Z', updatedAt: '2026-10-26T10:00:00.000Z', responses: [{ id: 4, ticketId: 6, userId: 204, userName: 'Rajesh Kumar', userRole: 'admin', message: 'We will publish a targeted maintenance notice before the planned window.', createdAt: '2026-10-26T10:00:00.000Z' }],
    },
    {
      id: 7, title: 'Applicant count does not match report', description: 'The placement dashboard count is different from the report exported yesterday.', category: 'technical', priority: 'urgent', status: 'open',
      raisedBy: 201, raisedByName: 'Dr. Ganesh Kumar', raisedByRole: 'college_admin', collegeId: 1, collegeName: 'IIIT Sri City',
      createdAt: '2026-10-27T05:15:00.000Z', updatedAt: '2026-10-27T05:15:00.000Z', responses: [],
    },
    {
      id: 8, title: 'Request for a new analytics filter', description: 'Could reports be filtered by graduation batch and department together?', category: 'feature_request', priority: 'medium', status: 'resolved',
      raisedBy: 202, raisedByName: 'Dr. Priya Menon', raisedByRole: 'college_admin', collegeId: 2, collegeName: 'VIT University', assignedTo: 205, assignedToName: 'Priya Sharma', resolution: 'The request was recorded in the product backlog and the existing department report was shared.',
      createdAt: '2026-10-10T06:40:00.000Z', updatedAt: '2026-10-15T09:20:00.000Z', responses: [{ id: 5, ticketId: 8, userId: 205, userName: 'Priya Sharma', userRole: 'admin', message: 'Thank you. This is now tracked as a planned analytics improvement.', createdAt: '2026-10-15T09:20:00.000Z' }],
    },
  ];
  private nextId = 9;
  private nextResponseId = 6;

  findAll(): SupportTicket[] {
    return [...this.tickets].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }

  findById(id: number): SupportTicket | undefined { return this.tickets.find((ticket) => ticket.id === id); }
  findByCollege(collegeId: number): SupportTicket[] { return this.findAll().filter((ticket) => ticket.collegeId === collegeId); }

  create(data: Omit<SupportTicket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'responses'>): SupportTicket {
    const now = new Date().toISOString();
    const ticket: SupportTicket = { id: this.nextId++, ...data, status: 'open', createdAt: now, updatedAt: now, responses: [] };
    this.tickets.push(ticket);
    return ticket;
  }

  update(id: number, data: Partial<SupportTicket>): SupportTicket | undefined {
    const index = this.tickets.findIndex((ticket) => ticket.id === id);
    if (index < 0) return undefined;
    this.tickets[index] = { ...this.tickets[index], ...data, updatedAt: new Date().toISOString() };
    return this.tickets[index];
  }

  addResponse(ticketId: number, data: Omit<TicketResponse, 'id' | 'ticketId' | 'createdAt'>): TicketResponse | undefined {
    const ticket = this.findById(ticketId);
    if (!ticket) return undefined;
    const response: TicketResponse = { id: this.nextResponseId++, ticketId, ...data, createdAt: new Date().toISOString() };
    ticket.responses.push(response);
    ticket.updatedAt = response.createdAt;
    return response;
  }
}
