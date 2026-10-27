import { IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, Length, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FeatureDto {
  @IsOptional() @IsInt() id?: number;
  @IsString() @Length(1, 60) icon: string;
  @IsString() @Length(2, 100) title: string;
  @IsString() @Length(2, 500) description: string;
  @IsInt() @Min(1) order: number;
  @IsBoolean() isActive: boolean;
}
export class ReplaceFeaturesDto { @IsArray() @ValidateNested({ each: true }) @Type(() => FeatureDto) features: FeatureDto[]; }
export class TestimonialDto {
  @IsString() @Length(2, 80) name: string; @IsString() @Length(2, 80) role: string; @IsString() @Length(2, 100) college: string; @IsString() @Length(5, 1000) text: string;
  @IsOptional() @IsString() @Length(1, 12) avatar?: string; @IsInt() @Min(1) @Max(5) rating: number; @IsBoolean() isActive: boolean;
}
export class UpdateTestimonialDto extends TestimonialDto {}
export class FaqDto { @IsString() @Length(5, 300) question: string; @IsString() @Length(5, 2000) answer: string; @IsString() @Length(2, 60) category: string; @IsInt() @Min(1) order: number; @IsBoolean() isActive: boolean; }
export class UpdateFaqDto extends FaqDto {}
export class CreateContactDto { @IsString() @Length(2, 80) name: string; @IsEmail() email: string; @IsString() @Length(2, 160) subject: string; @IsString() @Length(5, 2000) message: string; }
export class UpdateContactDto { @IsOptional() @IsIn(['new', 'read', 'replied', 'archived']) status?: 'new' | 'read' | 'replied' | 'archived'; @IsOptional() @IsString() @Length(1, 2000) adminReply?: string; }
