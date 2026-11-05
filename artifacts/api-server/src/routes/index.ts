import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productRouter from "./product";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productRouter);

export default router;
