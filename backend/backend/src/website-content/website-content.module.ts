import { Module } from '@nestjs/common';
import { WebsiteContentController } from './website-content.controller';
import { WebsiteContentRepository } from './website-content.repository';
import { WebsiteContentService } from './website-content.service';

@Module({ controllers: [WebsiteContentController], providers: [WebsiteContentRepository, WebsiteContentService], exports: [WebsiteContentService] })
export class WebsiteContentModule {}
