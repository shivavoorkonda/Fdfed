import { IsEmail, IsIn, IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOnboardingRequestDto {
  @ApiProperty() @IsString() @Length(3, 100) collegeName: string;
  @ApiProperty() @IsString() @Matches(/^[A-Z0-9-]{2,12}$/) collegeCode: string;
  @ApiProperty() @IsEmail() collegeEmail: string;
  @ApiPropertyOptional() @IsOptional() @Matches(/^[+]?[0-9 ()-]{8,16}$/) collegePhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(5, 200) collegeAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_protocol: true }) collegeWebsite?: string;
  @ApiProperty() @IsString() @Length(2, 60) contactName: string;
  @ApiProperty() @IsEmail() contactEmail: string;
  @ApiProperty() @IsString() @Length(2, 80) contactDesignation: string;
  @ApiPropertyOptional() @IsOptional() @Matches(/^[+]?[0-9 ()-]{8,16}$/) contactPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(['< 200', '200–500', '500–1000', '1000+']) expectedStudents?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 1000) message?: string;
}
