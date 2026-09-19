import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export const PRODUCT_STATUSES = ['DRAFT', 'PUBLISHED', 'COMING_SOON', 'ARCHIVED'] as const;
export const PAGE_STATUSES = ['DRAFT', 'PUBLISHED'] as const;

export class CreateBookDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsNotEmpty() slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) price!: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsIn(PRODUCT_STATUSES) status?: (typeof PRODUCT_STATUSES)[number];
  @IsString() @IsNotEmpty() authorId!: string;
  @IsString() @IsNotEmpty() categoryId!: string;
}

export class UpdateBookDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() @IsNotEmpty() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsIn(PRODUCT_STATUSES) status?: (typeof PRODUCT_STATUSES)[number];
}

export class CreateAuthorDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() slug!: string;
  @IsOptional() @IsString() bio?: string;
}

export class UpdateAuthorDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() @IsNotEmpty() slug?: string;
  @IsOptional() @IsString() bio?: string;
}

export class CreateCategoryDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() slug!: string;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() @IsNotEmpty() slug?: string;
}

export class CreateLessonDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsNotEmpty() slug!: string;
  @IsOptional() @IsObject() content?: Record<string, unknown>;
  @IsOptional() @IsInt() @Min(0) order?: number;
  @IsOptional() @IsIn(PAGE_STATUSES) status?: (typeof PAGE_STATUSES)[number];
}

export class UpdateLessonDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() @IsNotEmpty() slug?: string;
  @IsOptional() @IsObject() content?: Record<string, unknown>;
  @IsOptional() @IsInt() @Min(0) order?: number;
  @IsOptional() @IsIn(PAGE_STATUSES) status?: (typeof PAGE_STATUSES)[number];
}

export class CreateAssessmentDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsNotEmpty() slug!: string;
  @IsOptional() @IsArray() questions?: unknown[];
  @IsOptional() @IsInt() @Min(0) @Max(100) passScore?: number;
  @IsOptional() @IsIn(PAGE_STATUSES) status?: (typeof PAGE_STATUSES)[number];
}

export class UpdateAssessmentDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() @IsNotEmpty() slug?: string;
  @IsOptional() @IsArray() questions?: unknown[];
  @IsOptional() @IsInt() @Min(0) @Max(100) passScore?: number;
  @IsOptional() @IsIn(PAGE_STATUSES) status?: (typeof PAGE_STATUSES)[number];
}

export class CreatePageDto {
  @IsString() @IsNotEmpty() slug!: string;
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsIn(PAGE_STATUSES) status?: (typeof PAGE_STATUSES)[number];
  @IsOptional() @IsArray() sections?: unknown[];
}

export class UpdatePageDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() @IsNotEmpty() slug?: string;
  @IsOptional() @IsIn(PAGE_STATUSES) status?: (typeof PAGE_STATUSES)[number];
  @IsOptional() @IsObject() content?: Record<string, unknown>;
  @IsOptional() @IsArray() sections?: unknown[];
}

export class UpdateUserDto {
  @IsOptional() @IsIn(['CUSTOMER', 'ADMIN', 'OWNER']) role?: 'CUSTOMER' | 'ADMIN' | 'OWNER';
}

export class UpdateReviewDto {
  @IsBoolean() approved!: boolean;
}

export class SettingDto {
  @IsDefined() value!: unknown;
}
