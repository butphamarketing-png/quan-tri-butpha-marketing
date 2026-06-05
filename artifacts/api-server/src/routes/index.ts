import { Router, type IRouter } from "express";
import healthRouter from "./health";
import customersRouter from "./customers";
import servicesRouter from "./services";
import suppliersRouter from "./suppliers";
import contractsRouter from "./contracts";
import receiptsRouter from "./receipts";
import expensesRouter from "./expenses";
import accountsRouter from "./accounts";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";
import auditLogsRouter from "./audit-logs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(customersRouter);
router.use(servicesRouter);
router.use(suppliersRouter);
router.use(contractsRouter);
router.use(receiptsRouter);
router.use(expensesRouter);
router.use(accountsRouter);
router.use(dashboardRouter);
router.use(reportsRouter);
router.use(auditLogsRouter);

export default router;
