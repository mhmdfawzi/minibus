export type ApiId = string;
export type ISODate = string;
export type ISODateTime = string;

export interface ApiList<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
