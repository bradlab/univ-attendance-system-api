import { Emargement, EmargementStatus } from "../entity/Emargement.entity";
import { Course } from "../entity/Course.entity";
import {
  AdminStatQueryDto,
  AdminStatRep,
  StatisticsQueryDto,
  StatisticsRep,
} from "../dto/statistics.dto";
import { AppDataSource } from "../config/data-source";
import { Between } from "typeorm";
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
      let whereClassSession: any = {};
      let whereCourse: any = {};
      if (param?.status) {
        whereClause.status = param.status;
      }
      if (param?.professorId) {
        whereClause.professor = { id: param.professorId };
      }

      if (param?.dateRange?.start && param?.dateRange?.end) {
        whereClassSession.date = Between(
          new Date(param.dateRange.start),
          new Date(param.dateRange.end)
        );
      }

      // whereCourse
      if (param?.courseId) {
        whereCourse.id = param.courseId;
      }
      if (param?.departmentId) {
        whereCourse.programme = { departement: { id: param.departmentId } };
      }
      if (param?.universityId) {
        if (whereCourse.programme) {
          whereCourse.programme.departement.university = {
            id: param.universityId,
          };
        } else {
          whereCourse.programme.departement = {
            university: { id: param.universityId },
          };
        }
      }

      if (Object.values(whereCourse).length > 0) {
        whereClause.classSession = { course: whereCourse };
      }
      if (Object.values(whereClassSession).length > 0) {
        whereClause.classSession = whereClassSession;
      }

      // Nombre total d'émargements (filtré si param)
      const totalEmargements = await this.emargementRepo.count({
        where: whereClause,
      });

      // Nombre total de cours programmés (filtré si professorId, courseId, departmentId, universityId)
      const totalCourses = await this.courseRepo.count({
        where: whereCourse,
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
    const totalEmargements = await this.emargementRepo.count({
      where: { professor: { id: professeurId } },
    });

    // Nombre total de cours programmés
    const totalCourses = await this.courseRepo.count({
      where: { classSessions: { professor: { id: professeurId } } },
    });

    // Nombre de validations d'émargement en attente
    const pendingEmargementValidations = await this.emargementRepo.count({
      where: {
        professor: { id: professeurId },
        status: EmargementStatus.PENDING,
      },
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
        universityWhere.id = param.universityId;
        departementWhere.university = universityWhere;
        programmeWhere.departement = departementWhere;
        courseWhere.programme = programmeWhere;
        professorWhere.programme = programmeWhere;
        emargementWhere.classSession = {
          course: courseWhere,
        };
      }
      if (param?.departmentId) {
        departementWhere.id = param.departmentId;
        programmeWhere.departement = departementWhere;
        courseWhere.programme = programmeWhere;
        professorWhere.programme = programmeWhere;
        emargementWhere.classSession = {
          course: courseWhere,
        };
      }
      if (param?.dateRange?.start && param?.dateRange?.end) {
        emargementWhere.classSession = {
          ...emargementWhere.classSession,
          date: Between(new Date(param.dateRange.start), new Date(param.dateRange.end)),
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
