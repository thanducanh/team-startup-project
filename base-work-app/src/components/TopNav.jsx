// src/components/TopNav.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaBell, FaQuestionCircle, FaCheckDouble } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import '../TopNav.css';

const TopNav = ({ onOpenTask }) => {
  const [showNoti, setShowNoti] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const notiRef = useRef(null);

  // 1. Hàm tải thông báo (Dùng chung cho lúc đầu và lúc Reset)
  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    // Tải dữ liệu lần đầu
    fetchNotifications();
    
    // --- LẮNG NGHE REALTIME ---
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        
        // A. CÓ THÔNG BÁO MỚI (INSERT)
        if (payload.eventType === 'INSERT') {
          setUnreadCount(prev => prev + 1);
          setNotifications(prev => [payload.new, ...prev]);
          toast.info("🔔 Có thông báo mới!");
        } 
        
        // B. CÓ THÔNG BÁO BỊ XÓA (DELETE)
        else if (payload.eventType === 'DELETE') {
          // Lọc bỏ thông báo vừa bị xóa khỏi danh sách hiện tại
          setNotifications(currentList => {
            const newList = currentList.filter(n => n.id !== payload.old.id);
            // Tính lại số tin chưa đọc
            setUnreadCount(newList.filter(n => !n.is_read).length);
            return newList;
          });
        }
      })
      .subscribe();

    // Click outside
    const handleClickOutside = (event) => {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setShowNoti(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      supabase.removeChannel(subscription);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotiClick = async (noti) => {
    setShowNoti(false); 

    // Đánh dấu đã đọc
    if (!noti.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, is_read: true } : n));
      await supabase.from('notifications').update({ is_read: true }).eq('id', noti.id);
    }

    // Mở Task
    if (noti.task_id) {
      const { data: task } = await supabase.from('tasks').select('*').eq('id', noti.task_id).single();
      if (task) {
        onOpenTask(task);
      } else {
        // Nếu task không còn (đã xóa), tự động xóa thông báo rác này đi luôn
        setNotifications(prev => prev.filter(n => n.id !== noti.id));
        await supabase.from('notifications').delete().eq('id', noti.id);
        toast.error("Công việc này không còn tồn tại (Đã xóa thông báo rác)");
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    toast.success("Đã đánh dấu tất cả là đã đọc");
  };

  return (
    <div className="top-nav">
      <div className="nav-left">
        <span className="app-name">Base Work+</span>
        <span className="divider">/</span>
        <span className="current-page">Dự án Quận 1</span>
      </div>

      <div className="nav-center">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Tìm kiếm công việc, dự án..." />
        </div>
      </div>

      <div className="nav-right">
        <div className="nav-icon" ref={notiRef}>
          <div onClick={() => setShowNoti(!showNoti)}>
             <FaBell />
             {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </div>
          
          {showNoti && (
            <div className="noti-dropdown">
              <div className="noti-header">
                <span>Thông báo</span>
                {unreadCount > 0 && (
                  <span className="mark-all-read" onClick={handleMarkAllRead}>
                    <FaCheckDouble /> Đã đọc hết
                  </span>
                )}
              </div>
              
              <div className="noti-list-scroll">
                {notifications.length === 0 ? (
                    <div style={{padding:20, textAlign:'center', color:'#999'}}>Không có thông báo nào</div>
                ) : (
                    notifications.map(noti => (
                        <div 
                          key={noti.id} 
                          className={`noti-item ${!noti.is_read ? 'unread' : ''}`} 
                          onClick={() => handleNotiClick(noti)}
                        >
                            <div dangerouslySetInnerHTML={{__html: noti.content}}></div>
                            <span className="time">{new Date(noti.created_at).toLocaleString()}</span>
                        </div>
                    ))
                )}
              </div>

              <div className="noti-footer">Xem tất cả</div>
            </div>
          )}
        </div>
        <div className="nav-icon"><FaQuestionCircle /></div>
      </div>
    </div>
  );
};

export default TopNav;