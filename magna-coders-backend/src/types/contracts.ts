export enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_DEVELOPER_ACCEPTANCE = 'PENDING_DEVELOPER_ACCEPTANCE',
  ACTIVE_UNFUNDED = 'ACTIVE_UNFUNDED',
  ACTIVE_FUNDED = 'ACTIVE_FUNDED',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  TERMINATED = 'TERMINATED'
}

export enum MilestoneStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RELEASED = 'RELEASED'
}

export enum EscrowTransactionType {
  FUND = 'FUND',
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum EscrowTransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export enum EscrowAccountStatus {
  EMPTY = 'EMPTY',
  PARTIALLY_FUNDED = 'PARTIALLY_FUNDED',
  FULLY_FUNDED = 'FULLY_FUNDED',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED'
}

export enum ReviewDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_CHANGES = 'REQUEST_CHANGES'
}

export enum ChangeRequestType {
  SCOPE = 'SCOPE',
  COST = 'COST',
  TIME = 'TIME',
  SPLIT = 'SPLIT',
  MERGE = 'MERGE'
}

export enum ChangeRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum DisputeResolution {
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
  SPLIT = 'SPLIT',
  CANCEL_CONTRACT = 'CANCEL_CONTRACT'
}

export enum FundingMode {
  NEXT_MILESTONE_REQUIRED = 'NEXT_MILESTONE_REQUIRED',
  FULL_UPFRONT = 'FULL_UPFRONT'
}

export enum EvidenceType {
  LINK = 'LINK',
  FILE = 'FILE',
  TEXT = 'TEXT',
  SCREENSHOT = 'SCREENSHOT',
  REPO_COMMIT = 'REPO_COMMIT',
  DEMO_URL = 'DEMO_URL'
}

export interface EvidenceItem {
  type: EvidenceType;
  url?: string;
  file_id?: string;
  text?: string;
  label: string;
}

export interface CreateContractInput {
  title: string;
  description?: string;
  currency?: string;
  total_amount: number;
  funding_mode?: FundingMode;
  start_at?: Date;
  terms_version?: string;
  metadata?: Record<string, any>;
}

export interface UpdateContractInput {
  title?: string;
  description?: string;
  total_amount?: number;
  funding_mode?: FundingMode;
  start_at?: Date;
  metadata?: Record<string, any>;
}

export interface CreateMilestoneInput {
  title: string;
  description?: string;
  acceptance_criteria?: Record<string, any>;
  amount: number;
  due_at?: Date;
  order_index?: number;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string;
  acceptance_criteria?: Record<string, any>;
  amount?: number;
  due_at?: Date;
  order_index?: number;
}

export interface CreateProgressSubmissionInput {
  milestone_id: string;
  summary?: string;
  evidence_items?: EvidenceItem[];
}

export interface CreateMilestoneReviewInput {
  milestone_id: string;
  decision: ReviewDecision;
  reason_code?: string;
  comments?: string;
}

export interface CreateChangeRequestInput {
  contract_id: string;
  type: ChangeRequestType;
  changes: Record<string, any>;
}

export interface CreateDisputeInput {
  contract_id: string;
  milestone_id?: string;
  reason?: string;
}

export interface ResolveDisputeInput {
  resolution: DisputeResolution;
  admin_id: string;
}

export interface FundEscrowInput {
  amount: number;
  provider_reference?: string;
  idempotency_key?: string;
}

export interface ReleaseMilestoneInput {
  milestone_id: string;
}

export interface ContractFilter {
  role?: 'client' | 'developer';
  status?: ContractStatus;
}
