import React from 'react';

/**
 * Nexus Connect Brand Logo:
 * Solid vibrant blue rounded square with an energetic white checkmark,
 * matching the exact branding from the screenshots and design specification.
 */
export default function NexusLogo({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-8 h-8 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const currentIconSize = iconSizes[size] || iconSizes.md;

  return (
    <div
      className={`${currentSizeClass} bg-[#0066ff] text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30 select-none ${className}`}
      aria-label="Nexus Connect Logo"
    >
      <svg
        className={`${currentIconSize} text-white`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}
