import { Injectable, NotFoundException } from '@nestjs/common';
import { PlatformAnnouncement, PlatformAnnouncementsRepository } from './platform-announcements.repository';

@Injectable()
export class PlatformAnnouncementsService {
  constructor(private readonly repository: PlatformAnnouncementsRepository) {}
  getAll() { return this.repository.findAll(); }
  getVisible(role: string, collegeId: number | null) {
    const now = Date.now();
    return this.repository.findAll().filter((announcement) => announcement.isActive
      && (!announcement.expiresAt || Date.parse(announcement.expiresAt) > now)
      && (announcement.targetRoles.length === 0 || announcement.targetRoles.includes(role))
      && (announcement.targetColleges.length === 0 || (collegeId != null && announcement.targetColleges.includes(collegeId))));
  }
  create(data: Omit<PlatformAnnouncement, 'id' | 'createdAt'>) { return this.repository.create(data); }
  update(id: number, data: Partial<PlatformAnnouncement>) { const item = this.repository.update(id, data); if (!item) throw new NotFoundException(`Platform announcement ${id} not found`); return item; }
  remove(id: number) { if (!this.repository.remove(id)) throw new NotFoundException(`Platform announcement ${id} not found`); return { message: 'Platform announcement deleted' }; }
}
