import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <header className="w-full bg-[#fbe497]">
      <div className="flex items-center justify-between px-2 md:px-8 h-21">
        {/* Logo */}
       <img
  src="/logo.png"
  alt="QuizMaster Logo"
  className="h-32 w-32 md:h-32 md:w-32"
/>
</div>
    </header>
  );
}
