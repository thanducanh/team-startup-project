// src/components/KanbanBoard.jsx
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FaPlus, FaEllipsisH } from 'react-icons/fa';
import { supabase } from '../supabaseClient'; 
import TaskModal from './TaskModal';
import CreateTaskModal from './CreateTaskModal';
import { toast } from 'react-toastify';
import '../Kanban.css';

// Nhận các props điều khiển state từ App.jsx
const KanbanBoard = ({ selectedTask, setSelectedTask, externalAddTrigger, resetExternalAdd }) => {
  const [data, setData] = useState({ tasks: {}, columns: {}, columnOrder: [] });
  const [loading, setLoading] = useState(true);
  
  // State mở Modal tạo công việc mới (vẫn cần state này để xác định cột)
  const [creatingColumnId, setCreatingColumnId] = useState(null);

  // --- KÍCH HOẠT TỪ HEADER/APP.JSX ---
  useEffect(() => {
    // Nếu tín hiệu bấm nút Thêm từ ProjectHeader được gửi đến
    if (externalAddTrigger) {
        setCreatingColumnId('col-1'); // Mở Modal và mặc định thêm vào cột đầu tiên
        resetExternalAdd(); // Reset tín hiệu ngay lập tức
    }
  }, [externalAddTrigger, resetExternalAdd]);

  // --- TẢI DỮ LIỆU TỪ SUPABASE ---
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data: tasksFromDB, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const newTasks = {};
      const newColumns = {
        'col-1': { id: 'col-1', title: 'Việc cần làm', borderTop: '#ff5c5c', taskIds: [] },
        'col-2': { id: 'col-2', title: 'Đang thực hiện', borderTop: '#3b82f6', taskIds: [] },
        'col-3': { id: 'col-3', title: 'Đã hoàn thành', borderTop: '#10b981', taskIds: [] },
      };

      if (tasksFromDB) {
        tasksFromDB.forEach((task) => {
          const idString = task.id.toString();
          newTasks[idString] = { ...task, id: idString };
          
          let status = task.status;
          if (!newColumns[status]) status = 'col-1';
          
          newColumns[status].taskIds.push(idString);
        });
      }

      setData({
        tasks: newTasks,
        columns: newColumns,
        columnOrder: ['col-1', 'col-2', 'col-3'],
      });
    } catch (err) {
      console.error(err);
      toast.error("Lỗi tải dữ liệu: Vui lòng kiểm tra RLS!");
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM THÊM CÔNG VIỆC MỚI (+ THÔNG BÁO) ---
  const handleAddTask = async (title, tag) => {
    if (!creatingColumnId) return;

    try {
      // 1. Tạo Task (select() để lấy lại ID)
      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert([{ title: title, status: creatingColumnId, tag: tag }])
        .select(); 

      if (error) throw error;
      
      // 2. TẠO THÔNG BÁO (NOTIFICATION)
      if (newTask && newTask.length > 0) {
          await supabase.from('notifications').insert([{
              content: `<strong>Admin</strong> vừa tạo công việc mới: "${title}"`,
              task_id: newTask[0].id
          }]);
      }

      setCreatingColumnId(null);
      fetchTasks();
      toast.success("✨ Đã thêm công việc mới thành công!");

    } catch (error) {
      toast.error("Lỗi khi thêm: " + error.message);
    }
  };

  // --- HÀM CẬP NHẬT CÔNG VIỆC ---
  const handleUpdateTask = async (taskId, updates) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      fetchTasks(); // Tải lại bảng
      setSelectedTask(prev => ({ ...prev, ...updates })); // Cập nhật Modal
    } catch (error) {
      toast.error("Lỗi cập nhật: " + error.message);
    }
  };

  // --- HÀM XÓA CÔNG VIỆC ---
  const handleDeleteTask = async (taskId) => {
    try {
      // 1. Xóa tất cả thông báo liên quan trước
      await supabase.from('notifications').delete().eq('task_id', taskId);

      // 2. Xóa công việc
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) throw error;

      setSelectedTask(null); // Đóng Modal chi tiết
      fetchTasks(); // Tải lại bảng
      
      toast.success("🗑️ Đã xóa công việc khỏi dự án!");

    } catch (error) {
      toast.error("Lỗi xóa: " + error.message);
    }
  };

  // --- XỬ LÝ KÉO THẢ ---
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    // Cập nhật giao diện ngay lập tức
    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      const newColumn = { ...startColumn, taskIds: newTaskIds };
      setData({ ...data, columns: { ...data.columns, [newColumn.id]: newColumn } });
    } else {
      const startTaskIds = Array.from(startColumn.taskIds);
      startTaskIds.splice(source.index, 1);
      const newStart = { ...startColumn, taskIds: startTaskIds };

      const finishTaskIds = Array.from(finishColumn.taskIds);
      finishTaskIds.splice(destination.index, 0, draggableId);
      const newFinish = { ...finishColumn, taskIds: finishTaskIds };
      setData({ ...data, columns: { ...data.columns, [newStart.id]: newStart, [newFinish.id]: newFinish } });
      
      // Lưu trạng thái cột mới lên Server
      await supabase.from('tasks').update({ status: destination.droppableId }).eq('id', draggableId);
    }
  };

  if (loading) return <div style={{padding: 20}}>⏳ Đang đồng bộ dữ liệu...</div>;

  return (
    <div className="kanban-container">
      <div className="board-header">
        {/* Thanh này đã được chuyển lên ProjectHeader */}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-columns">
          {data.columnOrder.map((columnId) => {
            const column = data.columns[columnId];
            const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

            return (
              <div key={column.id} className="kanban-column">
                <div className="column-header" style={{ borderTop: `3px solid ${column.borderTop}` }}>
                  <span>{column.title} <span className="task-count">{tasks.length}</span></span>
                  <FaEllipsisH className="icon-more" />
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      className="column-body"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{ backgroundColor: snapshot.isDraggingOver ? '#e2e8f0' : 'transparent', minHeight: '100px' }}
                    >
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              className="task-card"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              // Sử dụng setSelectedTask từ props để mở Modal
                              onClick={() => setSelectedTask(task)} 
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.8 : 1,
                              }}
                            >
                              <div className="task-title">{task.title}</div>
                              <div className="task-tag">{task.tag || 'Chung'}</div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Nút mở Modal thêm mới */}
                <div className="add-task-btn" onClick={() => setCreatingColumnId(column.id)}>
                  <FaPlus size={12} /> Thêm công việc
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* MODAL CHI TIẾT CÔNG VIỆC */}
      {selectedTask && (
        <TaskModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onUpdate={handleUpdateTask} 
          onDelete={handleDeleteTask}
        />
      )}

      {/* MODAL TẠO CÔNG VIỆC MỚI */}
      {creatingColumnId && (
        <CreateTaskModal 
          onClose={() => setCreatingColumnId(null)} 
          onCreate={handleAddTask} 
        />
      )}
    </div>
  );
};

export default KanbanBoard;