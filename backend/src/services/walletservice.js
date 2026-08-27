const db = require("../database");
const WalletRepository = require("../repositories/walletrepository");
const ApiError = require("../utils/apiError");

class WalletService {

    /* -------------------------------------------------------------------------- */
    /*                               PRIVATE HELPERS                              */
    /* -------------------------------------------------------------------------- */

    /**
     * Validate amount
     */
    validateAmount(amount) {
        const value = Number(amount);

        if (isNaN(value) || value <= 0) {
            throw new ApiError(
                400,
                "Invalid amount."
            );
        }

        return value;
    }

    /**
     * Get & Lock wallet
     */
    async getLockedWallet(userId, client) {

        const wallet =
            await WalletRepository.findByUserId(
                userId,
                client
            );

        if (!wallet) {
            throw new ApiError(
                404,
                "Wallet not found."
            );
        }

        const lockedWallet =
            await WalletRepository.lockWallet(
                wallet.id,
                client
            );

        if (!lockedWallet) {
            throw new ApiError(
                404,
                "Wallet not found."
            );
        }

        if (lockedWallet.status !== "ACTIVE") {
            throw new ApiError(
                400,
                "Wallet is not active."
            );
        }

        return lockedWallet;
    }

    /**
     * Create wallet ledger
     */
    async createLedger(
        wallet,
        updatedWallet,
        data,
        type,
        client
    ) {

        return WalletRepository.createTransaction(
            {

                walletId: wallet.id,

                userId: wallet.user_id,

                type,

                referenceType:
                    data.referenceType,

                referenceId:
                    data.referenceId,

                amount:
                    data.amount,

                openingBalance:
                    wallet.available_balance,

                closingBalance:
                    updatedWallet.available_balance,

                description:
                    data.description,

                status:
                    data.status || "SUCCESS",

                createdBy:
                    data.createdBy

            },
            client
        );

    }

    /**
     * Execute database transaction
     */
    async executeTransaction(callback) {

        const client = await db.getClient();

        try {

            await client.query("BEGIN");

            const result =
                await callback(client);

            await client.query("COMMIT");

            return result;

        } catch (error) {

            await client.query("ROLLBACK");

            throw error;

        } finally {

            client.release();

        }

    }

    /* -------------------------------------------------------------------------- */
    /*                               BASIC METHODS                                */
    /* -------------------------------------------------------------------------- */

    /**
     * Create wallet
     */
    async createWallet(userId) {

        const exists =
            await WalletRepository.exists(userId);

        if (exists) {
            throw new ApiError(
                409,
                "Wallet already exists."
            );
        }

        return WalletRepository.create(userId);

    }

    async ensureWallet(userId) {
        return WalletRepository.findOrCreateByUserId(userId);
    }

    /**
     * Get wallet
     */
    async getWallet(userId) {

        const wallet = await this.ensureWallet(userId);

        return wallet;

    }

    /**
     * Wallet summary
     */
    async getWalletSummary(userId) {

        const wallet = await this.ensureWallet(userId);

        return WalletRepository.getWalletSummary(
            wallet.id
        );

    }

    /**
     * Wallet transaction history
     */
    async getTransactions(
        userId,
        page = 1,
        limit = 20
    ) {

        const wallet = await this.ensureWallet(userId);

        page = Number(page);
        limit = Number(limit);

        const offset =
            (page - 1) * limit;

        const transactions =
            await WalletRepository.getTransactions(
                wallet.id,
                limit,
                offset
            );

        const total =
            await WalletRepository.countTransactions(
                wallet.id
            );

        return {

            walletId:
                wallet.id,

            transactions,

            pagination: {

                page,

                limit,

                total,

                totalPages:
                    Math.ceil(total / limit)

            }

        };

    }

    /* -------------------------------------------------------------------------- */
    /*                           FINANCIAL OPERATIONS                             */
    /* -------------------------------------------------------------------------- */

    /**
     * Credit Wallet
     */
    async credit(data) {

        return this.executeTransaction(async (client) => {

            const amount = this.validateAmount(data.amount);

            const wallet = await this.getLockedWallet(
                data.userId,
                client
            );

            const updatedWallet =
                await WalletRepository.credit(
                    wallet.id,
                    amount,
                    client
                );

            await this.createLedger(
                wallet,
                updatedWallet,
                {
                    ...data,
                    amount
                },
                data.type,
                client
            );

            return updatedWallet;

        });

    }

