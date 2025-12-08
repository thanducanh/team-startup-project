// src/App.jsx
import React, { useState } from 'react';
import Sidebar from './components/Sidebar'; // Sidebar mới
import TopNav from './components/TopNav';
import ProjectHeader from './components/ProjectHeader'; // Header mới
import KanbanBoard from './components/KanbanBoard';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [globalSelectedTask, setGlobalSelectedTask] = useState(null);
  
  // State giả lập để kích hoạt Modal thêm mới từ ProjectHeader
  // (Chúng ta sẽ truyền hàm này xuống ProjectHeader)
  const [isAddingNew, setIsAddingNew] = useState(false);

  return (
    <div className="app-container">
      {/* 1. Sidebar bên trái (Rộng 240px) */}
      <Sidebar />

      {/* 2. Nội dung bên phải */}
      <div className="main-content">
        <TopNav onOpenTask={setGlobalSelectedTask} />
        
        {/* Thanh công cụ dự án (Khung Base Work+) */}
        <ProjectHeader onAddClick={() => setIsAddingNew(true)} />
        
        <div className="board-area">
          <KanbanBoard 
            selectedTask={globalSelectedTask} 
            setSelectedTask={setGlobalSelectedTask}
            externalAddTrigger={isAddingNew} // Truyền tín hiệu mở modal thêm
            resetExternalAdd={() => setIsAddingNew(false)} // Reset tín hiệu
          />
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </div>
  );
}

export default App;