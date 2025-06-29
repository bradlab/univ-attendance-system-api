import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { EmargementStatus } from "../entity/Emargement.entity";
import { Type } from "class-transformer";

/**
 * Data Transfer Object representing various attendance statistics.
 *
 * @property totalEmargements - The total number of emargements (attendance records).
 * @property professeurPresenceRate - The presence rate of professors, expressed as a percentage (0-100).
 * @property totalCourses - The total number of courses.
 * @property pendingEmargementValidations - The number of emargement validations that are still pending.
 */
export interface StatisticsRepDto {
  totalEmargements: number;
  professeurPresenceRate: number;
  totalCourses: number;
  pendingEmargementValidations: number;
}

class DateRangeDto {
  @IsOptional()
  @IsDateString()
  start: Date;

  @IsOptional()
  @IsDateString()
  end: Date;
}
export class StatisticsQueryDto {
    @IsNotEmpty()
    @IsUUID()
    @IsString()
    universityId: string;

    @IsOptional()
    @IsString()
    @IsEnum(EmargementStatus)
    status: EmargementStatus;

    @IsOptional()
    @IsString()
    @IsUUID()
    professorId: string;

    @IsOptional()
    @IsString()
    @IsUUID()
    departmentId: string;

    @IsOptional()
    @IsString()
    @IsUUID()
    courseId: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => DateRangeDto)
    dateRange: DateRangeDto
}
