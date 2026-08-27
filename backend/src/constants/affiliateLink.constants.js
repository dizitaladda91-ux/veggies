const AFFILIATE_LINK_TYPES = Object.freeze({
  SHOPPING: 'SHOPPING',
  RECRUITMENT: 'RECRUITMENT',
});

const SHOPPING_COMMISSION_TIERS = Object.freeze([
  { maximumOrderAmount: 1000, rate: 10 },
  { maximumOrderAmount: 1500, rate: 15 },
  { maximumOrderAmount: Infinity, rate: 20 },
]);

const RECRUITMENT_TEAM_TIERS = Object.freeze([
  { maximumTeamMembers: 15, rate: 5 },
  { maximumTeamMembers: Infinity, rate: 7 },
]);

module.exports = { AFFILIATE_LINK_TYPES, SHOPPING_COMMISSION_TIERS, RECRUITMENT_TEAM_TIERS };
