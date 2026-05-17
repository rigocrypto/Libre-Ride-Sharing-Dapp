# Rider Subscription + Benefits Layer

Rider monetization should split Orlando users into two archetypes:

- Local riders: commuters, residents, repeat users.
- Tourist riders: short-stay visitors, MCO arrivals, theme-park and convention travelers.

Locals are subscription candidates. Tourists are better served by one-time bundles and guest passes.

## Local Rider Tiers

| Tier | Indicative Price | Benefits |
| --- | --- | --- |
| Rider Basic | Free | Standard ride access, fare transparency, basic safety, ride history. |
| Rider Plus | `$7.99/week` or `$24.99/month` | Priority matching, 10-minute fare lock, 1 free cancellation/week, scheduling up to 72 hours, 3% ride-credit cashback, family profile for 2 linked riders. |
| Rider Elite | `$14.99/week` or `$44.99/month` | Plus benefits, airport priority, verified rider badge, 6% ride-credit cashback, monthly ride-credit bonus, faster dispute SLA, child-seat request priority, group ride coordination, van/luggage priority. |

## Tourist Guest Passes

| Pass | Indicative Price | Benefits |
| --- | --- | --- |
| MCO Arrival Bundle | `$4.99` one-time | 3-day priority access, AI tourist mode, fare estimate to Orlando destinations, 1 free cancellation, language preference, luggage flag. |
| Theme Park Bundle | `$6.99` for 3 days | Disney/Universal/SeaWorld optimized matching, return ride reminder, group ride support, child-seat request. |
| Convention Bundle | `$9.99` for event duration | OCCC dispatch optimization, business receipt export, up to 5 scheduled rides, shared ride option for attendees. |

Tourist bundles should be visible at the booking moment, especially for MCO and hotel/convention flows.

## Ride Credits + Loyalty Engine

Ride Credits are the retention layer.

```txt
1 Ride Credit = $0.01 toward future rides
```

Earning:

- Completed ride: tier cashback.
- New rider referral: `$5` in credits.
- New driver referral: `$15` in credits.
- First ride of week: bonus credits.
- No-dispute streak: monthly bonus.
- Rating submitted: small bonus.

Redeeming:

- Apply at checkout up to a configurable fare percentage.
- Gift to another rider.
- Apply to tourist bundle.
- Elite-only optional conversion to USDC, with minimum threshold and reserve controls.

Launch guidance:

- Keep Basic/Plus credits off-chain first.
- Consider USDC-backed redemption for Elite only after payment reserves and compliance review.

## Safe Ride Add-On

Optional add-on for locals, tourists, and corporate accounts.

Indicative price:

```txt
$2.99/week
```

Benefits:

- Live trip sharing to 3 contacts.
- Verified driver identity shown before pickup.
- Ride PIN requirement.
- SOS escalation workflow.
- Post-ride safety check-in.
- Incident evidence package with GPS, timestamps, ride ID, and driver ID.

Enterprise angle:

- Companies sending employees to Orlando conferences can require Safe Ride for expensed rides.

## Family Plan

Indicative add-on:

```txt
$4.99/week on top of Plus or Elite
```

Benefits:

- Up to 4 linked rider profiles.
- Parent can book on behalf of family members.
- Child seat request priority.
- Shared ride credit pool.
- Parent live trip tracking.
- Notifications when rides start and complete.

Safety requirement:

- Any minor-related flow needs legal and safety review before launch.

## Corporate / B2B Accounts

Target buyers:

- Convention groups.
- Hotels and resorts.
- Medical centers.
- Law firms.
- Production/media crews.
- Corporate travel managers.

Features:

- Centralized billing in fiat or USDC.
- Monthly invoice.
- Employee ride policies.
- Max fare limits.
- Approved zones/time windows.
- Receipt export in PDF and CSV.
- Expense code per ride.
- Airport priority for approved travelers.
- Dedicated support.

This is likely the highest-margin rider-side product once operational reliability is proven.

## Rider Reputation Credentials

Mirror driver trust with non-transferable rider credentials:

- Verified Rider Badge.
- Frequent Airport Rider Badge.
- No-Dispute Rider Badge.
- 5-Star Rider Badge.
- Early Adopter Badge.
- Family Verified Badge.
- Corporate Traveler Badge.

Use badges to improve matching priority and driver trust, not as speculative NFTs.

## Subscription Payment Flow

```txt
Rider creates account
→ chooses tier/pass
→ pays with card, embedded wallet, or USDC
→ subscription/pass status is saved
→ dispatch priority and benefits activate
→ tier renews or expires
→ downgrade/cancel/pause flow updates benefits
```

Web3-native version:

- Embedded wallet.
- USDC recurring authorization.
- Session key for low-risk recurring payment.
- Soulbound tier credential.

Consumer UX rule:

- Do not expose gas, approvals, chain IDs, or RPC details to mainstream riders.

## Launch Recommendation

Fastest revenue unlock:

1. MCO Arrival Bundle.
2. Theme Park Bundle.
3. Rider Plus for locals.
4. Corporate accounts after operational reliability is proven.

The tourist bundle is more practical than asking visitors to subscribe. The local subscription becomes valuable once fare lock, scheduling, cashback, and priority matching are reliable.

## MVP Launch Policy

Subscriptions should not block the first production pilot.

For the initial Orlando pilot, all subscription-related features should remain disabled or marked as beta until:

- Core ride escrow flow is live.
- Driver onboarding is validated.
- Admin approval workflow is operational.
- At least one staging ride has completed successfully.
- Legal review is completed for benefits, insurance-like language, rewards, and claims workflows.

