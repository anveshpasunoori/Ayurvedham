// Pure authorization policies. Identity and memberships must be loaded from trusted server storage.
export function ownsAccount(actor, accountId) {
  return Boolean(actor?.accountId && actor.accountId === accountId);
}
export function institutionAccess(actor, institutionId, memberships, allowedRoles) {
  return Boolean(actor?.accountId && institutionId && Array.isArray(memberships) && Array.isArray(allowedRoles) && memberships.some(m => m.accountId === actor.accountId && m.institutionId === institutionId && allowedRoles.includes(m.role)));
}
export function publicPractitioner(profile) {
  if (profile?.verificationStatus !== 'verified') return null;
  return {displayName: profile.displayName, registrationAuthority: profile.registrationAuthority};
}
