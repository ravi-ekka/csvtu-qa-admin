'use client';

import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className="footer sm:footer-horizontal bg-gray-400 text-black-content items-center p-4 border-t shadow-md justify-center">
      <Link href="https://csvtu-questions-answer.web.app/" className="text-lg text-center text-blue-800">
        csvtu-questions-answer.web.app
      </Link>
    </footer>
  );
};

export default Footer;