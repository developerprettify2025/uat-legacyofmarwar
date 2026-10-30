"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import Button from "../atoms/Button";
import { useModal } from "@/hooks/useModal";
import { useAppSelector } from "@/store/hooks";
import "@/uploads/sass/component/component.css";

export default function PositionsPop() {
  const { closeModal } = useModal();
  const { isModal } = useAppSelector((state) => state.modal);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    const fileName = file ? file.name.replace(/C:\\fakepath\\/i, "") : "";

    const fileNameEl =
      e.target.parentElement?.querySelector<HTMLElement>(".file-name");
    fileNameEl?.style.setProperty(
      "--filenameinitial",
      fileName ? `"${fileName}"` : "var(--filename)",
    );

    setAttachedFile(file);
  };

  return (
    <div
      className={`model positions-pop ${isModal === "position" ? "is-open" : ""}`}
    >
      <button className="close" onClick={closeModal}>
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.75 0.75L23.25 23.25M0.75 23.25L23.25 0.75"
            stroke="black"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="model-body">
        <div className="post_wrapper">
          <div className="post_details_wrap">
            <div className="website-content post-content">
              <h3>Digital Designer</h3>
              <p>Job Location: Sector 49, Gurugram</p>
              <p>
                We are seeking a creative and detail-oriented Copywriter and
                Content Writer to join our team. The ideal candidate will have a
                passion for writing, a keen understanding of various industries,
                and the ability to craft compelling content for both digital and
                print platforms.
              </p>
              <ul>
                <li>Minimum Work Experience: 1-2 years</li>
                <li>Hike offered as per Industry Standards/ Negotiable</li>
                <li>Job Type: Full time (Work from office)</li>
                <li>Working Days: 6 (Weekly)</li>
              </ul>
              <h3>Responsibilities</h3>
              <ul>
                <li>
                  Produce high-quality, engaging content for various industries
                  to meet client&apos;s needs, including website copy, blog
                  posts, articles, social media content, and more.
                </li>
                <li>
                  Work closely with clients to understand their brand voice,
                  messaging, and objectives, and tailor content accordingly.
                </li>
              </ul>
              <h3>Qualifications</h3>
              <ul>
                <li>
                  Proven experience as a Copywriter, Content Writer, or similar
                  role.
                </li>
                <li>Excellent writing, editing, and proofreading skills.</li>
                <li>
                  Strong research skills and the ability to understand complex
                  topics.
                </li>
                <li>Familiarity with SEO best practices.</li>
              </ul>
            </div>
          </div>
          <div className="post_form form">
            <div className="heading">
              <h2>
                Apply <span>Now</span>
              </h2>
            </div>
            <div className="form-grid">
              <div className="form-group border">
                <label htmlFor="applicant-name">Name*</label>
                <input
                  id="applicant-name"
                  type="text"
                  className="form-control no-focus"
                  placeholder="Your Name"
                />
                <div className="error">Enter Your Name</div>
              </div>
              <div className="form-group border">
                <label htmlFor="applicant-email">Email Address*</label>
                <input
                  id="applicant-email"
                  type="email"
                  className="form-control no-focus"
                  placeholder="email@example.com"
                />
                <div className="error">Enter Your Email</div>
              </div>
              <div className="form-group border">
                <label htmlFor="applicant-phone">Phone*</label>
                <input
                  id="applicant-phone"
                  type="tel"
                  className="form-control no-focus"
                  placeholder="+91 99999 99999"
                />
                <div className="error">Enter Your Phone No.</div>
              </div>
              <div className="form-group border">
                <label htmlFor="applicant-position">Apply For*</label>
                <input
                  id="applicant-position"
                  type="text"
                  className="form-control no-focus"
                  placeholder="Digital Designer"
                />
                <div className="error">Enter Your Application</div>
              </div>
              <div className="form-group full file-input border">
                <label htmlFor="applicant-resume">Attach Resume*</label>
                <input
                  id="applicant-resume"
                  type="file"
                  className="form-control no-focus"
                  onChange={handleFileChange}
                />
                <div className="file-name"></div>
                <div className="error">Please Upload File</div>
              </div>
            </div>
            <Button
              buttonText="Apply Now"
              classname="solid-secondary"
              svgpath={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={16}
                  height={16}
                  viewBox="0 0 1024 1024"
                >
                  <path
                    fill="currentColor"
                    d="M340.9 149.3a30.6 30.6 0 0 0 0 42.8L652.7 512L341 831.9a30.6 30.6 0 0 0 0 42.7a29 29 0 0 0 41.7 0l331.6-340.3a32 32 0 0 0 0-44.6L382.6 149.4a29 29 0 0 0-41.7 0z"
                  ></path>
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
