import React from 'react';

const ThemeTest: React.FC = () => {
  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow-lg rounded-xl">
      <h2 className="text-3xl font-bold mb-6 text-primary-600">Theme Test</h2>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-medium mb-4 text-gray-800 border-b pb-2">Primary Colors</h3>
          <div className="flex flex-wrap gap-2">
            <div className="w-20 h-20 bg-primary-50 flex items-center justify-center border rounded shadow-sm">50</div>
            <div className="w-20 h-20 bg-primary-100 flex items-center justify-center border rounded shadow-sm">100</div>
            <div className="w-20 h-20 bg-primary-200 flex items-center justify-center border rounded shadow-sm">200</div>
            <div className="w-20 h-20 bg-primary-300 flex items-center justify-center border rounded shadow-sm">300</div>
            <div className="w-20 h-20 bg-primary-400 flex items-center justify-center border rounded shadow-sm">400</div>
            <div className="w-20 h-20 bg-primary-500 flex items-center justify-center border rounded shadow-sm text-white">500</div>
            <div className="w-20 h-20 bg-primary-600 flex items-center justify-center border rounded shadow-sm text-white">600</div>
            <div className="w-20 h-20 bg-primary-700 flex items-center justify-center border rounded shadow-sm text-white">700</div>
            <div className="w-20 h-20 bg-primary-800 flex items-center justify-center border rounded shadow-sm text-white">800</div>
            <div className="w-20 h-20 bg-primary-900 flex items-center justify-center border rounded shadow-sm text-white">900</div>
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-medium mb-4 text-gray-800 border-b pb-2">Secondary Colors</h3>
          <div className="flex flex-wrap gap-2">
            <div className="w-20 h-20 bg-secondary-50 flex items-center justify-center border rounded shadow-sm">50</div>
            <div className="w-20 h-20 bg-secondary-100 flex items-center justify-center border rounded shadow-sm">100</div>
            <div className="w-20 h-20 bg-secondary-200 flex items-center justify-center border rounded shadow-sm">200</div>
            <div className="w-20 h-20 bg-secondary-300 flex items-center justify-center border rounded shadow-sm">300</div>
            <div className="w-20 h-20 bg-secondary-400 flex items-center justify-center border rounded shadow-sm">400</div>
            <div className="w-20 h-20 bg-secondary-500 flex items-center justify-center border rounded shadow-sm text-white">500</div>
            <div className="w-20 h-20 bg-secondary-600 flex items-center justify-center border rounded shadow-sm text-white">600</div>
            <div className="w-20 h-20 bg-secondary-700 flex items-center justify-center border rounded shadow-sm text-white">700</div>
            <div className="w-20 h-20 bg-secondary-800 flex items-center justify-center border rounded shadow-sm text-white">800</div>
            <div className="w-20 h-20 bg-secondary-900 flex items-center justify-center border rounded shadow-sm text-white">900</div>
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-medium mb-4 text-gray-800 border-b pb-2">Text Colors</h3>
          <div className="space-y-2">
            <p className="text-primary-600 font-medium">This text is primary-600</p>
            <p className="text-secondary-600 font-medium">This text is secondary-600</p>
            <p className="text-gray-700 font-medium">This text is gray-700</p>
            <p className="text-error-600 font-medium">This text is error-600</p>
            <p className="text-warning-600 font-medium">This text is warning-600</p>
            <p className="text-success-600 font-medium">This text is success-600</p>
            <p className="text-info-600 font-medium">This text is info-600</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-medium mb-4 text-gray-800 border-b pb-2">UI Elements</h3>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 shadow-sm">
                Primary Button
              </button>
              <button className="px-4 py-2 bg-secondary-600 text-white rounded hover:bg-secondary-700 shadow-sm">
                Secondary Button
              </button>
              <button className="px-4 py-2 bg-error-600 text-white rounded hover:bg-error-700 shadow-sm">
                Error Button
              </button>
            </div>
            
            <div className="p-4 bg-primary-50 text-primary-800 rounded-lg border border-primary-200">
              This is an info alert box with primary colors
            </div>
            
            <div className="p-4 bg-error-50 text-error-700 rounded-lg border border-error-200">
              This is an error alert box
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeTest;
