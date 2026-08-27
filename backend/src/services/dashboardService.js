const userRepository = require('../repositories/userRepository');
const affiliateRepository = require('../repositories/affiliateRepository');
const commissionRepository = require('../repositories/commissionRepository');
const db = require('../database');

class DashboardService {
  async getDashboardData(user) {
    const role = user.role_name;

    if (role === 'super_admin' || role === 'admin') {
      const userStats = await db.query(
        `SELECT 
           COUNT(id) as total_users,
           COUNT(CASE WHEN role_id = '44444444-4444-4444-a444-444444444444' THEN 1 END) as total_affiliates,
           COUNT(CASE WHEN role_id = '33333333-3333-4333-a333-333333333333' THEN 1 END) as total_super_affiliates,
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_approvals
         FROM users WHERE deleted_at IS NULL`
      );

      const commStats = await commissionRepository.getDashboardSummary(user.id, role);
      const recentUsers = await userRepository.findAll({ page: 1, limit: 5 });

      return {
        stats: {
          totalUsers: parseInt(userStats.rows[0].total_users || 0, 10),
          totalAffiliates: parseInt(userStats.rows[0].total_affiliates || 0, 10),
          totalSuperAffiliates: parseInt(userStats.rows[0].total_super_affiliates || 0, 10),
          pendingApprovals: parseInt(userStats.rows[0].pending_approvals || 0, 10),
          totalCommissionPaid: parseFloat(commStats.total_commission_paid || 0),
          totalRevenue: parseFloat(commStats.total_revenue_generated || 0),
        },
        recentUsers: recentUsers.users,
      };
    } else {
      // Affiliate & Super Affiliate Dashboard Data
      const links = await affiliateRepository.findLinksByUserId(user.id);
      const clickCount = await affiliateRepository.getClickStats(user.id);
      const commissions = await commissionRepository.findCommissionsByAffiliate(user.id);

      let totalPaid = 0;
      let totalPending = 0;

      commissions.forEach((c) => {
        const amt = parseFloat(c.amount);
        if (c.status === 'paid') totalPaid += amt;
        else if (c.status === 'pending' || c.status === 'approved') totalPending += amt;
      });

      return {
        stats: {
          totalClicks: clickCount,
          totalConversions: commissions.length,
          totalPaidEarnings: totalPaid,
          totalPendingEarnings: totalPending,
        },
        links,
        recentCommissions: commissions.slice(0, 5),
      };
    }
  }
}

module.exports = new DashboardService();
