import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { TicketStatus } from '../support-tickets.repository';

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: ['open', 'in_progress', 'resolved', 'closed'] })
  @IsOptional() @IsIn(['open', 'in_progress', 'resolved', 'closed']) status?: TicketStatus;
  @ApiPropertyOptional({ example: 'The issue has been resolved.' })
  @IsOptional() @IsString() @Length(2, 3000) resolution?: string;
}

export class RespondTicketDto {
  @IsString() @Length(1, 3000) message: string;
}
