import React, { useState } from "react";

const ModelSelectionDialog = ({ isOpen, onClose, onSelectModel, models }) => {
  const [selectedModelIndex, setSelectedModelIndex] = useState(null);

  if (!isOpen) return null;

  const handleModelSelect = (model, index) => {
    setSelectedModelIndex(index);
    onSelectModel(model);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-white p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Select a 3D Model</h2>
        <div className="grid grid-cols-3 gap-4">
          {models.map((model, index) => (
            <div
              key={model.name}
              className={`cursor-pointer hover:bg-gray-100 p-2 rounded ${selectedModelIndex === index ? 'border-2 border-blue-500' : ''}`}
              onClick={() => handleModelSelect(model, index)}
            >
              <img src={model.thumbnail} alt={model.name} className="w-full h-32 object-cover" />
              <p className="text-center mt-2">{model.name}</p>
            </div>
          ))}
        </div>
        <button
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ModelSelectionDialog;