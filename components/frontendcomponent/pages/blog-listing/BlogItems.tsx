import BlogCol from "../../molecules/BlogCol";

interface BlogItemsProps {
  data: any[];
}
export default function BlogItems({ data }: BlogItemsProps) {
  const blogsData = (data ?? []).map((blog: any) => ({
    linkHref: `/blogs/${blog.BlogNameURL}`,
    mediaSrc: `/OnlineImages/BlogImages/${blog.BlogImage}`,
    title: blog.BlogName,
    date: blog.PostedDate
      ? new Date(blog.PostedDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "",
  }));
  return (
    <div className="blogs_list_sec sec-pad-all">
      <div className="container">
        <div className="main_wrapper">
          {blogsData.map((item, index) => (
            <BlogCol data={item} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
