class PaymentRepository {
  async findReferralContext(client, referralCode, clickId) {
    const result = await client.query(
      `SELECT al.id AS affiliate_link_id, al.user_id AS affiliate_id, u.parent_affiliate_id, al.referral_code, r.name AS affiliate_role,
              ce.id AS click_id
       FROM affiliate_links al
       JOIN users u ON u.id = al.user_id AND u.status = 'active' AND u.deleted_at IS NULL
       JOIN roles r ON r.id = u.role_id
       JOIN click_events ce ON ce.id = $2 AND ce.affiliate_link_id = al.id AND ce.referral_code = al.referral_code AND ce.deleted_at IS NULL
       WHERE al.referral_code = $1 AND al.link_type = 'SHOPPING' AND al.is_active = true AND al.deleted_at IS NULL`, [referralCode, clickId]);
    return result.rows[0] || null;
  }
  async createPayment(client, payment) {
    const result = await client.query(
      `INSERT INTO payments (gateway_order_id, affiliate_id, click_id, referral_code, customer, amount, original_amount, discount_amount, currency, status, gateway_response)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'CREATED',$10) RETURNING *`,
      [payment.gatewayOrderId, payment.affiliateId, payment.clickId, payment.referralCode, JSON.stringify(payment.customer || {}), payment.amount, payment.originalAmount, payment.discountAmount, payment.currency, JSON.stringify(payment.gatewayResponse)]);
    return result.rows[0];
  }
  async findByGatewayOrderId(client, orderId) { const r = await client.query('SELECT * FROM payments WHERE gateway_order_id = $1 FOR UPDATE', [orderId]); return r.rows[0] || null; }
  async updatePayment(client, id, fields) {
    const r = await client.query(`UPDATE payments SET gateway_payment_id = COALESCE($2,gateway_payment_id), status = $3, gateway_response = COALESCE($4,gateway_response), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [id, fields.paymentId || null, fields.status, fields.gatewayResponse ? JSON.stringify(fields.gatewayResponse) : null]); return r.rows[0];
  }
  async recordWebhook(client, eventId, eventType, payload) {
    const r = await client.query(`INSERT INTO webhook_events (gateway_event_id,event_type,payload,status) VALUES ($1,$2,$3,'RECEIVED') ON CONFLICT (gateway_event_id) DO NOTHING RETURNING *`, [eventId, eventType, JSON.stringify(payload)]); return r.rows[0] || null;
  }
  async completeWebhook(client, eventId) { await client.query(`UPDATE webhook_events SET status='PROCESSED', processed_at=CURRENT_TIMESTAMP WHERE gateway_event_id=$1`, [eventId]); }
  async reverseForFullRefund(client, { gatewayPaymentId, gatewayOrderId, gatewayRefundId, amount, payload }) {
    const paymentResult = await client.query(
      `SELECT * FROM payments WHERE (gateway_payment_id=$1 OR gateway_order_id=$2) FOR UPDATE`,
      [gatewayPaymentId || null, gatewayOrderId || null]
    );
    const payment = paymentResult.rows[0];
    if (!payment) return { ignored: true, reason: 'PAYMENT_NOT_FOUND' };
    await client.query(
      `INSERT INTO refunds (payment_id, gateway_refund_id, amount, status, gateway_response)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (gateway_refund_id) DO NOTHING`,
      [payment.id, gatewayRefundId, Number(amount || 0) / 100, 'processed', JSON.stringify(payload)]
    );
    const refundedAmount = Number(amount || 0) / 100;
    if (refundedAmount < Number(payment.amount)) {
      await client.query(`UPDATE payments SET status='PARTIALLY_REFUNDED', updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [payment.id]);
      return { ignored: true, reason: 'PARTIAL_REFUND_RECORDED' };
    }
    await client.query(`UPDATE payments SET status='REFUNDED', updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [payment.id]);
    const commissions = await client.query(
      `SELECT c.*, w.id AS wallet_id, w.available_balance FROM commissions c
       LEFT JOIN wallets w ON w.user_id=c.affiliate_id AND w.deleted_at IS NULL
       JOIN conversion_events ce ON ce.id=c.conversion_id
       WHERE ce.order_id=$1 AND c.status IN ('pending','approved') FOR UPDATE`, [payment.gateway_order_id]
    );
    for (const commission of commissions.rows) {
      if (commission.status === 'approved' && commission.wallet_id) {
        const opening = Number(commission.available_balance);
        const update = await client.query(`UPDATE wallets SET available_balance=available_balance-$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING available_balance`, [commission.amount, commission.wallet_id]);
        await client.query(
          `INSERT INTO wallet_transactions (wallet_id,user_id,type,reference_type,reference_id,amount,opening_balance,closing_balance,description,status)
           VALUES ($1,$2,'COMMISSION_REVERSAL','COMMISSION',$3,$4,$5,$6,'Commission reversed after full payment refund','SUCCESS')`,
          [commission.wallet_id, commission.affiliate_id, commission.id, -Number(commission.amount), opening, Number(update.rows[0].available_balance)]
        );
      }
      await client.query(`UPDATE commissions SET status='rejected', updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [commission.id]);
    }
    await client.query(`UPDATE conversion_events SET status='refunded', updated_at=CURRENT_TIMESTAMP WHERE order_id=$1`, [payment.gateway_order_id]);
    return { ignored: false, reversedCommissions: commissions.rowCount };
  }
  async createConversionAndCommission(client, payment) {
    const existing = await client.query(`SELECT id FROM conversion_events WHERE order_id=$1 AND deleted_at IS NULL`, [payment.gateway_order_id]);
    if (existing.rows[0]) return { alreadyRecorded: true };
    const conversion = await client.query(`INSERT INTO conversion_events (click_id, affiliate_id, order_id, amount, currency) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [payment.click_id, payment.affiliate_id, payment.gateway_order_id, payment.amount, payment.currency]);
    let rate = 15; let ruleId = null;
    if (['affiliate', 'super_affiliate'].includes(payment.affiliate_role)) {
      const rule = await client.query(`SELECT * FROM commission_rules WHERE event_type='shopping' AND is_active=TRUE AND deleted_at IS NULL AND minimum_amount <= $1 AND (maximum_amount IS NULL OR maximum_amount >= $1) ORDER BY minimum_amount DESC LIMIT 1`, [payment.amount]);
      if (!rule.rows[0]) throw new Error('No active shopping commission rule matches this payment');
      rate = Number(rule.rows[0].value); ruleId = rule.rows[0].id;
    } else { const rule = await client.query(`SELECT * FROM commission_rules WHERE event_type='generic' AND is_active=true AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`); if (rule.rows[0]) { rate = Number(rule.rows[0].value); ruleId = rule.rows[0].id; } }
    const commission = await client.query(`INSERT INTO commissions (affiliate_id,conversion_id,rule_id,amount,rate,status,commission_type) VALUES ($1,$2,$3,$4,$5,'pending','DIRECT') RETURNING *`, [payment.affiliate_id, conversion.rows[0].id, ruleId, (Number(payment.amount) * rate / 100).toFixed(2), rate]);
    let teamCommission = null;
    if (payment.affiliate_role === 'affiliate' && payment.parent_affiliate_id) {
      const team = await client.query(`SELECT COUNT(*)::INTEGER AS total FROM users WHERE parent_affiliate_id=$1 AND deleted_at IS NULL`, [payment.parent_affiliate_id]);
      const teamRate = Number(team.rows[0].total) <= 15 ? 5 : 7;
      const created = await client.query(`INSERT INTO commissions (affiliate_id,conversion_id,rule_id,amount,rate,status,commission_type) VALUES ($1,$2,NULL,$3,$4,'pending','TEAM') RETURNING *`, [payment.parent_affiliate_id, conversion.rows[0].id, (Number(payment.amount) * teamRate / 100).toFixed(2), teamRate]);
      teamCommission = created.rows[0];
    }
    return { conversion: conversion.rows[0], commission: commission.rows[0], teamCommission, alreadyRecorded: false };
  }
}
module.exports = new PaymentRepository();
