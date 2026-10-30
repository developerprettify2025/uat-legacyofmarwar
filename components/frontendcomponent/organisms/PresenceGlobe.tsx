"use client";
import { ReactNode, useState } from "react";
import Image from "next/image";
import Select from "../atoms/Select";
import "@/uploads/sass/component/component.css";

interface FilterItem {
  title: string;
  location: string;
}

interface SaleItem {
  price: string;
  status: string;
  desc: string;
  location: string;
}

interface PresenceProps {
  classname?: string;
  heading: string;
  title?: string;
  filter: boolean;
  filterData?: FilterItem[];
  saleData?: SaleItem[];
}

const stateOptions = [
  { value: "Jharkhand", label: "Jharkhand" },
  { value: "Uttar Pradesh", label: "Uttar Pradesh" },
  { value: "Haryana", label: "Haryana" },
  { value: "Punjab", label: "Punjab" },
  { value: "Uttrakhand", label: "Uttrakhand" },
];

const categoryOptions = [
  { value: "All", label: "All" },
  { value: "Drilling", label: "Drilling" },
  { value: "Mining", label: "Mining" },
  { value: "Excavation", label: "Excavation" },
  { value: "Transportation", label: "Transportation" },
];

export default function PresenceGlobe({
  classname = "",
  heading = "",
  title = "",
  filter = true,
  filterData = [],
  saleData = [],
}: PresenceProps) {
  const [activeli, setActiveLi] = useState(0);
  return (
    <div className={`presence_sec sec-pad-all ${classname}`}>
      <div className="container">
        <div className="heading">
          <h3>{heading}</h3>
        </div>
        <div className="main_wrapper flex">
          <div className="left">
            {filter && (
              <div className="upper">
                {title && <h4>{title}</h4>}
                <div className="form form-grid">
                  <Select
                    classname="state"
                    hasIcon={true}
                    label="State"
                    name="state"
                    id="state"
                    options={stateOptions}
                  />
                  <Select
                    classname="category"
                    hasIcon={true}
                    label="Category"
                    name="Category"
                    id="Category"
                    options={categoryOptions}
                  />
                </div>
              </div>
            )}
            <ul className="filter_options">
              {filter
                ? filterData.map((item, index) => (
                    <li
                      className={`filter_li ${index === activeli ? "active" : ""}`}
                      onClick={() => setActiveLi(index)}
                      key={index}
                    >
                      <div className="info">
                        <h6>{item.title}</h6>
                        <p>{item.location}</p>
                      </div>
                      <div className="icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={20}
                          height={20}
                          viewBox="0 0 16 16"
                        >
                          <path
                            fill="currentColor"
                            fillRule="evenodd"
                            d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8L4.646 2.354a.5.5 0 0 1 0-.708"
                          ></path>
                        </svg>
                      </div>
                    </li>
                  ))
                : saleData.map((item, index) => (
                    <li
                      className={`sale_li ${index === activeli ? "active" : ""}`}
                      key={index}
                    >
                      <div className="price">
                        <h6>{item.price}</h6>
                        <p>{item.status}</p>
                      </div>
                      <div className="desc">
                        <div className="content">
                          <p>{item.desc}</p>
                        </div>
                      </div>
                      <div className="loc">
                        <div className="icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            viewBox="0 0 1024 1024"
                          >
                            <path
                              fill="currentColor"
                              d="M800 416a288 288 0 1 0-576 0c0 118.1 94.5 272.1 288 456.6C705.5 688 800 534 800 416M512 960Q160 640 160 416a352 352 0 0 1 704 0q0 224-352 544"
                            ></path>
                            <path
                              fill="currentColor"
                              d="M512 512a96 96 0 1 0 0-192a96 96 0 0 0 0 192m0 64a160 160 0 1 1 0-320a160 160 0 0 1 0 320"
                            ></path>
                          </svg>
                        </div>
                        <p>{item.location}</p>
                      </div>
                    </li>
                  ))}
            </ul>
          </div>
          <div className="right">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15281527.263685085!2d72.10809512517385!3d20.75721265177787!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30635ff06b92b791%3A0xd78c4fa1854213a6!2sIndia!5e0!3m2!1sen!2sin!4v1789384483043!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              //   allowFullScreen=""
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
