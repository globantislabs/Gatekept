import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/admin/stats - Dashboard stats (enhanced)
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    // Run all queries in parallel for performance
    const [
      totalUsers,
      totalProducts,
      activeCampaigns,
      learningCompletions,
      totalQuizzes,
      totalVideos,
      recentUsers,
      totalOrders,
      totalRevenue,
      ordersByStatusRaw,
      campaignsByChannelRaw,
      totalScans,
      scansByCampaignRaw,
    ] = await Promise.all([
      db.userProfile.count(),
      db.product.count({ where: { active: true } }),
      db.campaign.count({ where: { status: 'ACTIVE' } }),
      db.productLearningProgress.count({ where: { quiz_completed: true } }),
      db.productQuiz.count(),
      db.productVideo.count(),
      db.userProfile.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          created_at: true,
          is_admin: true,
        },
      }),
      db.order.count(),
      db.order.aggregate({ _sum: { total_amount: true } }),
      db.order.groupBy({ by: ['status'], _count: { status: true } }),
      db.campaign.groupBy({ by: ['channel'], _count: { channel: true } }),
      db.qrScan.count(),
      db.qrScan.groupBy({ by: ['campaign_id'], _count: { campaign_id: true } }),
    ])

    // Learning progress by status
    const progressByStatus = await db.productLearningProgress.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    const statusBreakdown = progressByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status
      return acc
    }, {} as Record<string, number>)

    // Orders by status
    const ordersByStatus = ordersByStatusRaw.reduce((acc, item) => {
      acc[item.status] = item._count.status
      return acc
    }, {} as Record<string, number>)

    // Campaigns by channel
    const campaignsByChannel = campaignsByChannelRaw.reduce((acc, item) => {
      acc[item.channel] = item._count.channel
      return acc
    }, {} as Record<string, number>)

    // Scans by campaign
    const scansByCampaign = scansByCampaignRaw.reduce((acc, item) => {
      const name = item.campaign_id || 'unknown'
      acc[name] = item._count.campaign_id
      return acc
    }, {} as Record<string, number>)

    // Conversion rate (learning completed / total users)
    const conversionRate = totalUsers > 0 ? Math.round((learningCompletions / totalUsers) * 100) : 0

    return jsonResponse({
      stats: {
        totalUsers,
        totalProducts,
        activeCampaigns,
        learningCompletions,
        learningCompleted: learningCompletions,
        totalQuizzes,
        totalVideos,
        totalOrders,
        totalRevenue: totalRevenue._sum.total_amount || 0,
        totalScans,
        conversionRate,
        ordersByStatus,
        campaignsByChannel,
        scansByCampaign,
        progressByStatus: statusBreakdown,
      },
      recentUsers,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return errorResponse('Failed to fetch admin stats', 500)
  }
}
