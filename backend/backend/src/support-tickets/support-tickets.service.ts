import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityService } from '../activity/activity.service';
import { CollegesRepository } from '../colleges/colleges.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SupportTicketsRepository, TicketStatus } from './support-tickets.repository';

@Injectable()
export class SupportTicketsService {
  constructor(
    private readonly repo: SupportTicketsRepository,
    private readonly users: UsersRepository,
    private readonly colleges: CollegesRepository,
    private readonly activity: ActivityService,
  ) {}

  findAll(filters?: { status?: string; priority?: string; category?: string }) {
    return this.repo.findAll().filter((ticket) =>
      (!filters?.status || ticket.status === filters.status)
      && (!filters?.priority || ticket.priority === filters.priority)
      && (!filters?.category || ticket.category === filters.category),
    );
  }

  findOne(id: number) {
    const ticket = this.repo.findById(id);
    if (!ticket) throw new NotFoundException(`Support ticket ${id} not found`);
    return ticket;
  }

  findForCollege(collegeId: number) { return this.repo.findByCollege(collegeId); }

  stats() {
    const all = this.repo.findAll();
    const resolved = all.filter((ticket) => ticket.status === 'resolved' || ticket.status === 'closed');
    const averageResolutionHours = resolved.length
      ? Math.round(resolved.reduce((sum, ticket) => sum + Math.max(0, Date.parse(ticket.updatedAt) - Date.parse(ticket.createdAt)), 0) / resolved.length / 36e5 * 10) / 10
      : 0;
    return {
      total: all.length,
      open: all.filter((ticket) => ticket.status === 'open').length,
      inProgress: all.filter((ticket) => ticket.status === 'in_progress').length,
      resolved: resolved.length,
      urgent: all.filter((ticket) => ticket.priority === 'urgent' && !['resolved', 'closed'].includes(ticket.status)).length,
      averageResolutionHours,
    };
  }

  create(dto: CreateTicketDto, userId: number, collegeId: number) {
    const user = this.users.findById(userId);
    const college = this.colleges.findById(collegeId);
    if (!user || !college) throw new NotFoundException('College administrator or college not found');
    const ticket = this.repo.create({
      title: dto.title.trim(), description: dto.description.trim(), category: dto.category, priority: dto.priority,
      raisedBy: user.id, raisedByName: user.name, raisedByRole: user.role, collegeId, collegeName: college.name,
    });
    this.activity.log({ action: 'Support Ticket Created', detail: `${ticket.title} was raised by ${college.name}`, actor: user.name, actorRole: user.role, collegeId, type: 'system' });
    return ticket;
  }

  assignToSelf(id: number, userId: number) {
    const user = this.users.findById(userId);
    if (!user) throw new NotFoundException('Admin not found');
    const ticket = this.findOne(id);
    const updated = this.repo.update(id, { assignedTo: user.id, assignedToName: user.name, status: ticket.status === 'open' ? 'in_progress' : ticket.status })!;
    this.activity.log({ action: 'Support Ticket Assigned', detail: `${user.name} assigned themselves to ticket #${id}`, actor: user.name, actorRole: user.role, collegeId: ticket.collegeId, type: 'system' });
    return updated;
  }

  updateStatus(id: number, status: TicketStatus, resolution?: string) {
    const ticket = this.findOne(id);
    return this.repo.update(id, { status, ...(resolution ? { resolution: resolution.trim() } : {}) })!;
  }

  respond(id: number, userId: number, message: string) {
    const user = this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    this.findOne(id);
    const response = this.repo.addResponse(id, { userId: user.id, userName: user.name, userRole: user.role, message: message.trim() });
    if (!response) throw new NotFoundException(`Support ticket ${id} not found`);
    return this.findOne(id);
  }
}
