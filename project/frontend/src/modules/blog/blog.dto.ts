export interface ICreateBlogDto {
  slug: string;
  title: string;
  content: string;
}

export interface IUpdateBlogDto {
  blogId: string;
  title: string;
  slug: string;
  content: string;
}

export interface IBlogResponseDto {
  id: string;
}

export interface IBlogDetailDto {
  id: string;
  title: string;
  slug: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
