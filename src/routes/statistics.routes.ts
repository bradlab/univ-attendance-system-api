import { Router } from "express";
import { getAdminStatistics, getProfStatistics, getStatistics } from "../controllers/statistics.controller";
import { authentification } from "../middleware/authentification";

const statisticRouter = Router();

statisticRouter.get("/business", authentification, getStatistics);
statisticRouter.get("/admin", authentification, getAdminStatistics);
statisticRouter.get("/prof/:id", authentification, getProfStatistics);

export default statisticRouter;
