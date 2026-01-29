import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateStatusPageDto {
  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  monitorIds?: string[];

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsString()
  @IsOptional()
  password?: string;
}
