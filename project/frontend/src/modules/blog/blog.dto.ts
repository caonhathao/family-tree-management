export interface IBlogDto {
  id?: string;
  slug: string;
  title: string;
  content: string;
}
export interface IBlogsDto {
  id: string;
  slug: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}
