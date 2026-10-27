import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PlatformAnnouncementsController } from './platform-announcements.controller';
import { PlatformAnnouncementsRepository } from './platform-announcements.repository';
import { PlatformAnnouncementsService } from './platform-announcements.service';

@Module({ imports: [UsersModule], controllers: [PlatformAnnouncementsController], providers: [PlatformAnnouncementsRepository, PlatformAnnouncementsService], exports: [PlatformAnnouncementsService] })
export class PlatformAnnouncementsModule {}
