import { Router } from "express";
import { prisma } from "../lib/prisma.js"
import { requireOrg } from "../middleware/requireOrg.js";

const router = Router();

router.get("/", requireOrg, async (req, res) => {
    const logs = await prisma.auditLog.findMany({
        where: {organizationId: req.organizationId},
        orderBy: {createdAt: "desc"},
        take: 50,
    })

    res.json(logs);
})

export default router;