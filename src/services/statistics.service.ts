import { Emargement, EmargementStatus } from "../entity/Emargement.entity";
import { Course } from "../entity/Course.entity";
import { StatisticsDto } from "../dto/statistics.dto";
import { AppDataSource } from "../config/data-source";

export class StatisticsService {
    private readonly emargementRepo = AppDataSource.getRepository(Emargement);
    private readonly courseRepo = AppDataSource.getRepository(Course);
    
    async getStatistics(professeurId?: string): Promise<StatisticsDto> {

        // Nombre total d'émargements
        const totalEmargements = await this.emargementRepo.count();

        // Nombre total de cours programmés
        const totalCourses = await this.courseRepo.count();

        // Nombre de validations d'émargement en attente
        const pendingEmargementValidations = await this.emargementRepo.count({ where: { status: EmargementStatus.PENDING } });

        // Taux de présence d'un professeur (si id fourni)
        let professeurPresenceRate = 0;
        if (professeurId) {
        const totalProfEmargements = await this.emargementRepo.count({ where: { professor: { id: professeurId } } });
        const presentProfEmargements = await this.emargementRepo.count({ where: { professor: { id: professeurId }, status: EmargementStatus.PRESENT } });
        professeurPresenceRate = totalProfEmargements > 0 ? presentProfEmargements / totalProfEmargements : 0;
        }

        return {
        totalEmargements,
        professeurPresenceRate,
        totalCourses,
        pendingEmargementValidations,
        };
    }
}
