export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export const pageMeta = (page: number, pageSize: number, total: number): PageMeta => ({
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});
export const offsetOf = (page: number, pageSize: number) => (page - 1) * pageSize;
/** Escape LIKE wildcards in user search text. */
export const likePattern = (s: string) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
