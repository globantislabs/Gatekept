import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/admin/stats - Dashboard stats
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
          // Exclude password_hash for security - never expose
        },
      }),
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

    return jsonResponse({
      stats: {
        totalUsers,
        totalProducts,
        activeCampaigns,
        learningCompletions,
        totalQuizzes,
        totalVideos,
        progressByStatus: statusBreakdown,
      },
      recentUsers,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return errorResponse('Failed to fetch admin stats', 500)
  }
}
