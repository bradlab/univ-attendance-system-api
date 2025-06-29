import { Router } from "express";
import { getStatistics } from "../controllers/statistics.controller";

const statisticRouter = Router();

statisticRouter.get("/:id", getStatistics);

export default statisticRouter;
