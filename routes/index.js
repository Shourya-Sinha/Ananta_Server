import express from 'express';
import attendanceRoutes from '../routes/attendanceRoutes.js';
import authRoutes from '../routes/authRoutes.js';
import financeRoutes from '../routes/financeRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import sitesRoutes from '../routes/siteRoutes.js';
import verificationRoutes from '../routes/verificationRoutes.js';
import databaseRoutes from '../routes/databaseRoutes.js';
import investmentRoutes from '../routes/investmentRoutes.js';
import siteFinanceRoutes from '../routes/siteFinanceRoutes.js';
import uploadRoutes from '../routes/uploadRoutes.js';


const router = express.Router();

router.use("/attendance",attendanceRoutes);
router.use("/auth",authRoutes);
router.use('/finance',financeRoutes);
router.use('/users',userRoutes);
router.use('/site',sitesRoutes);
router.use('/verification',verificationRoutes)
router.use('/db',databaseRoutes);
router.use('/investment',investmentRoutes)
router.use('/siteFinance',siteFinanceRoutes);
router.use('/uploadDocs',uploadRoutes);

;

export default router;