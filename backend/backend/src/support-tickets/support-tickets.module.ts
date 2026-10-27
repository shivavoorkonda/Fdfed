import { Module } from '@nestjs/common';
import { CollegesModule } from '../colleges/colleges.module';
import { UsersModule } from '../users/users.module';
import { SupportTicketsController } from './support-tickets.controller';
import { SupportTicketsRepository } from './support-tickets.repository';
import { SupportTicketsService } from './support-tickets.service';

@Module({
  imports: [UsersModule, CollegesModule],
  controllers: [SupportTicketsController],
  providers: [SupportTicketsRepository, SupportTicketsService],
  exports: [SupportTicketsService],
})
export class SupportTicketsModule {}