    /**
     * Debit Wallet
     */
    async debit(data) {

        return this.executeTransaction(async (client) => {

            const amount = this.validateAmount(data.amount);

            const wallet = await this.getLockedWallet(
                data.userId,
                client
            );

            if (
                Number(wallet.available_balance) < amount
            ) {
                throw new ApiError(
                    400,
                    "Insufficient wallet balance."
                );
            }

            const updatedWallet =
                await WalletRepository.debit(
                    wallet.id,
                    amount,
                    client
                );

            await this.createLedger(
                wallet,
                updatedWallet,
                {
                    ...data,
                    amount
                },
                data.type,
                client
            );

            return updatedWallet;

        });

    }

    /**
     * Freeze Balance
     */
    async freezeBalance(data) {

        return this.executeTransaction(async (client) => {

            const amount = this.validateAmount(data.amount);

            const wallet = await this.getLockedWallet(
                data.userId,
                client
            );

            if (
                Number(wallet.available_balance) < amount
            ) {
                throw new ApiError(
                    400,
                    "Insufficient wallet balance."
                );
            }

            const updatedWallet =
                await WalletRepository.freezeBalance(
                    wallet.id,
                    amount,
                    client
                );

            await this.createLedger(
                wallet,
                updatedWallet,
                {
                    ...data,
                    amount
                },
                "WITHDRAWAL_HOLD",
                client
            );

            return updatedWallet;

        });

    }

    /**
     * Release Frozen Balance
     */
    async releaseBalance(data) {

        return this.executeTransaction(async (client) => {

            const amount = this.validateAmount(data.amount);

            const wallet = await this.getLockedWallet(
                data.userId,
                client
            );

            if (
                Number(wallet.pending_balance) < amount
            ) {
                throw new ApiError(
                    400,
                    "Insufficient pending balance."
                );
            }

            const updatedWallet =
                await WalletRepository.releaseBalance(
                    wallet.id,
                    amount,
                    client
                );

            await this.createLedger(
                wallet,
                updatedWallet,
                {
                    ...data,
                    amount
                },
                "WITHDRAWAL_RELEASE",
                client
            );

            return updatedWallet;

        });

    }

    /* -------------------------------------------------------------------------- */
    /*                             WITHDRAWAL METHODS                             */
    /* -------------------------------------------------------------------------- */

    /**
     * Complete Withdrawal
     * Call this only after payout is successful.
     */
    async withdraw(data) {

        return this.executeTransaction(async (client) => {

            const amount = this.validateAmount(data.amount);

            const wallet = await this.getLockedWallet(
                data.userId,
                client
            );

            if (
                Number(wallet.pending_balance) < amount
            ) {
                throw new ApiError(
                    400,
                    "Insufficient pending balance."
                );
            }

            const updatedWallet =
                await WalletRepository.completeWithdrawal(
                    wallet.id,
                    amount,
                    client
                );

            await this.createLedger(
                wallet,
                updatedWallet,
                {
                    ...data,
                    amount
                },
                "WITHDRAWAL_SUCCESS",
                client
            );

            return updatedWallet;

        });

    }

    /* -------------------------------------------------------------------------- */
    /*                           TRANSACTION METHODS                              */
    /* -------------------------------------------------------------------------- */

    /**
     * Get transaction by ID
     */
    async getTransactionById(transactionId, userId) {

        const transaction =
            await WalletRepository.findTransactionById(
                transactionId
            );

        if (!transaction) {
            throw new ApiError(
                404,
                "Transaction not found."
            );
        }

        if (transaction.user_id !== userId) {
            throw ApiError.forbidden("You are not authorized to access this transaction.");
        }

        return transaction;

    }

    /**
     * Get transaction by reference
     */
    async getTransactionByReference(referenceId) {

        const transaction =
            await WalletRepository.findByReference(
                referenceId
            );

        if (!transaction) {
            throw new ApiError(
                404,
                "Transaction not found."
            );
        }

        return transaction;

    }

    /**
     * Get latest transaction
     */
    async getLatestTransaction(userId) {

        const wallet =
            await WalletRepository.findByUserId(
                userId
            );

        if (!wallet) {
            throw new ApiError(
                404,
                "Wallet not found."
            );
        }

        return WalletRepository.getLatestTransaction(
            wallet.id
        );

    }

    /**
     * Get wallet statistics
     */
    async getWalletStats(userId) {

        const wallet =
            await WalletRepository.findByUserId(
                userId
            );

        if (!wallet) {
            throw new ApiError(
                404,
                "Wallet not found."
            );
        }

        return WalletRepository.getTransactionStats(
            wallet.id
        );

    }

    /**
     * Get transactions by date range
     */
    async getTransactionsByDateRange(
        userId,
        startDate,
        endDate
    ) {

        const wallet =
            await WalletRepository.findByUserId(
                userId
            );

        if (!wallet) {
            throw new ApiError(
                404,
                "Wallet not found."
            );
        }

        return WalletRepository.getTransactionsByDateRange(
            wallet.id,
            startDate,
            endDate
        );

    }

}

module.exports = new WalletService();
