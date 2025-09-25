import express from "express";
import healthRoute from "./health/index.js";
import authRoute from "./authRoute.js"
import adminRoute from "./adminRoute.js"
import userRoute from "./userRoute.js"
const router = express.Router();

/* GET home page. */

//like router use like this
router.use("/health", healthRoute);
router.use("/auth", authRoute)
router.use("/admin", adminRoute)
router.use("/user", userRoute)

export default router;
