"use client";
import HeroBanner from "../../organisms/HeroBanner";
import BlogItems from "./BlogItems";
import "@/uploads/sass/blogs/blogs.css";
import { useGetAllActiveBlogsQuery } from "@/store/backendSlice/blogAPISlice";
import Loading from "@/app/loading";

export default function BlogListingPage() {
  const {
    data: blogResult,
    isLoading,
    isError,
  } = useGetAllActiveBlogsQuery(undefined);
  const blogs = blogResult ?? [];
  isLoading ? <Loading /> : null;
  console.log(blogs);
  return (
    <main>
      <HeroBanner
        classname="blog_listing"
        heading="Blogs"
        desc="Explore the art of silver jewellery, styling inspiration, and meaningful gifts that celebrate the rich heritage of Marwar."
        mediaSrc="/images/other/blog-banner.jpg"
        posterSrc="/images/other/blog-banner.jpg"
      />
      {blogs.length > 0 && <BlogItems data={blogs} />}
    </main>
  );
}
