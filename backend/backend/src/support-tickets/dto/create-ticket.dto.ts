import { IsIn, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { TicketCategory, TicketPriority } from '../support-tickets.repository';

export class CreateTicketDto {
  @ApiProperty({ example: 'Unable to upload resumes' })
  @IsString() @Length(4, 120) title: string;
  @ApiProperty({ example: 'The placement cell cannot upload PDF resumes.' })
  @IsString() @Length(10, 3000) description: string;
  @ApiProperty({ enum: ['technical', 'billing', 'account', 'feature_request', 'general'] })
  @IsIn(['technical', 'billing', 'account', 'feature_request', 'general']) category: TicketCategory;
  @ApiProperty({ enum: ['low', 'medium', 'high', 'urgent'] })
  @IsIn(['low', 'medium', 'high', 'urgent']) priority: TicketPriority;
}
