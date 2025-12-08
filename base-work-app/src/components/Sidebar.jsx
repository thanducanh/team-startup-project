// src/components/Sidebar.jsx
import React from 'react';
import { FaHome, FaTasks, FaProjectDiagram, FaUsers, FaCog, FaStar } from 'react-icons/fa';
import '../Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      {/* 1. Logo / User Area */}
      <div className="sidebar-header">
        <div className="user-avatar-placeholder">GRS</div>
      </div>

      {/* 2. Menu Chính */}
      <div className="sidebar-menu">
        <div className="menu-group">
          <div className="menu-label">CÁ NHÂN</div>
          <div className="menu-item active"><FaHome /> Dashboard</div>
          <div className="menu-item"><FaTasks /> Việc của tôi <span className="badge-count">5</span></div>
          <div className="menu-item"><FaStar /> Đang theo dõi</div>
        </div>

        <div className="menu-group">
          <div className="menu-label">DỰ ÁN & PHÒNG BAN</div>
          <div className="menu-item"><FaProjectDiagram /> Lắp đặt Quận 1</div>
          <div className="menu-item"><FaProjectDiagram /> Bảo trì Nhà máy B</div>
          <div className="menu-item"><FaUsers /> Phòng Kỹ thuật</div>
        </div>

        <div className="menu-group">
          <div className="menu-label">HỆ THỐNG</div>
          <div className="menu-item"><FaUsers /> Thành viên</div>
          <div className="menu-item"><FaCog /> Cài đặt</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;