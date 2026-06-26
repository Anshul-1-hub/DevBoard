import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireOrg } from "../middleware/requireOrg.js";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

const router = Router();


// GET all members of the workspace
router.get("/", requireOrg, async (req, res) => {
  const members = await auth.api.listMembers({
    headers: fromNodeHeaders(req.headers),
    query: { organizationId: req.organizationId },
  });
  res.json(members);
});

// POST add a member directly by email (no invite email needed)
router.post("/", requireOrg, async (req, res) => {
  const { email, role = "member" } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  // find the user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ error: "No user with that email exists. They need to sign up first." });
    return;
  }

  try {
    const member = await auth.api.addMember({
      body: {
        userId: user.id,
        organizationId: req.organizationId,
        role,
      },
    });
    res.status(201).json(member);
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? "Could not add member" });
  }
});

// DELETE remove a member (owner/admin only)
router.delete("/:memberId", requireOrg, async (req, res) => {
  if (req.memberRole === "member") {
    res.status(403).json({ error: "Only owners and admins can remove members" });
    return;
  }

  const memberId = req.params.memberId as string;

  try{
    await auth.api.removeMember({
      headers: fromNodeHeaders(req.headers),
      body: {
        memberIdOrEmail: memberId,
        organizationId: req.organizationId,
      },
    });
    res.json({ success: true });
  } 

  catch (err: any){
    res.status(400).json({ error: err.message ?? "Could not remove member" });
  }
});

export default router;