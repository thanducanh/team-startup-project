// src/components/TaskModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaUserCircle, FaPaperclip, FaCheckSquare, FaTrash, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import DeleteModal from './DeleteModal'; 
import '../TaskModal.css';

const TaskModal = ({ task, onClose, onUpdate, onDelete }) => {
  const [description, setDescription] = useState(task.description || '');
  const [title, setTitle] = useState(task.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  // <--- 2. State để bật tắt bảng hỏi xóa
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setDescription(task.description || '');
    setTitle(task.title || '');
  }, [task]);

  const handleSaveDescription = () => {
    onUpdate(task.id, { description: description });
    toast.success("💾 Đã lưu mô tả thành công!", { position: "bottom-right" });
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== task.title) {
      onUpdate(task.id, { title: title });
      toast.info("✏️ Đã cập nhật tên công việc!");
    }
  };

  // <--- 3. Hàm xóa thật (Sẽ được gọi khi bấm nút đỏ trong DeleteModal)
  const confirmDelete = () => {
    setShowDeleteConfirm(false); // Tắt bảng hỏi
    onDelete(task.id); // Gọi hàm xóa của cha
    // Toast thông báo sẽ do KanbanBoard xử lý
  };

  if (!task) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="task-meta-id">#{task.id} - {task.tag}</div>
            <button className="btn-close" onClick={onClose}><FaTimes /></button>
          </div>

          <div className="modal-body">
            <div className="modal-left">
              {isEditingTitle ? (
                <input 
                  className="title-input-edit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                  autoFocus
                />
              ) : (
                <h2 className="task-title-edit" onClick={() => setIsEditingTitle(true)}>{title}</h2>
              )}
              
              <div className="section">
                <h3><FaPaperclip /> Mô tả chi tiết</h3>
                <textarea 
                  className="desc-input" 
                  rows="5" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập mô tả..."
                ></textarea>
                <div style={{marginTop: 10}}>
                  <button className="btn-save-desc" onClick={handleSaveDescription}>
                    <FaSave /> Lưu mô tả
                  </button>
                </div>
              </div>

              {/* <--- 4. NÚT XÓA (Chỉ bật state, không xóa ngay) */}
              <button className="btn-delete" onClick={() => setShowDeleteConfirm(true)}>
                  <FaTrash /> Xóa công việc này
              </button>
            </div>

            <div className="modal-right">
              <div className="discussion-header">Thảo luận</div>
              <div className="discussion-list">
                <div className="discussion-item">
                    <FaUserCircle className="avatar-small"/>
                    <div className="msg-content">
                        <strong>Hệ thống</strong>
                        <p>Tạo lúc: {new Date(task.created_at).toLocaleString()}</p>
                    </div>
                </div>
              </div>
              <div className="discussion-input-area">
                <input type="text" placeholder="Nhập bình luận..." />
                <button>Gửi</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <--- 5. HIỂN THỊ MODAL XÓA ĐÈ LÊN TRÊN */}
      <DeleteModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default TaskModal;