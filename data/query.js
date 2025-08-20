export const AUTH_URL = 'https://learn.zone01oujda.ma/api/auth/signin';
export const GRAPHQL_URL = 'https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql';

// GraphQL Queries
export const GET_USER_INFO = `
{
  user {
    firstName
    lastName
  }
}`;

export const GET_AUDITS_INFO = `
{
  user {
    auditRatio
    audits_aggregate(where: {closureType: {_eq: succeeded}}) {
      aggregate {
        count
      }
    }
    failed_audits: audits_aggregate(where: {closureType: {_eq: failed}}) {
      aggregate {
        count
      }
    }
  }
}`;

export const GET_LEVEL_INFO = `
{
  transaction(
    where: {_and: [{type: {_eq: "level"}}, {event: {object: {name: {_eq: "Module"}}}}]}
    order_by: {amount: desc}
    limit: 1
  ) {
    amount
  }
}`;

export const GET_XP_PROGRESS = `
{
  transaction(
    where: {type: {_eq: "xp"}},
    order_by: {createdAt: asc}
  ) {
    amount
    createdAt
    object {
      name
    }
  }
}`;

export const GET_SKILLS = `
{
  user {
    transactions(where: {type: {_nin: ["xp", "level", "up", "down"]}}) {
      type
      amount
    }
  }
}`;
