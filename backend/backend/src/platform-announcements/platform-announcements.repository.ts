import { Injectable } from '@nestjs/common';

export type PlatformAnnouncementType = 'info' | 'warning' | 'maintenance' | 'update';
export interface PlatformAnnouncement {
  id: number;
  title: string;
  message: string;
  type: PlatformAnnouncementType;
  targetRoles: string[];
  targetColleges: number[];
  isActive: boolean;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  expiresAt?: string;
}

@Injectable()
export class PlatformAnnouncementsRepository {
  private announcements: PlatformAnnouncement[] = [
    { id: 1, title: 'Welcome to the updated CareerNest platform', message: 'New workflows and tools are now available across the placement ecosystem.', type: 'update', targetRoles: [], targetColleges: [], isActive: true, createdBy: 0, createdByName: 'Platform Operations', createdAt: '2026-10-01T09:00:00.000Z' },
  ];
  private nextId = 2;
  findAll() { return [...this.announcements].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)); }
  findById(id: number) { return this.announcements.find((item) => item.id === id); }
  create(data: Omit<PlatformAnnouncement, 'id' | 'createdAt'>) { const item: PlatformAnnouncement = { id: this.nextId++, ...data, createdAt: new Date().toISOString() }; this.announcements.push(item); return item; }
  update(id: number, data: Partial<PlatformAnnouncement>) { const index = this.announcements.findIndex((item) => item.id === id); if (index < 0) return undefined; this.announcements[index] = { ...this.announcements[index], ...data, id }; return this.announcements[index]; }
  remove(id: number) { const index = this.announcements.findIndex((item) => item.id === id); if (index < 0) return false; this.announcements.splice(index, 1); return true; }
}
