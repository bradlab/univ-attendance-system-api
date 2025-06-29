import { Emargement, EmargementStatus } from "../entity/Emargement.entity";
import { Course } from "../entity/Course.entity";
import {
  AdminStatQueryDto,
  AdminStatRep,
  StatisticsQueryDto,
  StatisticsRep,
} from "../dto/statistics.dto";
import { AppDataSource } from "../config/data-source";
import { Between, FindOptionsWhere } from "typeorm";
import { Programme } from "../entity/Programme.entity";
import { Departement } from "../entity/Departement.entity";
import { Universite } from "../entity/Universite.entity";
import { User, RoleEnum } from "../entity/User.entity";

export class StatisticsService {
  private readonly emargementRepo = AppDataSource.getRepository(Emargement);
  private readonly courseRepo = AppDataSource.getRepository(Course);
  private readonly programRepo = AppDataSource.getRepository(Programme);
  private readonly departmentRepo = AppDataSource.getRepository(Departement);
  private readonly universityRepo = AppDataSource.getRepository(Universite);
  private readonly userRepo = AppDataSource.getRepository(User);

  async getStatistics(param?: StatisticsQueryDto): Promise<StatisticsRep> {
    try {
      let whereClause: any = {};

      if (param?.universityId) {
        whereClause.classSession.course.programme.departement.university = {
          id: param.universityId,
        };
      }
      if (param?.status) {
        whereClause.status = param.status;
      }
      if (param?.professorId) {
        whereClause.professor = { id: param.professorId };
      }
      if (param?.departmentId) {
        whereClause.classSession.course.programme.departement = {
          id: param.departmentId,
        };
      }
      if (param?.courseId) {
        whereClause.classSession.course = { id: param.courseId };
      }
      if (param?.dateRange?.start && param?.dateRange?.end) {
        whereClause.classSession.date = Between(
          param.dateRange.start,
          param.dateRange.end
        );
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
        courseWhere.programme.departement.university = {
          id: param.universityId,
        };
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
          totalEmargements > 0 ? presentProfEmargements / totalEmargements : 0;
      }

      return {
        totalEmargements,
        professeurPresenceRate,
        totalCourses,
        pendingEmargementValidations,
      };
    } catch (error) {
      console.log("ERROR::StaisticsService.getStatistics", error);
      return {
        pendingEmargementValidations: 0,
        professeurPresenceRate: 0,
        totalCourses: 0,
        totalEmargements: 0,
      };
    }
  }

  async getProfStatistics(professeurId: string): Promise<StatisticsRep> {
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

  async getAdminStatistics(param?: AdminStatQueryDto): Promise<AdminStatRep> {
    try {
      let programmeWhere: any = {};
      let departementWhere: any = {};
      let courseWhere: any = {};
      let universityWhere: any = {};
      let professorWhere: any = { role: RoleEnum.TEACHER };
      let emargementWhere: any = {};

      if (param?.universityId) {
        departementWhere.university = { id: param.universityId };
        programmeWhere.departement = { university: { id: param.universityId } };
        courseWhere.programme = {
          departement: { university: { id: param.universityId } },
        };
        professorWhere.programme = {
          departement: { university: { id: param.universityId } },
        };
        emargementWhere.classSession = {
          course: {
            programme: {
              departement: { university: { id: param.universityId } },
            },
          },
        };
        universityWhere.id = param.universityId;
      }
      if (param?.departmentId) {
        programmeWhere.departement = { id: param.departmentId };
        courseWhere.programme = { departement: { id: param.departmentId } };
        professorWhere.programme = { departement: { id: param.departmentId } };
        emargementWhere.classSession = {
          course: { programme: { departement: { id: param.departmentId } } },
        };
        departementWhere.id = param.departmentId;
      }
      if (param?.dateRange?.start && param?.dateRange?.end) {
        emargementWhere.classSession = {
          ...emargementWhere.classSession,
          date: Between(param.dateRange.start, param.dateRange.end),
        };
      }

      const [
        totalProgrammes,
        totalDepartements,
        totalCourses,
        totalUniversities,
        totalProfesseurs,
        totalEmargements,
      ] = await Promise.all([
        this.programRepo.count({ where: programmeWhere }),
        this.departmentRepo.count({ where: departementWhere }),
        this.courseRepo.count({ where: courseWhere }),
        this.universityRepo.count({ where: universityWhere }),
        this.userRepo.count({ where: professorWhere }),
        this.emargementRepo.count({ where: emargementWhere }),
      ]);

      return {
        totalProgrammes,
        totalDepartements,
        totalCourses,
        totalUniversities,
        totalProfesseurs,
        totalEmargements,
      };
    } catch (error) {
      console.log("ERROR::StatisticService.getAdminStatistics", error);
      return {
        totalProgrammes: 0,
        totalDepartements: 0,
        totalCourses: 0,
        totalUniversities: 0,
        totalProfesseurs: 0,
        totalEmargements: 0,
      };
    }
  }
}
