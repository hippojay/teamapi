// Icon components for the application
import React from 'react';

// Microsoft Teams Icon (Bootstrap)
export const MicrosoftTeamsIcon = ({ className }) => (
  <svg
    className={className || "h-5 w-5"}
    fill="currentColor"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M9.186 4.797a2.42 2.42 0 1 0-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 0 1 .682.716v4.294a4.197 4.197 0 0 1-4.093 4.293c-1.618-.04-3-.99-3.667-2.35Zm10.737-9.372a1.674 1.674 0 1 1-3.349 0 1.674 1.674 0 0 1 3.349 0m-2.238 9.488-.12-.002a5.2 5.2 0 0 0 .381-2.07V6.306a1.7 1.7 0 0 0-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.6 2.6 0 0 1-2.598 2.598z"/>
    <path d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.68.68 0 0 1-.682.682H.682A.68.68 0 0 1 0 10.853V4.03c0-.377.305-.682.682-.682Zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945z"/>
  </svg>
);

// Slack Icon (Bootstrap)
export const SlackIcon = ({ className }) => (
<svg 
  className={className || "h-5 w-5"} 
  fill="currentColor" 
  viewBox="0 0 16 16"
  >
  <path d="M3.362 10.11c0 .926-.756 1.681-1.681 1.681S0 11.036 0 10.111.756 8.43 1.68 8.43h1.682zm.846 0c0-.924.756-1.68 1.681-1.68s1.681.756 1.681 1.68v4.21c0 .924-.756 1.68-1.68 1.68a1.685 1.685 0 0 1-1.682-1.68zM5.89 3.362c-.926 0-1.682-.756-1.682-1.681S4.964 0 5.89 0s1.68.756 1.68 1.68v1.682zm0 .846c.924 0 1.68.756 1.68 1.681S6.814 7.57 5.89 7.57H1.68C.757 7.57 0 6.814 0 5.89c0-.926.756-1.682 1.68-1.682zm6.749 1.682c0-.926.755-1.682 1.68-1.682S16 4.964 16 5.889s-.756 1.681-1.68 1.681h-1.681zm-.848 0c0 .924-.755 1.68-1.68 1.68A1.685 1.685 0 0 1 8.43 5.89V1.68C8.43.757 9.186 0 10.11 0c.926 0 1.681.756 1.681 1.68zm-1.681 6.748c.926 0 1.682.756 1.682 1.681S11.036 16 10.11 16s-1.681-.756-1.681-1.68v-1.682h1.68zm0-.847c-.924 0-1.68-.755-1.68-1.68s.756-1.681 1.68-1.681h4.21c.924 0 1.68.756 1.68 1.68 0 .926-.756 1.681-1.68 1.681z"/>
</svg>);

// Email Icon
export const EnvelopeIcon = ({ className }) => (
  <svg
    className={className || "h-5 w-5"}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// Documentation Icon
export const DocumentationIcon = ({ className }) => (
  <svg
    className={className || "h-5 w-5"}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Jira Icon
export const JiraIcon = ({ className }) => (
  <svg
    className={className || "h-5 w-5"}
    fill="currentColor"
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M29.762 1.004h-14.443c0 0 0 0 0 0 0 3.599 2.918 6.517 6.517 6.517 0 0 0 0 0 0h2.66v2.571c0.003 3.591 2.91 6.502 6.498 6.512h0.001v-14.343c0-0.002 0-0.003 0-0.005 0-0.685-0.55-1.241-1.232-1.251h-0.001zM22.616 8.198h-14.443c0.001 3.599 2.918 6.516 6.517 6.516h2.66v2.572c0.003 3.598 2.919 6.513 6.517 6.516h0v-14.352c0-0.691-0.56-1.251-1.251-1.251v0zM15.464 15.391h-14.46c0.002 3.6 2.921 6.517 6.521 6.517 0.006 0 0.012 0 0.018-0h2.661v2.57c0 0 0 0 0 0 0 3.598 2.916 6.515 6.514 6.517h0v-14.348c0-0.694-0.562-1.256-1.256-1.256v0z"></path>
  </svg>
);

// Edit Icon
export const EditIcon = ({ className }) => (
  <svg
    className={className || "h-5 w-5"}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

// Save Icon
export const SaveIcon = ({ className }) => (
  <svg
    className={className || "h-5 w-5"}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// Cancel Icon
export const CancelIcon = ({ className }) => (
  <svg
    className={className || "h-5 w-5"}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
