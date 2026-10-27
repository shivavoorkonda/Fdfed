import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, ParseIntPipe, UseGuards, HttpCode, HttpStatus, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiSecurity, ApiResponse } from '@nestjs/swagger';
import { CollegesService } from './colleges.service';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { CollegeStatusDto } from './dto/college-status.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/guards/roles.guard';

@ApiTags('Colleges')
@ApiSecurity('x-role')
@UseGuards(RolesGuard)
@Controller('colleges')
export class CollegesController {
  constructor(private readonly service: CollegesService) {}

  @Get()
  @Roles('super_admin', 'college_admin', 'placement_officer')
  @ApiOperation({ summary: 'Get all colleges' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'college_admin', 'placement_officer', 'candidate', 'recruiter', 'alumni')
  @ApiOperation({ summary: 'Get a college by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new college (super_admin only)' })
  @ApiBody({ type: CreateCollegeDto })
  @ApiResponse({ status: 201, description: 'College created' })
  create(@Body() dto: CreateCollegeDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update a college (super_admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateCollegeDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCollegeDto) {
    return this.service.update(id, dto);
  }

  /**
   * A college administrator can maintain public contact details for their
   * own college only. Status, code and limits remain platform
   * operations data and are deliberately excluded from this endpoint.
   */
  @Put(':id/settings')
  @Roles('college_admin')
  @ApiOperation({ summary: 'Update the signed-in college administrator\'s college profile' })
  updateOwnSettings(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollegeDto,
    @CurrentUser() user: RequestUser,
  ) {
    if (user.collegeId !== id) {
      throw new ForbiddenException('You can only update your own college profile');
    }
    const { name, email, phone, address, website } = dto;
    return this.service.update(id, { name, email, phone, address, website });
  }

  @Patch(':id/status')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update college status — active | inactive | suspended (super_admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CollegeStatusDto })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: CollegeStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a college (super_admin only)' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
