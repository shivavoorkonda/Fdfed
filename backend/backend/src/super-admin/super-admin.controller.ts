import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, ParseIntPipe, UseGuards, HttpCode, HttpStatus, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiSecurity, ApiResponse } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { CollegesService } from '../colleges/colleges.service';
import { CreateCollegeDto } from '../colleges/dto/create-college.dto';
import { UpdateCollegeDto } from '../colleges/dto/update-college.dto';
import { CollegeStatusDto } from '../colleges/dto/college-status.dto';
import { CreateCollegeAdminDto } from './dto/create-college-admin.dto';
import { UpdateCollegeAdminDto } from './dto/update-college-admin.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SAMessagesRepository } from './super-admin.messages.repository';
import { ActivityService } from '../activity/activity.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/guards/roles.guard';
import { UsersRepository } from '../users/users.repository';
import { IsString, IsOptional, IsNumber, IsEmail, Length } from 'class-validator';
import { OnboardingRequestsRepository } from '../contact/onboarding-requests.repository';
import { SupportTicketsService } from '../support-tickets/support-tickets.service';

class SendMessageDto {
  @IsIn(['one', 'all']) toType: 'one' | 'all';
  @IsOptional() @IsNumber() toCollegeId?: number;
  @IsOptional() @IsString() toCollegeName?: string;
  @IsString() @Length(3, 120, { message: 'Subject must be 3–120 characters' }) subject: string;
  @IsString() @Length(5, 2000, { message: 'Message must be 5–2000 characters' }) message: string;
}

class AdminStatusDto {
  @ApiProperty({ enum: ['active', 'inactive'] })
  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive';
}

class ReviewOnboardingDto {
  @IsOptional() @IsString() @Length(0, 1000) note?: string;
}

class PlatformAdminDto {
  @IsOptional() @IsString() @Length(2, 100) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @Length(2, 100) department?: string;
  @IsOptional() @IsString() @Length(3, 30) phone?: string;
  @IsOptional() @IsString() @Length(3, 100) password?: string;
  @IsOptional() @IsIn(['active', 'inactive']) status?: 'active' | 'inactive';
}

