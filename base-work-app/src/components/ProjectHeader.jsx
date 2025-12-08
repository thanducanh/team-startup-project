// src/components/ProjectHeader.jsx
import React from 'react';
import { FaList, FaThLarge, FaTable, FaUserFriends, FaFilter, FaSortAmountDown, FaEllipsisH, FaPlus } from 'react-icons/fa';
import '../ProjectHeader.css';

const ProjectHeader = ({ onAddClick }) => {
  return (
    <div className="project-header-container">
      {/* Dòng 1: Tên dự án và các Tab chính */}
      <div className="ph-top">
        <div className="ph-title">
          <h2>🚧 Lắp đặt hệ thống điện Quận 1</h2>
          <span className="ph-status">Running</span>
        </div>
        
        <div className="ph-tabs">
          <div className="ph-tab"><FaTable /> Table</div>
          <div className="ph-tab"><FaList /> List</div>
          <div className="ph-tab active"><FaThLarge /> Board</div>
          <div className="ph-tab"><FaUserFriends /> Member</div>
        </div>
      </div>

      {/* Dòng 2: Bộ lọc và Nút Thêm */}
      <div className="ph-toolbar">
        <div className="ph-filters">
          <div className="ph-filter-btn"><FaFilter /> Lọc theo: Tất cả</div>
          <div className="ph-filter-btn"><FaSortAmountDown /> Sắp xếp</div>
          <div className="ph-member-stack">
            <div className="avatar-circle" style={{background: '#e91e63'}}>A</div>
            <div className="avatar-circle" style={{background: '#2196f3'}}>B</div>
            <div className="add-member-circle"><FaPlus /></div>
          </div>
        </div>

        <div className="ph-actions">
          {/* Nút Thêm Xanh Lá Đặc Trưng */}
          <button className="btn-base-add" onClick={onAddClick}>
            <FaPlus /> Thêm công việc
          </button>
          <div className="ph-more-btn"><FaEllipsisH /></div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;