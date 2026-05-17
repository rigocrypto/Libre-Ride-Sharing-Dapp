# Driver Subscription + Benefits Layer

The driver-side subscription should not feel like a pay-to-drive tax. It should feel like career infrastructure: compliance help, dispatch improvements, maintenance savings, roadside support, and optional financial protections that improve driver economics.

## Weekly Subscription Tiers

| Tier | Indicative Price | Included Benefits |
| --- | --- | --- |
| Standard | `$9.99/week` | Platform access, compliance dashboard, basic dispatch priority, earnings reports. |
| Pro | `$19.99/week` | Standard benefits, repair rewards, roadside/tow coverage 1x/month, lower platform fee, driver AI copilot. |
| Elite | `$34.99/week` | Pro benefits, repair benefit cap, battery/tire benefit, priority dispatch, airport queue boost, dedicated support, tax export tools. |

Pricing should remain configurable by market, legal review, and early driver feedback.

## Repair Rewards Program

Launch the repair program as a partner voucher network first. This is simpler and safer than marketing it as insurance.

Example redemption table:

| Reward | Points | Notes |
| --- | ---: | --- |
| Oil change | 500 | Approx. `$40` value. |
| Tire rotation | 300 | Partner shop voucher. |
| New tire set | 2,000 + co-pay | Cap and eligibility required. |
| Battery replacement | 800 | Common Florida heat-related issue. |
| Brake service | 1,200 | Requires invoice validation. |
| General parts | Variable | Partner-store voucher. |
| Shop labor | Points + co-pay | Verified repair partner only. |
| Tow service | 600 | Pro: 1x/month, Elite: higher cap. |

Points accrue from:

- Completed rides.
- High acceptance rate.
- Low cancellation rate.
- Zero-dispute streaks.
- On-time compliance renewals.
- Subscription tier multiplier.
- Airport-eligible ride completions.

Orlando partner targets:

- Firestone.
- Jiffy Lube.
- Tire Kingdom.
- O'Reilly/AutoZone.
- AAA or local tow operators.
- Independent repair shops near MCO, International Drive, and Kissimmee.

## Mechanical Repair Benefit

### Option A: Voucher/Parametric Benefit

Fastest MVP path:

- Driver uploads invoice, receipt, and vehicle photo evidence.
- AI pre-review checks legibility, shop name, amount, date, and category.
- Admin approves or rejects.
- Platform pays verified shop or reimburses driver up to a monthly cap.
- Funded from subscription revenue pool.

This should be described as a repair benefit or voucher program, not insurance, unless counsel approves the wording.

### Option B: Insurance Partner

Scale path:

- Partner with a mechanical breakdown insurance or fleet benefit provider.
- Platform acts as enrollment and subscription layer.
- Insurer handles underwriting and claims.
- Cleaner liability model once driver volume is large enough.

## Roadside / Tow Coverage

Florida-specific logic:

- Heat kills batteries.
- Blowouts happen on I-4, SR 417, SR 528, and Turnpike corridors.
- MCO-area breakdowns need quick response.

Coverage model:

- Standard: discounted partner tow pricing.
- Pro: 1 covered tow/roadside event per month.
- Elite: higher cap or expanded frequency.

Implementation options:

- Integrate with a roadside API such as Urgent.ly or Honk.
- Start with pre-negotiated local tow partners and manual dispatch.
- Add admin dispatch form before API integration if needed.

## Claims Workflow

```txt
CLAIM_INITIATED
EVIDENCE_UPLOADED
AI_PRE_REVIEW
ADMIN_REVIEW
APPROVED
PAYOUT_PENDING
PAID
REJECTED
DISPUTED
EXPIRED
```

Required evidence:

- Repair invoice.
- Receipt or estimate.
- Vehicle photo.
- Odometer photo where relevant.
- Shop name/address.
- Driver statement.
- Optional tow ticket.

Technical requirements:

- Idempotency key on every claim action.
- Claim cap by tier.
- Claim frequency limit.
- Duplicate invoice detection.
- Admin audit log.
- Payout record with wallet/bank/shop destination.
- Fraud/risk score before payout.

## Web3 Angle

Useful Web3 features:

- Non-transferable repair points tied to driver wallet.
- Soulbound subscription tier credential.
- Maintenance history attestations.
- Transparent benefit ledger for driver trust.
- USDC subscription payments.

Avoid early complexity:

- Tradable repair tokens.
- Yield-bearing driver staking.
- Automatic slashing.
- Token incentives that could create regulatory exposure.

## Legal Caution

Do not market repair benefits as insurance unless an insurance carrier or counsel approves the program. The safest MVP phrasing is:

> Subscription repair rewards and partner maintenance vouchers.

Driver-facing promises must include caps, exclusions, review rights, timing, and appeal process.

## MVP Launch Policy

Subscriptions should not block the first production pilot.

For the initial Orlando pilot, all subscription-related features should remain disabled or marked as beta until:

- Core ride escrow flow is live.
- Driver onboarding is validated.
- Admin approval workflow is operational.
- At least one staging ride has completed successfully.
- Legal review is completed for benefits, insurance-like language, rewards, and claims workflows.

