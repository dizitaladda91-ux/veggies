const PAYOUT_STATUS = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    SUCCESS: "SUCCESS",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED"
};

const PAYOUT_GATEWAYS = {
    RAZORPAY: "RAZORPAY",
    MANUAL: "MANUAL",
    BANK_TRANSFER: "BANK_TRANSFER"
};

const PAYOUT_GATEWAY_STATUS = {
    CREATED: "created",
    PROCESSED: "processed",
    FAILED: "failed"
};

const PAYOUT_SORT_FIELDS = [
    "created_at",
    "amount",
    "status",
    "processed_at",
    "completed_at"
];

const PAYOUT_DEFAULTS = {
    PAGE: 1,
    LIMIT: 10,
    MAX_LIMIT: 100
};

module.exports = {
    PAYOUT_STATUS,
    PAYOUT_GATEWAYS,
    PAYOUT_GATEWAY_STATUS,
    PAYOUT_SORT_FIELDS,
    PAYOUT_DEFAULTS
};