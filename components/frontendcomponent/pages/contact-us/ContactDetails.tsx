"use client";

import Link from "next/link";
import { useMemo } from "react";

interface SocialLink {
  name: string;
  apiKey: string;
  viewBox: string;
  path: string;
}

interface ContactRecord {
  StaticEmail?: string | null;
  StaticTwitterLink?: string | null;
  StaticFacebookLink?: string | null;
  StaticInstagramLink?: string | null;
  StaticLinkedInLink?: string | null;
  StaticAddress?: string | null;
  StaticPhoneNumber?: string | null;
  StaticWhatsApp?: string | null;
  StaticGoogleMapLink?: string | null;
}

interface ContactDetailsProps {
  data: ContactRecord[] | ContactRecord | null | undefined;
}

const socialLinks: SocialLink[] = [
  // {
  //   name: "Twitter",
  //   apiKey: "StaticTwitterLink",
  //   viewBox: "0 0 16 16",
  //   path: "M9.294 6.928L14.357 1h-1.2L8.762 6.147L5.25 1H1.2l5.31 7.784L1.2 15h1.2l4.642-5.436L10.751 15h4.05zM7.651 8.852l-.538-.775L2.832 1.91h1.843l3.454 4.977l.538.775l4.491 6.47h-1.843z",
  // },
  {
    name: "Facebook",
    apiKey: "StaticFacebookLink",
    viewBox: "0 0 640 640",
    path: "M240 363.3V576h116V363.3h86.5l18-97.8H356v-34.6c0-51.7 20.3-71.5 72.7-71.5c16.3 0 29.4.4 37 1.2V71.9C451.4 68 416.4 64 396.2 64C289.3 64 240 114.5 240 223.4v42.1h-66v97.8z",
  },
  {
    name: "Instagram",
    apiKey: "StaticInstagramLink",
    viewBox: "0 0 24 24",
    path: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3",
  },
  // {
  //   name: "LinkedIn",
  //   apiKey: "StaticLinkedInLink",
  //   viewBox: "0 0 24 24",
  //   path: "M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z",
  // },
];

export default function ContactDetails({ data }: ContactDetailsProps) {
  const contact = Array.isArray(data) ? data[0] : data;

  const socialLinkItems = useMemo(
    () =>
      socialLinks
        .map((social) => ({
          ...social,
          href: String(contact?.[social.apiKey as keyof ContactRecord] ?? "").trim(),
        }))
        .filter((social) => social.href),
    [contact]
  );

  const email = contact?.StaticEmail?.trim() || "";
  const address = contact?.StaticAddress?.trim() || "";
  const phone = contact?.StaticPhoneNumber?.trim() || "";
  const whatsapp = contact?.StaticWhatsApp?.trim() || "";
  const mapLink = contact?.StaticGoogleMapLink?.trim() || "";

  return (
    <section>
      <div className="contact_wrapper sec-pad-all">
        <div className="container">
          <div className="main_wrapper">
            {/* Address */}
            <div className="contact_col">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="m12.065 21.243l-.006-.005zm.182-.274a29 29 0 0 0 3.183-3.392c2.04-2.563 3.281-5.09 3.365-7.337a6.8 6.8 0 1 0-13.591 0c.085 2.247 1.327 4.774 3.366 7.337a29 29 0 0 0 3.183 3.392q.166.15.247.218zm-.985 1.165S4 16.018 4 10a8 8 0 1 1 16 0c0 6.018-7.262 12.134-7.262 12.134c-.404.372-1.069.368-1.476 0M12 12.8a2.8 2.8 0 1 0 0-5.6a2.8 2.8 0 0 0 0 5.6m0 1.2a4 4 0 1 1 0-8a4 4 0 0 1 0 8"
                  />
                </svg>
              </div>

              <h6>Registered Head Office</h6>
              <p>{address || "Address not available"}</p>

              {mapLink && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="get_directions"
                >
                  Get Directions{" "}
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 16 16">
                    <path
                      fill="currentColor"
                      fillRule="evenodd"
                      d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"
                    />
                  </svg>
                </a>
              )}
            </div>

            {/* Email and Social Media */}
            <div className="contact_col">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M19.435 4.065H4.565a2.5 2.5 0 0 0-2.5 2.5v10.87a2.5 2.5 0 0 0 2.5 2.5h14.87a2.5 2.5 0 0 0 2.5-2.5V6.565a2.5 2.5 0 0 0-2.5-2.5m-14.87 1h14.87a1.49 1.49 0 0 1 1.49 1.39c-2.47 1.32-4.95 2.63-7.43 3.95a6 6 0 0 1-1.06.53a2.08 2.08 0 0 1-1.67-.39c-1.42-.75-2.84-1.51-4.25-2.26c-1.14-.6-2.3-1.21-3.44-1.82a1.49 1.49 0 0 1 1.49-1.4m16.37 12.37a1.5 1.5 0 0 1-1.5 1.5H4.565a1.5 1.5 0 0 1-1.5-1.5V7.6c2.36 1.24 4.71 2.5 7.07 3.75a5.6 5.6 0 0 0 1.35.6a2.87 2.87 0 0 0 2-.41c1.45-.76 2.89-1.53 4.34-2.29c1.04-.56 2.07-1.1 3.11-1.65Z"
                  />
                </svg>
              </div>

              <h6>Email us</h6>
              {email && <a href={`mailto:${email}`}>{email}</a>}

              <ul className="social_icons">
                {socialLinkItems.map((social) => (
                  <li key={social.name}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={20}
                        height={20}
                        viewBox={social.viewBox}
                      >
                        <path fill="currentColor" d={social.path} />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Phone and WhatsApp */}
            <div className="contact_col">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 20 20">
                  <path
                    fill="currentColor"
                    d="m6.987 2.066l-.717.216a3.5 3.5 0 0 0-2.454 2.854c-.297 2.068.367 4.486 1.968 7.259c1.597 2.766 3.355 4.548 5.29 5.328a3.5 3.5 0 0 0 3.715-.705l.542-.514a2 2 0 0 0 .247-2.623l-1.356-1.88a1.5 1.5 0 0 0-1.655-.556l-2.051.627l-.053.01c-.226.033-.748-.456-1.398-1.582c-.68-1.178-.82-1.867-.633-2.045l1.043-.973a2.5 2.5 0 0 0 .575-2.85l-.662-1.471a2 2 0 0 0-2.4-1.095m1.49 1.505l.66 1.471a1.5 1.5 0 0 1-.344 1.71l-1.046.974C7.078 8.36 7.3 9.442 8.2 11c.846 1.466 1.618 2.19 2.448 2.064l.124-.026l2.088-.637a.5.5 0 0 1 .552.185l1.356 1.88a1 1 0 0 1-.123 1.312l-.543.514a2.5 2.5 0 0 1-2.653.503c-1.698-.684-3.303-2.311-4.798-4.9C5.152 9.3 4.545 7.093 4.806 5.278a2.5 2.5 0 0 1 1.753-2.039l.717-.216a1 1 0 0 1 1.2.548"
                  />
                </svg>
              </div>

              <h6>Phone</h6>
              {phone && <a href={`tel:+91${phone}`}>+91-{phone}</a>}

              {phone && (
                <a
                  href={`https://wa.me/+91${phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="get_directions"
                >
                  Whatsapp{" "}
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 16 16">
                    <path
                      fill="currentColor"
                      fillRule="evenodd"
                      d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}