// src/components/DeleteModal.jsx
import React from 'react';
import '../DeleteModal.css'; // File CSS

const DeleteModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-backdrop" onClick={onClose}>
      <div className="delete-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="warning-icon">⚠️</div>
        <h3>Xác nhận xóa?</h3>
        <p>Bạn có chắc chắn muốn xóa vĩnh viễn công việc này không?<br/>Hành động này <b>không thể hoàn tác</b>.</p>
        
        <div className="delete-actions">
          <button className="btn-cancel" onClick={onClose}>Hủy bỏ</button>
          <button className="btn-confirm-delete" onClick={onConfirm}>Xóa ngay</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;