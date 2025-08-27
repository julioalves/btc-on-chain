
import React from 'react';

export const USAFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 15" {...props}>
    <path fill="#fff" d="M0 0h25v15H0z" />
    <path
      fill="#b22234"
      d="M0 0h25v2H0zm0 4h25v2H0zm0 4h25v2H0zm0 4h25v2H0z"
    />
    <path fill="#3c3b6e" d="M0 0h12v8H0z" />
  </svg>
);
