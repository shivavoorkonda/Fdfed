import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { RecruitersModule } from '../recruiters/recruiters.module';
import { CollegesModule } from '../colleges/colleges.module';
import { OnboardingRequestsRepository } from './onboarding-requests.repository';

@Module({
  imports: [RecruitersModule, CollegesModule],
  controllers: [ContactController],
  providers: [OnboardingRequestsRepository],
  exports: [OnboardingRequestsRepository],
})
export class ContactModule {}
