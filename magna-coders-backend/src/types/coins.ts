export enum WalletStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  SUSPENDED = 'SUSPENDED',
}

export enum TransactionType {
  PURCHASE = 'PURCHASE',
  EARNING = 'EARNING',
  WITHDRAWAL = 'WITHDRAWAL',
  REFUND = 'REFUND',
  BONUS = 'BONUS',
  PLATFORM_FEE = 'PLATFORM_FEE',
  STORE_PURCHASE = 'STORE_PURCHASE',
}

export enum TransactionDirection {
  IN = 'IN',
  OUT = 'OUT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  MPESA = 'MPESA',
  BANK = 'BANK',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
}

export enum StoreItemType {
  BADGE = 'BADGE',
  FEATURE = 'FEATURE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  BOOST = 'BOOST',
}

export enum EntitlementStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface CoinWallet {
  id: string;
  user_id: string;
  balance: number;
  max_capacity: number;
  status: WalletStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  direction: TransactionDirection;
  status: TransactionStatus;
  reference_id?: string;
  idempotency_key?: string;
  description?: string;
  created_at: Date;
}

export interface CoinPackage {
  id: string;
  base_coins: number;
  bonus_coins: number;
  total_coins: number;
  price_kes: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CoinOrder {
  id: string;
  user_id: string;
  package_id: string;
  amount_kes: number;
  coins_credited: number;
  status: OrderStatus;
  payment_method?: PaymentMethod;
  payment_ref?: string;
  created_at: Date;
  updated_at: Date;
}

export interface StoreItem {
  id: string;
  name: string;
  description?: string;
  price_coins: number;
  type: StoreItemType;
  duration_days?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface StoreEntitlement {
  id: string;
  user_id: string;
  item_id: string;
  starts_at: Date;
  ends_at?: Date;
  status: EntitlementStatus;
  created_at: Date;
}

export interface PlatformFee {
  id: string;
  contract_id: string;
  amount: number;
  percentage: number;
  created_at: Date;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_id?: string;
  target_type?: string;
  details?: Record<string, unknown>;
  created_at: Date;
}

export interface CreateWalletInput {
  user_id: string;
  max_capacity?: number;
}

export interface CreditWalletInput {
  user_id: string;
  amount: number;
  type: TransactionType;
  reference_id?: string;
  idempotency_key?: string;
  description?: string;
}

export interface DebitWalletInput {
  user_id: string;
  amount: number;
  type: TransactionType;
  reference_id?: string;
  idempotency_key?: string;
  description?: string;
}

export interface CreateOrderInput {
  user_id: string;
  package_id: string;
  payment_method: PaymentMethod;
}

export interface PurchaseStoreItemInput {
  user_id: string;
  item_id: string;
}

export interface AdminFundReleaseInput {
  contract_id: string;
  milestone_id: string;
  amount: number;
  reason?: string;
}

export interface AdminFundAcceptInput {
  contract_id: string;
  amount: number;
  source: PaymentMethod;
  payment_reference: string;
}
