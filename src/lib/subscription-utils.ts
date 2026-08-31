import { db } from '@/lib/db'

// ─── Shared subscription helpers ────────────────────────────────────────────
// Used by POST /api/orders (auto-create at checkout) and GET /api/subscriptions
// (self-heal for orders placed before auto-creation existed).

// One subscription per order (Subscription.order_id is @unique).
// The first item carrying a plan cycle (pack_days > 0) represents the plan —
// admin-configured plans always stamp pack_days onto subscription items.
export function pickSubscriptionItem(order: { items?: Array<Record<string, any>> }): Record<string, any> | null {
  const items = Array.isArray(order?.items) ? order.items : []
  return items.find((i) => Number(i?.pack_days) > 0) || null
}

export function buildSubscriptionData(order: Record<string, any>, item: Record<string, any>) {
  const frequency = Number(item?.pack_days) > 0 ? Number(item.pack_days) : 30
  const items = Array.isArray(order?.items) ? order.items : []
  const totalQty = items.reduce((s: number, i: Record<string, any>) => s + (Number(i?.quantity) || 1), 0)

  return {
    user_id: order.user_id,
    order_id: order.id,
    product_id: item?.product_id || items[0]?.product_id || null,
    product_name: item?.product_name || items[0]?.product_name || 'Subscription',
    product_type: item?.product_type || items[0]?.product_type || 'FIZZ',
    pack_type: item?.pack_type || `${frequency}_DAY`,
    pack_days: frequency,
    pack_discount: item?.pack_discount ?? 0,
    quantity: totalQty || 1,
    unit_price: Number(item?.unit_price ?? items[0]?.unit_price ?? 0),
    frequency_days: frequency,
    status: 'ACTIVE',
    next_delivery: new Date(Date.now() + frequency * 24 * 60 * 60 * 1000),
    total_cycles: 0,
    completed_cycles: 0,
  }
}

// True when the item's pack cycle matches an admin-configured subscription plan
// on the product — the definitive marker that checkout used an admin plan.
export async function matchesProductPlan(item: Record<string, any> | null): Promise<boolean> {
  if (!item?.product_id || !(Number(item.pack_days) > 0)) return false
  try {
    const prod = await db.product.findUnique({
      where: { id: item.product_id },
      select: { subscription_plans: true },
    })
    let plans: any[] = []
    try { plans = JSON.parse(prod?.subscription_plans || '[]') } catch { plans = [] }
    return plans.some((p: any) => Number(p?.cycle) === Number(item.pack_days))
  } catch (err: any) {
    console.error('[Subscription] matchesProductPlan failed:', err?.message || err)
    return false
  }
}

// Create the subscription row for an order if it doesn't have one yet.
// Idempotent and best-effort: an existing subscription (or any failure) is
// swallowed so order/subscription listing never breaks.
export async function ensureSubscriptionForOrder(order: Record<string, any>): Promise<Record<string, any> | null> {
  if (!order?.id) return null
  try {
    const existing = await db.subscription.findUnique({ where: { order_id: order.id } })
    if (existing) return existing
    const item = pickSubscriptionItem(order)
    if (!item) return null
    return await db.subscription.create({ data: buildSubscriptionData(order, item) })
  } catch (err: any) {
    console.error('[Subscription] ensureSubscriptionForOrder failed:', err?.message || err)
    return null
  }
}

// Self-heal: subscription orders placed before auto-creation existed (checkout
// marked them with plan pack info, but no Subscription row was written).
// Only orders whose item pack_days matches an admin-configured plan cycle on
// the product are healed — pre-plan one-time pack purchases are left alone.
export async function healMissingOrderSubscriptions(limit = 200): Promise<number> {
  let healed = 0
  try {
    const candidates = await db.order.findMany({
      where: { subscription: null },
      include: { items: true },
      orderBy: { created_at: 'desc' },
      take: limit,
    })
    for (const order of candidates) {
      const item = pickSubscriptionItem(order as any)
      if (!item) continue
      if (!(await matchesProductPlan(item))) continue
      const created = await ensureSubscriptionForOrder(order as any)
      if (created) healed++
    }
  } catch (err: any) {
    console.error('[Subscription] healMissingOrderSubscriptions failed:', err?.message || err)
  }
  return healed
}
