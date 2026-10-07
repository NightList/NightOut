/**
 * queryKey ของ TanStack Query ทั้งแอป — 1 factory ต่อโดเมน (ชื่อเดียวกับ services/api/<domain>.ts)
 * ใช้ตอน invalidate: queryClient.invalidateQueries({ queryKey: bookingKeys.all })
 */
export const bookingKeys = {
  all: ['booking'] as const,
  zoneAvailability: (barId: string | undefined, datetimeIso: string) => ['booking', 'zone_availability', barId, datetimeIso] as const,
  tableOptions: (bookingId: string | null) => ['booking', 'table_options', bookingId] as const,
  shareCard: (token: string) => ['booking', 'share_card', token] as const,
};
export const depositKeys = {
  all: ['deposit'] as const,
  ledger: (barId: string) => ['deposit', 'ledger', barId] as const,
};
export const barTeamKeys = {
  all: ['bar-team'] as const,
  team: (barId: string) => ['bar-team', 'team', barId] as const,
  myInvites: ['bar-team', 'my_invites'] as const,
};
export const billingKeys = {
  all: ['billing'] as const,
  events: (barId: string) => ['billing', 'events', barId] as const,
};
export const siteTeamKeys = {
  all: ['site-team'] as const,
  public: ['site-team', 'public'] as const,
};
export const siteContentKeys = {
  all: ['site-content'] as const,
  home: ['site-content', 'home'] as const,
};
