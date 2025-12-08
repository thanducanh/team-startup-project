import React from 'react';
import '../Dashboard.css'; // Chúng ta sẽ tạo file này ngay sau đây

const Dashboard = () => {
  // Dữ liệu giả lập các dự án của bạn (Sau này sẽ lấy từ Supabase)
  const projects = [
    { id: 1, name: "Lắp đặt Nhà Máy A", status: "Đang chạy", progress: 30 },
    { id: 2, name: "Bảo trì Hệ thống B", status: "Chờ vật tư", progress: 10 },
    { id: 3, name: "Sửa chữa tại Singapore", status: "Hoàn thành", progress: 100 },
  ];

  return (
    <div className="dashboard-container">
      <h2>Danh sách công việc & Dự án</h2>
      
      <div className="project-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <h3>{project.name}</h3>
            <p>Trạng thái: <span className={`status ${project.status === 'Đang chạy' ? 'active' : ''}`}>{project.status}</span></p>
            
            {/* Thanh tiến độ */}
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
            </div>
            <p className="progress-text">{project.progress}% hoàn thành</p>
          </div>
        ))}
        
        {/* Nút tạo dự án mới */}
        <div className="project-card create-new">
          <h3>+ Tạo dự án mới</h3>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;