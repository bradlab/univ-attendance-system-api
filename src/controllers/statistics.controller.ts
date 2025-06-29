import { Request, Response } from "express";
import { StatisticsService } from "../services/statistics.service";

const statisticsService = new StatisticsService();

export const getStatistics = async (req: Request, res: Response) => {
  try {
    const professeurId = req.query.professeurId ? String(req.query.professeurId) : undefined;
    const stats = await statisticsService.getStatistics(professeurId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques", error });
  }
};
