export type IssueStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Issue = {
    id: string;
    title: string;
    description?: string;
    status: IssueStatus;
    priority: IssuePriority;
    labels: string[];
    creatorId: string;
    assigneeId?: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
}