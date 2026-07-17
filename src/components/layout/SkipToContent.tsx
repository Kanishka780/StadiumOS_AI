import React from 'react';

/**
 * SkipToContent component that provides keyboard accessibility bypass links
 * for assistive technology and keyboard navigation users.
 */
export const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-sky-500 focus:text-slate-950 focus:rounded focus:outline-none focus:font-bold focus:shadow-lg transition-all"
    >
      Skip to Main Content
    </a>
  );
};
