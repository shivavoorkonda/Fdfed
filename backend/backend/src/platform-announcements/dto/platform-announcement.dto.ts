import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Length } from 'class-validator';

export class CreatePlatformAnnouncementDto {
  @IsString() @Length(3, 160) title: string;
  @IsString() @Length(5, 3000) message: string;
  @IsIn(['info', 'warning', 'maintenance', 'update']) type: 'info' | 'warning' | 'maintenance' | 'update';
  @IsOptional() @IsArray() @IsString({ each: true }) targetRoles?: string[];
  @IsOptional() @IsArray() @IsInt({ each: true }) targetColleges?: number[];
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsDateString() expiresAt?: string;
}
export class UpdatePlatformAnnouncementDto {
  @IsOptional() @IsString() @Length(3, 160) title?: string;
  @IsOptional() @IsString() @Length(5, 3000) message?: string;
  @IsOptional() @IsIn(['info', 'warning', 'maintenance', 'update']) type?: 'info' | 'warning' | 'maintenance' | 'update';
  @IsOptional() @IsArray() @IsString({ each: true }) targetRoles?: string[];
  @IsOptional() @IsArray() @IsInt({ each: true }) targetColleges?: number[];
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsDateString() expiresAt?: string;
}
