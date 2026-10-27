import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { CollegesModule } from '../colleges/colleges.module';
import { UsersModule } from '../users/users.module';
import { ApplicationsModule } from '../applications/applications.module';
import { SAMessagesRepository } from './super-admin.messages.repository';
import { ContactModule } from '../contact/contact.module';
import { SupportTicketsModule } from '../support-tickets/support-tickets.module';

@Module({
  imports: [CollegesModule, UsersModule, ApplicationsModule, ContactModule, SupportTicketsModule],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, SAMessagesRepository],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