@ApiTags('Super Admin')
@ApiSecurity('x-role')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('super-admin')
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
    private readonly collegesService: CollegesService,
    private readonly messagesRepo: SAMessagesRepository,
    private readonly activityRepo: ActivityService,
    private readonly usersRepo: UsersRepository,
    private readonly onboardingRequests: OnboardingRequestsRepository,
    private readonly tickets: SupportTicketsService,
  ) {}

  private who(u: RequestUser) { return this.usersRepo.findById(u.userId ?? 0)?.name ?? 'Super admin'; }
  private log(u: RequestUser, action: string, detail: string, type: 'college' | 'admin' | 'message', collegeId?: number) {
    this.activityRepo.log({ action, detail, actor: this.who(u), actorRole: u.role, collegeId: collegeId ?? null, type });
  }

  // ── Platform Stats ─────────────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide statistics (super_admin only)' })
  getStats() {
    return this.superAdminService.getPlatformStats();
  }

  // â”€â”€ Observer-only admin workload endpoints â”€â”€
  @Get('admins')
  @Roles('super_admin')
  @ApiOperation({ summary: 'List platform administrators for observer oversight' })
  getAdmins() {
    return this.superAdminService.getPlatformAdmins();
  }

  @Post('admins')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a platform admin' })
  createPlatformAdmin(@Body() dto: PlatformAdminDto, @CurrentUser() user: RequestUser) {
    if (!dto.name || !dto.email) throw new BadRequestException('Name and email are required');
    const created = this.superAdminService.createPlatformAdmin(dto as Required<Pick<PlatformAdminDto, 'name' | 'email'>> & PlatformAdminDto);
    this.log(user, 'Platform Admin Created', `${created.name} was added to the Admin team`, 'admin');
    return created;
  }

  @Put('admins/:id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update a platform admin' })
  updatePlatformAdmin(@Param('id', ParseIntPipe) id: number, @Body() dto: PlatformAdminDto, @CurrentUser() user: RequestUser) {
    const updated = this.superAdminService.updatePlatformAdmin(id, dto);
    this.log(user, 'Platform Admin Updated', `${updated.name} was updated`, 'admin');
    return updated;
  }

  @Delete('admins/:id')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a platform admin' })
  removePlatformAdmin(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: RequestUser) {
    const admin = this.superAdminService.updatePlatformAdmin(id, {});
    const removed = this.superAdminService.removePlatformAdmin(id);
    this.log(user, 'Platform Admin Deleted', `${admin.name} was removed from the Admin team`, 'admin');
    return { removed };
  }

  @Get('admin-stats')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Administrator workload and support ownership for observer oversight' })
  getAdminStats() {
    const tickets = this.tickets.findAll();
    const activity = this.activityRepo.findAll();
    const today = new Date().toISOString().slice(0, 10);
    const admins = this.usersRepo.findAll().filter((user) => user.role === 'admin').map(({ password: _password, ...user }) => {
      const recentActions = activity.filter((entry) => entry.actorRole === 'admin' && entry.actor === user.name);
      const ownedTickets = tickets.filter((ticket) => ticket.assignedTo === user.id);
      return {
        ...user,
        openTickets: ownedTickets.filter((ticket) => !['resolved', 'closed'].includes(ticket.status)).length,
        resolvedTickets: ownedTickets.filter((ticket) => ['resolved', 'closed'].includes(ticket.status)).length,
        actionsToday: recentActions.filter((entry) => entry.timestamp.slice(0, 10) === today).length,
        recentActions: recentActions.slice(0, 5),
      };
    });
    return {
      totalAdmins: admins.length,
      activeAdmins: admins.filter((admin) => admin.status !== 'inactive').length,
      unassignedOpenTickets: tickets.filter((ticket) => !ticket.assignedTo && !['resolved', 'closed'].includes(ticket.status)).length,
      admins,
    };
  }

  // ── Colleges ───────────────────────────────────────────────────────────────
  @Get('colleges')
  @ApiOperation({ summary: 'All colleges with admin info and per-college stats (super_admin only)' })
  getAllColleges() {
    return this.superAdminService.getAllCollegesWithAdmins();
  }

  @Post('colleges')
  @ApiOperation({ summary: 'Create a new college (super_admin only)' })
  @ApiBody({ type: CreateCollegeDto })
  @ApiResponse({ status: 201 })
  createCollege(@Body() dto: CreateCollegeDto, @CurrentUser() u: RequestUser) {
    const created = this.collegesService.create(dto);
    this.log(u, 'College Created', `${created.name} (${created.code}) was registered on the platform`, 'college', created.id);
    return created;
  }

  @Get('colleges/:id')
  @ApiOperation({ summary: 'Single college with admin + stats (super_admin only)' })
  @ApiParam({ name: 'id', type: Number })
  getCollege(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.getCollegeWithAdmin(id);
  }

  @Put('colleges/:id')
  @ApiOperation({ summary: 'Update college details (super_admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateCollegeDto })
  updateCollege(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCollegeDto, @CurrentUser() u: RequestUser) {
    const updated = this.collegesService.update(id, dto);
    this.log(u, 'College Updated', `${updated.name} details were updated`, 'college', id);
    return updated;
  }

  @Patch('colleges/:id/status')
  @ApiOperation({ summary: 'Update college status (super_admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CollegeStatusDto })
  updateCollegeStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: CollegeStatusDto, @CurrentUser() u: RequestUser) {
    const updated = this.collegesService.updateStatus(id, dto.status);
    this.log(u, 'College Status Updated', `${updated.name} status set to ${dto.status}`, 'college', id);
    return updated;
  }

  @Delete('colleges/:id')
  @Roles('super_admin', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a college (super_admin only)' })
  @ApiParam({ name: 'id', type: Number })
  deleteCollege(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: RequestUser) {
    const name = this.collegesService.findOne(id).name;
    const result = this.collegesService.remove(id);
    this.log(u, 'College Deleted', `${name} was removed from the platform`, 'college');
    return result;
  }

  // ── College Admins ─────────────────────────────────────────────────────────
  @Get('colleges/:id/admin')
  @ApiOperation({ summary: 'Get the college admin for a college (super_admin only)' })
  @ApiParam({ name: 'id', type: Number })
  getCollegeAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.getCollegeAdmin(id);
  }

  @Post('colleges/:id/admin')
  @ApiOperation({ summary: 'Create/assign a college admin (super_admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateCollegeAdminDto })
  @ApiResponse({ status: 201 })
  createCollegeAdmin(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateCollegeAdminDto, @CurrentUser() u: RequestUser) {
    const admin = this.superAdminService.createCollegeAdmin(id, dto);
    this.log(u, 'College Admin Assigned', `${admin.name} assigned as admin for ${this.collegesService.findOne(id).name}`, 'admin', id);
    return admin;
  }

  @Put('colleges/:id/admin')
  @ApiOperation({ summary: 'Update college admin details (super_admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateCollegeAdminDto })
  updateCollegeAdmin(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCollegeAdminDto) {
    return this.superAdminService.updateCollegeAdmin(id, dto);
  }

  @Patch('colleges/:id/admin/status')
  @ApiOperation({ summary: 'Activate/deactivate college admin (super_admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: AdminStatusDto })
  toggleCollegeAdminStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminStatusDto, @CurrentUser() u: RequestUser) {
    const admin = this.superAdminService.toggleCollegeAdminStatus(id, dto.status);
    this.log(u, 'Admin Status Updated', `${admin.name} (${this.collegesService.findOne(id).name}) set to ${dto.status}`, 'admin', id);
    return admin;
  }

  // ── College Users ──────────────────────────────────────────────────────────
  @Get('colleges/:id/users')
  @ApiOperation({ summary: 'Get all users of a specific college (super_admin only)' })
  @ApiParam({ name: 'id', type: Number })
  getCollegeUsers(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.getCollegeUsers(id);
  }

  // ── Messages ───────────────────────────────────────────────────────────────
  @Get('messages')
  @ApiOperation({ summary: 'Get all messages sent by super admin' })
  getMessages() {
    return this.messagesRepo.findAll();
  }

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message to one or all college admins (super_admin only)' })
  @ApiBody({ schema: { example: { toType: 'one', toCollegeId: 1, toCollegeName: 'IIIT Sri City', subject: 'Hello', message: 'Test message' } } })
  sendMessage(@Body() body: SendMessageDto, @CurrentUser() u: RequestUser) {
    if (body.toType === 'one') {
      if (!body.toCollegeId) throw new BadRequestException('Choose a college to message');
      body.toCollegeName = this.collegesService.findOne(body.toCollegeId).name;
    }
    const msg = this.messagesRepo.create(body);
    this.log(u, 'Message Sent',
      body.toType === 'all' ? `Broadcast to all college admins: "${body.subject}"` : `Message to ${body.toCollegeName}: "${body.subject}"`,
      'message', body.toCollegeId);
    return msg;
  }

  /** What a college admin sees in their Messages page. */
  @Get('inbox')
  @Roles('college_admin')
  @ApiOperation({ summary: 'Messages from the super admin addressed to this college (college_admin)' })
  inbox(@CurrentUser() u: RequestUser) {
    return this.messagesRepo.findForCollege(u.collegeId);
  }

  // ── Activity Log ───────────────────────────────────────────────────────────
  @Get('activity')
  @ApiOperation({ summary: 'Get platform activity log (super_admin only)' })
  getActivity() {
    return this.activityRepo.findAll();
  }

  // ── College onboarding requests ────────────────────────────────────────
  @Get('onboarding-requests')
  @ApiOperation({ summary: 'All college onboarding requests (super_admin only)' })
  getOnboardingRequests() {
    return this.onboardingRequests.findAll();
  }

  @Patch('onboarding-requests/:id/approve')
  @ApiOperation({ summary: 'Approve onboarding and create the college plus its admin' })
  approveOnboarding(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReviewOnboardingDto,
    @CurrentUser() user: RequestUser,
  ) {
    const request = this.onboardingRequests.findById(id);
    if (!request) throw new NotFoundException(`Onboarding request ${id} not found`);
    if (request.status !== 'pending') throw new BadRequestException('This onboarding request has already been processed');
    const duplicateCollege = this.collegesService.findAll().some((college) =>
      college.code.toLowerCase() === request.collegeCode.toLowerCase()
      || college.email.toLowerCase() === request.collegeEmail.toLowerCase()
      || college.name.trim().toLowerCase() === request.collegeName.trim().toLowerCase(),
    );
    if (duplicateCollege) throw new BadRequestException('A college with the same name, code, or email already exists');
    if (this.usersRepo.findByEmail(request.contactEmail)) {
      throw new BadRequestException('A user with the contact email already exists');
    }

    const college = this.collegesService.create({
      name: request.collegeName,
      code: request.collegeCode,
      email: request.collegeEmail,
      phone: request.collegePhone,
      address: request.collegeAddress,
      website: request.collegeWebsite,
    });
    const admin = this.superAdminService.createCollegeAdmin(college.id, {
      name: request.contactName,
      email: request.contactEmail,
    });
    this.onboardingRequests.update(id, {
      status: 'approved', reviewedAt: new Date().toISOString(), reviewNote: body.note || 'Approved',
      createdCollegeId: college.id, createdAdminId: admin.id,
    });
    this.log(user, 'Onboarding Approved', `${request.collegeName} approved; ${request.contactName} assigned as college admin`, 'college', college.id);
    return { message: `College "${request.collegeName}" created with admin "${request.contactName}".`, collegeId: college.id, adminId: admin.id };
  }

  @Patch('onboarding-requests/:id/reject')
  @ApiOperation({ summary: 'Reject a college onboarding request' })
  rejectOnboarding(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReviewOnboardingDto,
    @CurrentUser() user: RequestUser,
  ) {
    const request = this.onboardingRequests.findById(id);
    if (!request) throw new NotFoundException(`Onboarding request ${id} not found`);
    if (request.status !== 'pending') throw new BadRequestException('This onboarding request has already been processed');
    if (!body.note?.trim()) throw new BadRequestException('Please provide a reason for rejection');

    this.onboardingRequests.update(id, { status: 'rejected', reviewedAt: new Date().toISOString(), reviewNote: body.note.trim() });
    this.log(user, 'Onboarding Rejected', `${request.collegeName} rejected: ${body.note.trim()}`, 'college');
    return { message: `Request from "${request.collegeName}" rejected.` };
  }
}
