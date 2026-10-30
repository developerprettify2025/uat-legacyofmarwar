"use client";
import BlogDetailBanner from "./BlogDetailBanner";
import "@/uploads/sass/blogs/blogs.css";
import BlogOverview from "./BlogOverview";
import MoreBlogs from "./MoreBlogs";
import { useGetBlogBySlugQuery } from "@/store/backendSlice/blogAPISlice";

interface BlogDetailsPageProps {
  data: any; // meta object from fetchMetaDataByUrl (not an array)
  slug: string;
}

export default function BlogDetailsPage({ data, slug  }: BlogDetailsPageProps) {
  const { data: blogResult, isLoading, isError } = useGetBlogBySlugQuery(slug, {
    skip: !slug,    
  });
  console.log(blogResult?.data?.moreBlogs);
  return (
    <main>
      <BlogDetailBanner data={blogResult?.data} />
      {blogResult?.data?.Description?.trim() && (
        <BlogOverview websiteContent={blogResult.data.Description} blogName={blogResult.data.BlogName} />
      )}
      {(blogResult?.data?.moreBlogs?.length ?? 0) > 0 && (
        <MoreBlogs data={blogResult.data.moreBlogs} />
      )}
    </main>
  );
}
