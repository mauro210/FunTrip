import React from "react";

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  message,
  onConfirm,
  onCancel,
  isOpen,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-buttons">
          <button onClick={onConfirm} className="navbar-button">
            Confirm
          </button>
          <button onClick={onCancel} className="navbar-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
