import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { RequestUser } from '../common/guards/roles.guard';
import { CreatePlatformAnnouncementDto, UpdatePlatformAnnouncementDto } from './dto/platform-announcement.dto';
import { PlatformAnnouncementsService } from './platform-announcements.service';
import { UsersRepository } from '../users/users.repository';

@ApiTags('Platform Announcements')
@ApiSecurity('x-role')
@UseGuards(RolesGuard)
@Controller('platform-announcements')
export class PlatformAnnouncementsController {
  constructor(private readonly service: PlatformAnnouncementsService, private readonly users: UsersRepository) {}
  @Get() @ApiOperation({ summary: 'Active platform announcements relevant to the signed-in user' }) visible(@CurrentUser() user: RequestUser) { return this.service.getVisible(user.role, user.collegeId); }
  @Get('all') @Roles('admin', 'super_admin') all() { return this.service.getAll(); }
  @Post() @Roles('admin') create(@Body() dto: CreatePlatformAnnouncementDto, @CurrentUser() user: RequestUser) {
    return this.service.create({ ...dto, targetRoles: dto.targetRoles ?? [], targetColleges: dto.targetColleges ?? [], isActive: dto.isActive ?? true, createdBy: user.userId ?? 0, createdByName: this.users.findById(user.userId ?? 0)?.name ?? 'Admin' });
  }
  @Put(':id') @Roles('admin') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePlatformAnnouncementDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles('admin') @HttpCode(200) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
