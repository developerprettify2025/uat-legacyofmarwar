// "use client";
// import { useState, useRef, useEffect } from "react";
// //import { DateRange, type Range, type RangeKeyDict } from "react-date-range";
// import { format } from "date-fns";

// import "react-date-range/dist/styles.css";
// import "react-date-range/dist/theme/default.css";

// export default function DateRangeFilter() {
//   const [open, setOpen] = useState<boolean>(false);
//   const [selected, setSelected] = useState<boolean>(false);
//   const ref = useRef<HTMLDivElement>(null);

//   const [range, setRange] = useState<Range[]>([
//     {
//       startDate: new Date(),
//       endDate: new Date(),
//       key: "selection",
//     },
//   ]);

//   const handleSelect = (item: RangeKeyDict) => {
//     setRange([item.selection]);
//     setSelected(true);
//     // setOpen(false); // optional: close on select
//   };

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (ref.current && !ref.current.contains(event.target as Node)) {
//         setOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const { startDate, endDate } = range[0];

//   return (
//     <div
//       className="date_select"
//       style={{ position: "relative", display: "inline-block" }}
//       ref={ref}
//     >
//       <button
//         type="button"
//         onClick={() => setOpen((prev) => !prev)}
//         style={{
//           borderBottom: "1px solid #666",
//           width: "200px",
//           color: "#666",
//           padding: "4px 10px 4px 0",
//           fontSize: "14px",
//           height: "36px",
//           lineHeight: "17px",
//           cursor: "pointer",
//           display: "flex",
//           alignItems: "center",
//           gap: "6px",
//         }}
//       >
//         {selected && startDate && endDate
//           ? `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`
//           : "Date"}
//       </button>

//       {open && (
//         <div
//           className="date_select_dropdown"
//           style={{
//             position: "absolute",
//             zIndex: 1000,
//             left: "-70%",
//             top: "100%",
//             borderRadius: "0 0 10px 10px",
//             boxShadow: "0 0 6px #959da533",
//           }}
//         >
//           <DateRange
//             editableDateInputs={true}
//             onChange={handleSelect}
//             onRangeFocusChange={(focus) => {
//               if (focus[1] === 0 && selected) setOpen(false);
//             }}
//             moveRangeOnFirstSelection={false}
//             ranges={range}
//           />
//         </div>
//       )}
//     </div>
//   );
// }
