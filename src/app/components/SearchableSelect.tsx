"use client";

import { useState, useEffect, useRef } from "react";

interface Option {
  id: string;
  value: string;
  label: string;
}

interface Props {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: Option[];
}

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Set input text to selected value
  useEffect(() => {
    const selected = options.find((o) => o.value === value);
    setInputValue(selected ? selected.label : "");
  }, [value, options]);

  // Close list if clicked outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter options by typing
  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="relative" ref={boxRef}>
      <label className="label">
        <span className="label-text">{label}</span>
      </label>

      {/* Input box */}
      <input
        type="text"
        className="input input-bordered w-full"
        value={inputValue}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setInputValue(e.target.value);
          setOpen(true);
        }}
        placeholder={`Search ${label}`}
      />

      {/* Dropdown list */}
      {open && (
        <ul className="absolute z-20 mt-1 bg-white border w-full max-h-60 overflow-auto rounded shadow-md">
          {filtered.length === 0 ? (
            <li className="p-2 text-gray-500">No results</li>
          ) : (
            filtered.map((opt) => (
              <li
                key={opt.id}
                className="p-1 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onChange(opt.value);
                  setInputValue(opt.label);
                  setOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
