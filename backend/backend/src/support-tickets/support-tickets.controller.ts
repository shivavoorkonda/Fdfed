import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { RequestUser } from '../common/guards/roles.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { RespondTicketDto, UpdateTicketDto } from './dto/update-ticket.dto';
import { SupportTicketsService } from './support-tickets.service';

@ApiTags('Support Tickets')
@ApiSecurity('x-role')
@UseGuards(RolesGuard)
@Controller('support-tickets')
export class SupportTicketsController {
  constructor(private readonly tickets: SupportTicketsService) {}

  @Get()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'List platform support tickets for operations' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'category', required: false })
  findAll(@Query('status') status?: string, @Query('priority') priority?: string, @Query('category') category?: string) {
    return this.tickets.findAll({ status, priority, category });
  }

  @Get('my')
  @Roles('college_admin')
  @ApiOperation({ summary: 'Tickets raised by this college' })
  mine(@CurrentUser() user: RequestUser) {
    if (!user.collegeId) return [];
    return this.tickets.findForCollege(user.collegeId);
  }

  @Get('stats')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Support ticket operations statistics' })
  stats() { return this.tickets.stats(); }

  @Get(':id')
  @Roles('admin', 'college_admin', 'super_admin')
  @ApiOperation({ summary: 'View a support ticket and its conversation' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: RequestUser) {
    const ticket = this.tickets.findOne(id);
    if (user.role === 'college_admin' && ticket.collegeId !== user.collegeId) {
      throw new BadRequestException('This ticket belongs to another college');
    }
    return ticket;
  }

  @Post()
  @Roles('college_admin')
  @ApiOperation({ summary: 'Create a support ticket for platform operations' })
  @ApiBody({ type: CreateTicketDto })
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: RequestUser) {
    if (!user.userId || !user.collegeId) throw new BadRequestException('A college administrator account is required');
    return this.tickets.create(dto, user.userId, user.collegeId);
  }

  @Patch(':id/assign')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign a support ticket to the signed-in admin' })
  assignToSelf(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: RequestUser) {
    if (!user.userId) throw new BadRequestException('An admin account is required');
    return this.tickets.assignToSelf(id, user.userId);
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Update support ticket status or resolution' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTicketDto) {
    if (!dto.status) throw new BadRequestException('A ticket status is required');
    if (dto.status === 'resolved' && !dto.resolution?.trim()) throw new BadRequestException('Provide a resolution before resolving a ticket');
    return this.tickets.updateStatus(id, dto.status, dto.resolution);
  }

  @Post(':id/respond')
  @Roles('admin', 'college_admin')
  @ApiOperation({ summary: 'Add a response to a ticket conversation' })
  respond(@Param('id', ParseIntPipe) id: number, @Body() dto: RespondTicketDto, @CurrentUser() user: RequestUser) {
    const ticket = this.tickets.findOne(id);
    if (user.role === 'college_admin' && ticket.collegeId !== user.collegeId) throw new BadRequestException('This ticket belongs to another college');
    if (!user.userId) throw new BadRequestException('A signed-in user is required');
    return this.tickets.respond(id, user.userId, dto.message);
  }
}
