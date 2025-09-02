import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-md';
      case 'card':
        return 'rounded-2xl';
      case 'text':
      default:
        return 'rounded';
    }
  };

  const getDefaultSize = () => {
    switch (variant) {
      case 'circular':
        return { width: '40px', height: '40px' };
      case 'card':
        return { width: '100%', height: '200px' };
      case 'text':
        return { width: '100%', height: '1rem' };
      case 'rectangular':
      default:
        return { width: '100%', height: '2rem' };
    }
  };

  const defaultSize = getDefaultSize();
  const style = {
    width: width || defaultSize.width,
    height: height || defaultSize.height,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} ${className}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width, // Last line shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={style}
    />
  );
};

// Artist Card Skeleton Component
export const ArtistCardSkeleton: React.FC = () => {
  return (
    <div className="group relative bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 animate-pulse">
      {/* Artist Image */}
      <div className="flex items-center justify-center mb-4">
        <Skeleton variant="circular" width={80} height={80} />
      </div>
      
      {/* Artist Name */}
      <div className="text-center mb-2">
        <Skeleton variant="text" width="60%" height="1.25rem" className="mx-auto" />
      </div>
      
      {/* Followers Count */}
      <div className="text-center mb-4">
        <Skeleton variant="text" width="40%" height="0.875rem" className="mx-auto" />
      </div>
      
      {/* Genres */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
        <Skeleton variant="rectangular" width={45} height={24} className="rounded-full" />
      </div>
      
      {/* Follow Button */}
      <Skeleton variant="rectangular" width="100%" height={40} className="rounded-xl" />
    </div>
  );
};

// Dashboard Stats Skeleton
export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <Skeleton variant="text" width={60} height="1rem" />
      </div>
      <Skeleton variant="text" width="80%" height="2rem" className="mb-2" />
      <Skeleton variant="text" width="50%" height="0.875rem" />
    </div>
  );
};

// List Item Skeleton
export const ListItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 animate-pulse">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" height="1rem" />
        <Skeleton variant="text" width="40%" height="0.875rem" />
      </div>
      <Skeleton variant="rectangular" width={80} height={32} className="rounded-lg" />
    </div>
  );
};

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4">
          <Skeleton variant="text" width="80%" height="1rem" />
        </td>
      ))}
    </tr>
  );
};

export default Skeleton;
