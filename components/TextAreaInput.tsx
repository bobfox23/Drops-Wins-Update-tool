
import React from 'react';

interface TextAreaInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  rows?: number;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({ id, label, value, onChange, placeholder, rows = 6 }) => {
  return (
    <div>
      <label htmlFor={id} className="block mb-2 text-md font-medium text-gray-300">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        className="block p-3 w-full text-sm text-gray-200 bg-slate-700 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-inner"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default TextAreaInput;
