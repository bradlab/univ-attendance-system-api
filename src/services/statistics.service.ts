import { Emargement, EmargementStatus } from "../entity/Emargement.entity";
import { Course } from "../entity/Course.entity";
import { StatisticsQueryDto, StatisticsRepDto } from "../dto/statistics.dto";
import { AppDataSource } from "../config/data-source";
import { Between, FindOptionsWhere } from "typeorm";

export class StatisticsService {
  private readonly emargementRepo = AppDataSource.getRepository(Emargement);
  private readonly courseRepo = AppDataSource.getRepository(Course);

  async getStatistics(param?: StatisticsQueryDto): Promise<StatisticsRepDto> {
    try {
        let whereClause: any = {};

        if (param?.universityId) {
          whereClause.classSession.course.programme.departement.university = { id: param.universityId };
        }
        if (param?.status) {
          whereClause.status = param.status;
        }
        if (param?.professorId) {
          whereClause.professor = { id: param.professorId };
        }
        if (param?.departmentId) {
          whereClause.classSession.course.programme.departement = { id: param.departmentId };
        }
        if (param?.courseId) {
          whereClause.classSession.course = { id: param.courseId };
        }
        if (param?.dateRange?.start && param?.dateRange?.end) {
          whereClause.classSession.date = Between(param.dateRange.start, param.dateRange.end);
        }

        // Nombre total d'émargements (filtré si param)
        const totalEmargements = await this.emargementRepo.count({
          where: whereClause,
        });

        // Nombre total de cours programmés (filtré si professorId, courseId, departmentId, universityId)
        let courseWhere: any = {};
        if (param?.courseId) {
          courseWhere.id = param.courseId;
        }
        if (param?.departmentId) {
          courseWhere.programme.departement = { id: param.departmentId };
        }
        if (param?.universityId) {
          courseWhere.programme.departement.university = { id: param.universityId };
        }
        const totalCourses = await this.courseRepo.count({
          where: courseWhere,
        });

        // Nombre de validations d'émargement en attente (filtré si param)
        const pendingEmargementValidations = await this.emargementRepo.count({
          where: { ...whereClause, status: EmargementStatus.PENDING },
        });

        // Taux de présence d'un professeur (si id fourni)
        let professeurPresenceRate = 0;
        if (param?.professorId) {
          const presentProfEmargements = await this.emargementRepo.count({
            where: {
              ...whereClause,
              status: EmargementStatus.PRESENT,
            },
          });
          professeurPresenceRate =
            totalEmargements > 0
              ? presentProfEmargements / totalEmargements
              : 0;
        }

        return {
          totalEmargements,
          professeurPresenceRate,
          totalCourses,
          pendingEmargementValidations,
        };
    } catch (error) {
        console.log('ERROR::StaisticsService.getStatistics', error);
        return {
            pendingEmargementValidations: 0,
            professeurPresenceRate: 0,
            totalCourses: 0,
            totalEmargements: 0
        }
    }
  }

  async getProfStatistics(professeurId: string): Promise<StatisticsRepDto> {
    // Nombre total d'émargements
    const totalEmargements = await this.emargementRepo.count();

    // Nombre total de cours programmés
    const totalCourses = await this.courseRepo.count();

    // Nombre de validations d'émargement en attente
    const pendingEmargementValidations = await this.emargementRepo.count({
      where: { status: EmargementStatus.PENDING },
    });

    // Taux de présence d'un professeur (si id fourni)
    let professeurPresenceRate = 0;
    if (professeurId) {
      const totalProfEmargements = await this.emargementRepo.count({
        where: { professor: { id: professeurId } },
      });
      const presentProfEmargements = await this.emargementRepo.count({
        where: {
          professor: { id: professeurId },
          status: EmargementStatus.PRESENT,
        },
      });
      professeurPresenceRate =
        totalProfEmargements > 0
          ? presentProfEmargements / totalProfEmargements
          : 0;
    }

    return {
      totalEmargements,
      professeurPresenceRate,
      totalCourses,
      pendingEmargementValidations,
    };
  }
}
