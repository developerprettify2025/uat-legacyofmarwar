import DetailForm from "../../organisms/DetailForm";

interface BlogOverviewProps {
  websiteContent?: string;
  blogName?:string
}

export default function BlogOverview({
  websiteContent = "",
  blogName = ""
}: BlogOverviewProps) {
  return (
    <div className="blog_overview sec-pad-all">
      <div className="container">
        <div className="main_wrapper flex">
          <div className="colA">
            <div
              className="website-content"
              dangerouslySetInnerHTML={{ __html: websiteContent }}
            ></div>
          </div>
          <div className="colB">
            <DetailForm blogName={blogName} />
          </div>
        </div>
      </div>
    </div>
  );
}
