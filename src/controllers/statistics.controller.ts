import { Request, Response } from "express";
import { StatisticsService } from "../services/statistics.service";
import { StatisticsQueryDto } from "../dto/statistics.dto";

const statisticsService = new StatisticsService();

export const getStatistics = async (req: Request, res: Response) => {
  try {
    const param = req.query as unknown as StatisticsQueryDto;
    const stats = await statisticsService.getStatistics(param);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques", error });
  }
};

export const getProfStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await statisticsService.getProfStatistics(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques", error });
  }
};
