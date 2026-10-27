import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateContactDto, FaqDto, ReplaceFeaturesDto, TestimonialDto, UpdateContactDto, UpdateFaqDto, UpdateTestimonialDto } from './dto/website-content.dto';
import { WebsiteContentService } from './website-content.service';

@ApiTags('Website Content')
@ApiSecurity('x-role')
@UseGuards(RolesGuard)
@Controller('website-content')
export class WebsiteContentController {
  constructor(private readonly service: WebsiteContentService) {}
  @Get('features') @Public() @ApiOperation({ summary: 'Active landing page features' }) features() { return this.service.getFeatures(true); }
  @Put('features') @Roles('admin') replaceFeatures(@Body() dto: ReplaceFeaturesDto) { return this.service.replaceFeatures(dto.features); }
  @Get('testimonials') @Public() testimonials() { return this.service.getTestimonials(true); }
  @Post('testimonials') @Roles('admin') createTestimonial(@Body() dto: TestimonialDto) { return this.service.createTestimonial(dto); }
  @Put('testimonials/:id') @Roles('admin') updateTestimonial(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTestimonialDto) { return this.service.updateTestimonial(id, dto); }
  @Delete('testimonials/:id') @Roles('admin') @HttpCode(HttpStatus.OK) deleteTestimonial(@Param('id', ParseIntPipe) id: number) { return this.service.deleteTestimonial(id); }
  @Get('faqs') @Public() faqs() { return this.service.getFaqs(true); }
  @Post('faqs') @Roles('admin') createFaq(@Body() dto: FaqDto) { return this.service.createFaq(dto); }
  @Put('faqs/:id') @Roles('admin') updateFaq(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFaqDto) { return this.service.updateFaq(id, dto); }
  @Delete('faqs/:id') @Roles('admin') @HttpCode(HttpStatus.OK) deleteFaq(@Param('id', ParseIntPipe) id: number) { return this.service.deleteFaq(id); }
  @Post('contacts') @Public() createContact(@Body() dto: CreateContactDto) { return this.service.createContact(dto); }
  @Get('contacts') @Roles('admin', 'super_admin') contacts() { return this.service.getContacts(); }
  @Patch('contacts/:id') @Roles('admin') updateContact(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContactDto) { return this.service.updateContact(id, dto); }
}
