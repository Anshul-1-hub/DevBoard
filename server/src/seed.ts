import "dotenv/config";
import { PrismaClient, IssueStatus, IssuePriority } from "./generated/prisma/client.js";
import { auth } from "./lib/auth.js";

const prisma = new PrismaClient();

async function main(){
  console.log("Seeding demo data...");

  const ownerRes = await auth.api.signUpEmail({
    body: {
      name: "Alex Rivera",
      email: "alex@acmecorp.demo",
      password: "demo1234",
    },
  });

  const memberRes = await auth.api.signUpEmail({
    body: {
      name: "Sam Chen",
      email: "sam@acmecorp.demo",
      password: "demo1234",
    },
  });

  const ownerId = ownerRes.user.id
  const memberId = memberRes.user.id;

  const org = await auth.api.createOrganization({
    body: {
      name: "Acme Corp",
      slug: "acme-corp",
      userId: ownerId,
    },
  });

  const orgId = org.id;

  await auth.api.addMember({
    body: { userId: memberId, organizationId: orgId, role: "member" },
  });

  const issues = [
    {title: "Set up CI/CD pipeline", status: IssueStatus.DONE, priority: IssuePriority.HIGH, creatorId: ownerId},
    {title: "Design system tokens", status: IssueStatus.DONE, priority: IssuePriority.MEDIUM, creatorId: memberId},
    {title: "Implement auth flow", status: IssueStatus.DONE, priority: IssuePriority.URGENT, creatorId: ownerId},
    {title: "Add dark mode support", status: IssueStatus.IN_PROGRESS, priority: IssuePriority.LOW, creatorId: memberId},
    {title: "Write API documentation", status: IssueStatus.IN_PROGRESS, priority: IssuePriority.MEDIUM, creatorId: ownerId},
    {title: "Fix mobile nav overflow bug", status: IssueStatus.IN_PROGRESS, priority: IssuePriority.HIGH, creatorId: memberId},
    {title: "Integrate Stripe billing", status: IssueStatus.TODO, priority: IssuePriority.HIGH, creatorId: ownerId},
    {title: "Add CSV export feature", status: IssueStatus.TODO, priority: IssuePriority.LOW, creatorId: memberId},
    {title: "Performance audit", status: IssueStatus.TODO, priority: IssuePriority.MEDIUM, creatorId: ownerId},
    {title: "Onboarding email sequence", status: IssueStatus.TODO, priority: IssuePriority.MEDIUM, creatorId: memberId},
    ];

  for (const issue of issues){
    const created = await prisma.issue.create({
      data: {
        ...issue,
        organizationId: orgId,
        labels: [],
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        entityType: "Issue",
        entityId: created.id,
        action: "created",
        actorId: issue.creatorId,
        actorName: issue.creatorId === ownerId ? "Alex Rivera" : "Sam Chen",
        diff: { title: issue.title, priority: issue.priority },
      },
    });
  }

  console.log("Done! Demo credentials:");
  console.log("   Email: alex@acmecorp.demo");
  console.log("   Password: demo1234");
}

main().catch(console.error).finally(() => prisma.$disconnect());