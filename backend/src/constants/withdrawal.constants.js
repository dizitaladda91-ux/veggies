const WITHDRAWAL_STATUS = {
    PENDING: "pending",
    UNDER_REVIEW: "under_review",
    APPROVED: "approved",
    PROCESSING: "processing",
    SUCCESS: "success",
    FAILED: "failed",
    REJECTED: "rejected",
    CANCELLED: "cancelled"
};

const PAYMENT_GATEWAYS = {
    RAZORPAY: "RAZORPAY",
    MANUAL: "MANUAL",
    BANK_TRANSFER: "BANK_TRANSFER"
};

const WITHDRAWAL_TYPES = {
    BANK_TRANSFER: "BANK_TRANSFER",
    UPI: "UPI"
};

const MIN_WITHDRAWAL_AMOUNT = 100;

const MAX_WITHDRAWAL_AMOUNT = 100000;

module.exports = {
    WITHDRAWAL_STATUS,
    PAYMENT_GATEWAYS,
    WITHDRAWAL_TYPES,
    MIN_WITHDRAWAL_AMOUNT,
    MAX_WITHDRAWAL_AMOUNT
};
