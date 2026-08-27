import React from 'react';

export const SkeletonLoader = ({ height = '20px', width = '100%', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton"
          style={{ height, width, marginBottom: count > 1 ? '0.75rem' : 0 }}
        />
      ))}
    </>
  );
};
