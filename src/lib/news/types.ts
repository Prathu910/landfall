export type NewsSource = {
  id: string;
  title: string;
  detail: string;
  url: string;
  checkedAt: string;
};

export type NewsArticle = {
  path: string;
  title: string;
  seoTitle: string;
  shortTitle: string;
  description: string;
  summary: string;
  category: string;
  effectiveAt: string;
  publishedAt: string;
  updatedAt: string;
  image: string;
  imageAlt: string;
  sources: readonly NewsSource[];
};

export type FeeExample = {
  visa: string;
  name: string;
  scope: string;
  before: number;
  after: number;
  sourceId: string;
};
