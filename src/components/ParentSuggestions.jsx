import React from 'react';

const ParentSuggestions = ({ suggestions, show, onSelect }) => {
  if (!show || suggestions.length === 0) return null;

  return (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
          onClick={() => onSelect(suggestion)}
        >
          <div className="font-medium text-gray-900">{suggestion.displayName}</div>
          <div className="text-sm text-gray-500">{suggestion.identifier || 'no-id'}</div>
        </div>
      ))}
    </div>
  );
};

export default ParentSuggestions;