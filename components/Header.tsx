import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-800 p-4 shadow-md border-b border-slate-700">
      <div className="container mx-auto flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <img src="https://digibeat.com/wp-content/uploads/2022/06/logo-white-300x80.png" alt="Logo" className="h-12" />
          <h1 className="text-xl md:text-3xl font-bold text-blue-400 tracking-wide">
            Drops & Wins Update Tool
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
