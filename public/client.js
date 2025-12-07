const socket = io();
let myUser = null;
let currentConversationId = null;

// --- 1. AUTH (ĐĂNG NHẬP / ĐĂNG KÝ) ---
function switchForm(id) {
    document.getElementById('form-login').classList.add('hidden');
    document.getElementById('form-register').classList.add('hidden');
    document.getElementById('form-'+id).classList.remove('hidden');
}

async function handleLogin() {
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPass').value;
    const btn = document.querySelector('#form-login button');
    
    // Hiệu ứng loading
    const oldText = btn.innerText;
    btn.innerText = "Đang vào..."; 
    btn.disabled = true;

    try {
        const res = await fetch('/api/login', {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({phone, password})
        });
        const data = await res.json();

        if (res.ok) {
            myUser = data;
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            document.getElementById('nav-user-avatar').src = `https://ui-avatars.com/api/?name=${myUser.name}&background=random`;
            
            // Mặc định load danh sách User
            loadUserList();
        } else { alert(data.error); }
    } catch (e) { alert("Lỗi kết nối server!"); } 
    finally { btn.innerText = oldText; btn.disabled = false; }
}

async function handleRegister() {
    const name = document.getElementById('regName').value;
    const phone = document.getElementById('regPhone').value;
    const password = document.getElementById('regPass').value;
    const res = await fetch('/api/register', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name, phone, password})
    });
    if(res.ok) { alert("Đăng ký thành công!"); switchForm('login'); } else { alert("Lỗi đăng ký"); }
}

function handleLogout() { location.reload(); }

// --- 2. LOGIC CHUYỂN TAB (CHAT / FEED) ---
function switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}-btn`).classList.add('active');

    if (tabName === 'chat') {
        document.getElementById('view-chat').classList.remove('hidden');
        document.getElementById('view-chat').style.display = 'flex';
        document.getElementById('view-feed').classList.add('hidden');
        loadUserList(); 
    } else {
        document.getElementById('view-chat').classList.add('hidden');
        document.getElementById('view-chat').style.display = 'none';
        document.getElementById('view-feed').classList.remove('hidden');
        loadNewsfeed();
    }
}

// --- 3. LOGIC CHAT (DANH BẠ & NHẮN TIN) ---
async function loadUserList() {
    const list = document.getElementById('conversation-list');
    list.innerHTML = '<div style="padding:10px; color:#999; text-align:center">Đang tải danh bạ...</div>';

    try {
        const res = await fetch(`/api/users?current_user_id=${myUser.id}`);
        const users = await res.json();
        
        list.innerHTML = ''; 
        if(users.length === 0) {
            list.innerHTML = '<div style="padding:10px; text-align:center">Chưa có ai khác :(</div>';
            return;
        }

        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'conv-item';
            div.onclick = () => startChat(user.id, user.name, div);
            div.innerHTML = `
                <img src="https://ui-avatars.com/api/?name=${user.name}&background=random">
                <div class="conv-info">
                    <h4>${user.name} ${user.role==='admin'?'<span style="color:red;font-size:10px">(QTV)</span>':''}</h4>
                    <p style="color:#0068ff">Bấm để nhắn tin</p>
                </div>
            `;
            list.appendChild(div);
        });
    } catch(e) { console.error(e); }
}

async function startChat(partnerId, partnerName, element) {
    document.querySelectorAll('.conv-item').forEach(e => e.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('chat-title').innerText = partnerName;
    document.getElementById('input-area').classList.remove('hidden');
    document.getElementById('main-app').classList.add('mobile-chat-active');
    document.getElementById('message-list').innerHTML = '<div style="text-align:center; padding:20px; color:#888">Đang tải tin nhắn...</div>';

    try {
        const res = await fetch('/api/conversation/start', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user1_id: myUser.id, user2_id: partnerId })
        });
        const data = await res.json();
        currentConversationId = data.conversation_id;
        
        socket.emit('join_room', currentConversationId);
        
        const msgRes = await fetch(`/api/messages/${currentConversationId}`);
        const msgs = await msgRes.json();
        const list = document.getElementById('message-list');
        list.innerHTML = '';
        msgs.forEach(msg => appendMessage(msg));

    } catch(e) { alert("Lỗi tạo phòng chat: " + e.message); }
}

function closeChatMobile() { document.getElementById('main-app').classList.remove('mobile-chat-active'); }

function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value;
    if(!content || !currentConversationId) return; // Không gửi tin rỗng
    
    socket.emit('send_message', { conversation_id: currentConversationId, sender_id: myUser.id, content });
    input.value = ''; // Xóa ô nhập sau khi gửi
    input.focus();    // Giữ chuột ở ô nhập để chat tiếp
}

function appendMessage(msg) {
    const list = document.getElementById('message-list');
    const div = document.createElement('div');
    div.className = `msg ${msg.sender_id === myUser.id ? 'msg-sent' : 'msg-received'}`;
    div.innerText = msg.content;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
}

socket.on('receive_message', (msg) => {
    if(msg.conversation_id === currentConversationId) appendMessage(msg);
});

// --- 4. LOGIC NEWSFEED ---
async function loadNewsfeed() {
    if (myUser.role === 'admin') document.getElementById('btn-create-post').classList.remove('hidden');
    else document.getElementById('btn-create-post').classList.add('hidden');

    const res = await fetch('/api/posts');
    const posts = await res.json();
    const list = document.getElementById('feed-list');
    list.innerHTML = '';
    posts.forEach(post => {
        const div = document.createElement('div');
        div.className = 'feed-item';
        div.innerHTML = `
            <div class="feed-author">
                <img src="https://ui-avatars.com/api/?name=${post.author_name}" class="avatar">
                <div>${post.author_name} <span style="font-size:12px; color:#888">${new Date(post.created_at).toLocaleString()}</span></div>
            </div>
            <div class="feed-content">${post.content}</div>
            ${post.image_url ? `<img src="${post.image_url}" class="feed-img">` : ''}
        `;
        list.appendChild(div);
    });
}
function togglePostForm() { document.getElementById('post-form').classList.toggle('hidden'); }
async function handlePostNews() {
    const content = document.getElementById('postContent').value;
    const image_url = document.getElementById('postImage').value;
    if (!content) return;
    const res = await fetch('/api/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_id: myUser.id, content, image_url })
    });
    if (res.ok) { document.getElementById('postContent').value=''; togglePostForm(); loadNewsfeed(); }
}

// ==========================================================
// [MỚI] BẮT SỰ KIỆN PHÍM ENTER ĐỂ GỬI TIN NHẮN
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('messageInput');
    
    // Khi người dùng nhấn phím xuống
    input.addEventListener("keypress", function(event) {
        // Nếu phím đó là Enter
        if (event.key === "Enter") {
            event.preventDefault(); // Chặn xuống dòng
            sendMessage(); // Gọi hàm gửi tin
        }
    });
});