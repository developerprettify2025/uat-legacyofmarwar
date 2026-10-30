import Image from "next/image";

interface BlogDetailBannerProps {
  data: any; // meta object from fetchMetaDataByUrl (not an array)
}
export default function BlogDetailBanner({ data }: BlogDetailBannerProps) {
  return (
    <div className="blog-detail-banner banner">
      <div className="bg">
        <Image
          src={`/OnlineImages/BlogImages/${data?.BlogBannerImage	}`}
          width={1280}
          height={700}
          alt={data?.BlogNameURL}
        ></Image>
        <div className="banner-wrapper">
          <div className="container">
            <div className="content">
              <p>{data?.PostedDate}</p>
              <h1>{data?.BlogName}</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
