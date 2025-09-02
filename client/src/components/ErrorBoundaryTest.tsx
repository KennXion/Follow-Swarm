import { useState } from 'react';

const ErrorBoundaryTest = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary - this is intentional!');
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Error Boundary Test
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Click the button below to trigger an error and test the ErrorBoundary component.
      </p>
      <button
        onClick={() => setShouldThrow(true)}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
      >
        Trigger Error
      </button>
    </div>
  );
};

export default ErrorBoundaryTest;
