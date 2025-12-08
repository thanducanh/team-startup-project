// src/components/CreateTaskModal.jsx
import React, { useState } from 'react';
import '../CreateTaskModal.css'; // File CSS trang trí

const CreateTaskModal = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('Chung'); // Mặc định là thẻ Chung

  const handleSubmit = (e) => {
    e.preventDefault(); // Chặn reload trang
    if (!title.trim()) {
      alert("Vui lòng nhập tên công việc!");
      return;
    }
    onCreate(title, tag); // Gửi dữ liệu về KanbanBoard xử lý
  };

  return (
    <div className="create-modal-backdrop" onClick={onClose}>
      <div className="create-modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>✨ Thêm công việc mới</h3>
        
        <form onSubmit={handleSubmit}>
          {/* Ô nhập tên */}
          <div className="form-group">
            <label>Tên công việc</label>
            <input 
              autoFocus
              type="text" 
              placeholder="Ví dụ: Mua máy khoan bê tông..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Ô chọn Nhãn (Tag) */}
          <div className="form-group">
            <label>Phân loại (Tag)</label>
            <div className="tag-options">
              {['Chung', 'Khẩn cấp', 'Mua sắm', 'Thi công', 'Hợp đồng'].map((t) => (
                <span 
                  key={t}
                  className={`tag-chip ${tag === t ? 'selected' : ''}`}
                  onClick={() => setTag(t)}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Nút bấm */}
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Hủy bỏ</button>
            <button type="submit" className="btn-create">Tạo công việc</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;