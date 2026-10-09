export const baht = (n: number) => `฿${n.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;
export const date = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { dateStyle: 'medium' });
export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
