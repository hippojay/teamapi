import React from 'react';

const CustomGrid = ({ className, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-custom-grid ${className || ''}`}
      {...props}
    >
      {/* Main rectangle */}
      <rect width="18" height="18" x="3" y="3" rx="2" />
      
      {/* Horizontal lines - 3 rows */}
      <path d="M3 9h18" /> {/* First row divider */}
      <path d="M3 15h18" /> {/* Second row divider */}
      
      {/* Vertical lines - for top row: 2 equal columns */}
      <path d="M12 3v6" /> {/* Top row middle divider */}
      
      {/* Vertical lines - for middle row: 3 columns */}
      <path d="M9 9v6" /> {/* Middle row first divider */}
      <path d="M15 9v6" /> {/* Middle row second divider */}
      
      {/* Bottom row has no vertical dividers (1 box) */}
    </svg>
  );
};

export default CustomGrid;
