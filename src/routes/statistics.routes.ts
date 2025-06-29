import { Router } from "express";
import { getProfStatistics, getStatistics } from "../controllers/statistics.controller";
import { authentification } from "../middleware/authentification";

const statisticRouter = Router();

statisticRouter.get("/:id", authentification, getProfStatistics);

export default statisticRouter;
