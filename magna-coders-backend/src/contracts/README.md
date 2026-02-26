# Magna Contracts & Magna Coins - Backend Implementation

## Overview

This implementation provides a comprehensive backend for **Magna Contracts** (escrow-based contract management) and **Magna Coins** (digital token system with platform fees).

## Features

### Magna Contracts

- **Contract Management**: Create, send, accept, decline contracts
- **Milestone Tracking**: Create, update, submit, and review milestones
- **Escrow System**: Fund escrow, release funds, track transactions
- **Progress Submissions**: Submit evidence for milestone completion
- **Reviews**: Approve/reject milestones with feedback
- **Change Requests**: Request scope/cost/time changes
- **Disputes**: Open and resolve disputes
- **Activity Logging**: Full audit trail

### Magna Coins

- **Wallet System**: User coin wallets with balance management
- **Coin Packages**: Predefined packages for coin purchases
- **Store**: Purchase items with coins (badges, features, subscriptions)
- **Platform Fees**: 5% fee on contract payouts
- **Admin Fund Management**: Admin can release/accept funds

### Admin Dashboard

- **Statistics**: Contracts, users, revenue, disputes
- **User Management**: View and manage users
- **Revenue Analytics**: Platform fees and transaction history
- **Dispute Management**: View and resolve disputes
- **Escrow Overview**: Monitor all escrow accounts

## API Endpoints

### Contracts (`/api/contracts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create contract |
| POST | `/:id/send` | Send contract to developer |
| POST | `/:id/accept` | Accept contract |
| POST | `/:id/decline` | Decline contract |
| GET | `/:id` | Get contract details |
| GET | `/` | List contracts |
| POST | `/:id/pause` | Pause contract |
| POST | `/:id/resume` | Resume contract |
| POST | `/:id/milestones` | Create milestone |
| PATCH | `/milestones/:id` | Update milestone |
| GET | `/:id/milestones` | List milestones |
| POST | `/milestones/:id/start` | Start milestone |
| POST | `/milestones/:id/submissions` | Submit progress |
| POST | `/:id/escrow/fund` | Fund escrow |
| POST | `/milestones/:id/release` | Release milestone payment |
| POST | `/milestones/:id/review` | Review milestone |
| POST | `/:id/change-requests` | Create change request |
| POST | `/:id/disputes` | Create dispute |

### Coins (`/api/coins`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wallet` | Get user wallet |
| GET | `/wallet/transactions` | Transaction history |
| GET | `/packages` | List coin packages |
| POST | `/packages/order` | Create purchase order |
| GET | `/packages/orders` | List user orders |
| GET | `/store` | List store items |
| POST | `/store/purchase` | Purchase item |
| GET | `/store/entitlements` | User entitlements |

### Admin (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Dashboard statistics |
| GET | `/dashboard/revenue` | Revenue analytics |
| GET | `/users` | List users |
| GET | `/disputes` | List disputes |
| GET | `/actions` | Admin action log |
| GET | `/coin-orders` | List coin orders |
| GET | `/escrow` | Escrow overview |

### Admin Contract Actions (`/api/contracts/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/release-funds` | Release funds to developer |
| POST | `/admin/accept-funds` | Accept funds from client |
| POST | `/admin/:id/pause` | Pause contract |
| POST | `/admin/:id/resume` | Resume contract |
| POST | `/admin/:id/cancel` | Cancel contract |
| GET | `/admin/contracts` | List all contracts |

## Database Models

### Contracts Module

- `contracts` - Main contract records
- `milestones` - Contract milestones
- `escrow_accounts` - Escrow balance tracking
- `escrow_transactions` - Escrow transaction ledger
- `progress_submissions` - Milestone evidence submissions
- `milestone_reviews` - Review records
- `change_requests` - Scope/cost change requests
- `disputes` - Dispute records
- `activity_logs` - Audit trail

### Coins Module

- `coin_wallets` - User coin wallets
- `coin_transactions` - Transaction ledger
- `coin_packages` - Coin purchase packages
- `coin_orders` - Purchase orders
- `store_items` - Items purchasable with coins
- `store_entitlements` - User entitlements
- `platform_fees` - Fee tracking
- `admin_actions` - Admin action log

## Platform Fee Logic

- **Fee Percentage**: 5% on all milestone releases
- **Calculation**: `fee = amount * 0.05`, `net = amount - fee`
- **Flow**: When milestone is released, fee is deducted and remaining coins credited to developer wallet

## State Machines

### Contract Status

```
DRAFT → PENDING_DEVELOPER_ACCEPTANCE → ACTIVE_UNFUNDED → ACTIVE_FUNDED → COMPLETED
                                    ↘ PAUSED → (resumed)
                                    ↘ CANCELLED
```

### Milestone Status

```
NOT_STARTED → IN_PROGRESS → SUBMITTED → IN_REVIEW → APPROVED → RELEASED
                                      ↘ CHANGES_REQUESTED → SUBMITTED
                                      ↘ REJECTED
```

## File Structure

```
src/
├── types/
│   ├── contracts.ts          # Contract types and enums
│   └── coins.ts              # Coin types and enums
├── services/
│   ├── contracts/
│   │   ├── contractService.ts
│   │   ├── milestoneService.ts
│   │   ├── escrowService.ts
│   │   ├── reviewService.ts
│   │   ├── changeRequestService.ts
│   │   ├── disputeService.ts
│   │   └── activityLogService.ts
│   └── coins/
│       ├── walletService.ts
│       ├── packageService.ts
│       ├── storeService.ts
│       ├── platformFeeService.ts
│       └── paymentIntegrationService.ts
├── controllers/
│   ├── contracts/
│   │   ├── contractController.ts
│   │   ├── milestoneController.ts
│   │   ├── escrowController.ts
│   │   ├── reviewController.ts
│   │   ├── changeRequestController.ts
│   │   ├── disputeController.ts
│   │   ├── activityLogController.ts
│   │   └── adminController.ts
│   └── coins/
│       ├── walletController.ts
│       ├── packageController.ts
│       ├── storeController.ts
│       └── adminController.ts
└── routes/
    ├── contracts.ts
    ├── coins.ts
    └── admin.ts
```

## Setup

1. Run Prisma migration:
```bash
npx prisma migrate dev --name add_contracts_and_coins
```

2. Generate Prisma client:
```bash
npx prisma generate
```

3. (Optional) Seed coin packages:
```bash
npx prisma db seed
```

## Environment Variables

Add these to your `.env` file:

```env
# Platform fee percentage (default: 5)
PLATFORM_FEE_PERCENTAGE=5

# Payment provider credentials (for coin purchases)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
STRIPE_SECRET_KEY=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
```

## Payment Integration

The system supports multiple payment providers for coin purchases:

- **M-Pesa**: STK Push for Kenyan users
- **Stripe**: International card payments
- **PayPal**: PayPal checkout
- **Bank**: Bank transfer (manual verification)

Webhook endpoints are available at `/api/webhooks/coins/:provider`

## Security Considerations

- All endpoints require authentication
- Admin endpoints require admin role (add role middleware)
- Idempotency keys prevent duplicate transactions
- All financial operations are logged
- Append-only ledger for audit compliance

## Testing Checklist

- [ ] No submission without funding
- [ ] No approval without submission
- [ ] No release without approval
- [ ] Ledger totals consistent
- [ ] Webhook idempotency enforced
- [ ] Authorization validated
- [ ] Platform fee correctly calculated
- [ ] Wallet balance updates correctly
- [ ] Admin actions logged
