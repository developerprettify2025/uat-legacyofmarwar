"use client";
import HeroBanner from "../../organisms/HeroBanner";
import ContactDetails from "./ContactDetails";
import ContactForm from "./ContactForm";
import "@/uploads/sass/contact/contact.css";
import MapSection from "./MapSection";
import { useGetHomePageDataQuery } from "@/store/frontendSlice/homePageAPISlice";
import { useGetHeaderDataQuery } from "@/store/frontendSlice/homePageAPISlice";
export default function ContactUsPage() {
  const { data: headerData } = useGetHeaderDataQuery(undefined);
  const universaldata = headerData?.page || [];
  const pageInfo: Record<string, any> = Array.isArray(universaldata)
    ? (universaldata[0] ?? {})
    : universaldata;
  const { data: homePageData, isLoading, error } = useGetHomePageDataQuery({});
  const onlyProducts = homePageData?.onlyProducts ?? [];
  return (
    <main>
      <HeroBanner
        classname="contact-banner"
        heading="Contact Us"
        desc="Every Beautiful Connection Starts with a Conversation"
        mediaSrc="/video/contact-banner.mp4"
        posterSrc="/video/contact-poster.jpg"
      />
      <ContactDetails data={pageInfo} />
      <ContactForm data={onlyProducts} />
      <MapSection />
    </main>
  );
}
