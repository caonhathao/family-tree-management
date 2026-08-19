export interface IBlogDto {
  id?: string;
  slug: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
export interface IBlogsDto {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBlogList {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBlogDeleted {
  id: string;
  slug: string;
}
