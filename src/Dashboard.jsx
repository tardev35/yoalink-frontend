/* frontend/src/Dashboard.jsx */
import { useState, useEffect } from 'react';
import axiosInstance from 'axios'; 
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('links'); 
  const [adminSubTab, setAdminSubTab] = useState('users'); // users, domains, tags
  
  const [links, setLinks] = useState([]); 
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [domains, setDomains] = useState([]);
  
  // States สำหรับ Admin
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminDomains, setAdminDomains] = useState([]);
  const [adminTags, setAdminTags] = useState([]);

  const [originalUrl, setOriginalUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    if (activeTab === 'links') fetchLinks();
    else if (activeTab === 'domains') fetchDomains();
    else if (activeTab === 'admin') {
      if (adminSubTab === 'users') fetchAdminUsers();
      if (adminSubTab === 'domains') fetchAdminDomains();
      if (adminSubTab === 'tags') fetchAdminTags();
    }
  }, [activeTab, adminSubTab, search, selectedTag, currentPage]);

  const fetchLinks = async () => {
    try {
      const res = await axiosInstance.get(`/api/links?page=${currentPage}&limit=20&search=${search}&tag=${selectedTag}`, axiosConfig);
      setLinks(res.data.links || []); setTotalPages(res.data.totalPages || 1);
    } catch (err) {}
  };

  const fetchDomains = async () => {
    try {
      const res = await axiosInstance.get('/api/domains', axiosConfig);
      setDomains(res.data || []);
    } catch (err) {}
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/links', { originalUrl, alias, tags: tagsInput }, axiosConfig);
      Swal.fire({ icon: 'success', title: 'สร้างลิงก์สำเร็จ!', background: '#181E29', color: '#C9CED6', showConfirmButton: false, timer: 1500 });
      setOriginalUrl(''); setAlias(''); setTagsInput(''); setCurrentPage(1); fetchLinks();
    } catch (err) { Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.response?.data?.message, background: '#181E29', color: '#C9CED6' }); }
  };

  const handleCopy = (alias) => {
    const fullLink = `https://yoalink.com/${alias}`;
    navigator.clipboard.writeText(fullLink);
    Swal.fire({ icon: 'success', title: 'คัดลอกลิงก์แล้ว!', text: fullLink, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#181E29', color: '#C9CED6' });
  };

  const handleDeleteLink = (id) => {
    Swal.fire({ title: 'ลบลิงก์นี้?', background: '#181E29', color: '#C9CED6', showCancelButton: true, confirmButtonColor: '#EB568E' })
      .then(async (res) => {
        if (res.isConfirmed) { await axiosInstance.delete(`/api/links/${id}`, axiosConfig); fetchLinks(); }
      });
  };

  // ================= ADMIN FUNCTIONS =================
  const fetchAdminUsers = async () => {
    try { const res = await axiosInstance.get('/api/admin/users', axiosConfig); setAdminUsers(res.data); } catch (err) { setActiveTab('links'); }
  };
  const fetchAdminDomains = async () => {
    try { const res = await axiosInstance.get('/api/admin/domains', axiosConfig); setAdminDomains(res.data); } catch (err) {}
  };
  const fetchAdminTags = async () => {
    try { const res = await axiosInstance.get('/api/admin/tags', axiosConfig); setAdminTags(res.data); } catch (err) {}
  };

  const handleAdminToggleRole = (id, role) => {
    const newRole = role === 'admin' ? 'user' : 'admin';
    Swal.fire({ title: `เปลี่ยนสิทธิ์เป็น ${newRole}?`, background: '#181E29', color: '#C9CED6', showCancelButton: true })
      .then(async (res) => { if (res.isConfirmed) { await axiosInstance.put(`/api/admin/users/${id}/role`, { role: newRole }, axiosConfig); fetchAdminUsers(); } });
  };

  const handleAdminEditDomain = (id, currentName) => {
    Swal.fire({ title: 'แก้ไข Root Domain', input: 'text', inputValue: currentName, background: '#181E29', color: '#C9CED6', showCancelButton: true })
      .then(async (res) => {
        if (res.isConfirmed && res.value) { 
          await axiosInstance.put(`/api/admin/domains/${id}`, { name: res.value }, axiosConfig); 
          Swal.fire({ icon: 'success', title: 'อัปเดตโดเมนสำเร็จ!', background: '#181E29', color: '#C9CED6', timer: 1500 });
          fetchAdminDomains(); 
        }
      });
  };

  const handleAdminEditTag = (oldTag) => {
    Swal.fire({ title: `เปลี่ยนชื่อแท็ก: #${oldTag}`, input: 'text', inputValue: oldTag, background: '#181E29', color: '#C9CED6', showCancelButton: true })
      .then(async (res) => {
        if (res.isConfirmed && res.value && res.value !== oldTag) { 
          await axiosInstance.put(`/api/admin/tags`, { oldTag, newTag: res.value }, axiosConfig); 
          fetchAdminTags(); 
        }
      });
  };

  const handleAdminDeleteTag = (tag) => {
    Swal.fire({ title: `ลบแท็ก #${tag} ออกจากทุกลิงก์?`, background: '#181E29', color: '#C9CED6', showCancelButton: true, confirmButtonColor: '#EB568E' })
      .then(async (res) => {
        if (res.isConfirmed) { 
          await axiosInstance.delete(`/api/admin/tags`, { data: { tag }, ...axiosConfig }); 
          fetchAdminTags(); 
        }
      });
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  return (
    <div className="min-h-screen pb-12 bg-[#0B101B] text-[#C9CED6] font-sans">
      <nav className="bg-[#181E29] border-b border-gray-800 relative overflow-hidden shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center relative z-10">
          <h1 className="text-2xl font-black flex items-center gap-2 text-[#61DAFB]">Yoalink.com</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">ผู้ใช้: <strong className="text-white">{user.username}</strong></span>
            <button onClick={handleLogout} className="bg-gray-800 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-700">Log out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {/* Main Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-800 pb-2">
          <button onClick={() => setActiveTab('links')} className={`pb-2 px-4 font-bold ${activeTab === 'links' ? 'text-[#EB568E] border-b-2 border-[#EB568E]' : 'text-gray-400 hover:text-white'}`}>🔗 จัดการลิงก์</button>
          <button onClick={() => setActiveTab('domains')} className={`pb-2 px-4 font-bold ${activeTab === 'domains' ? 'text-[#EB568E] border-b-2 border-[#EB568E]' : 'text-gray-400 hover:text-white'}`}>🌐 โดเมนของฉัน</button>
          {user.role === 'admin' && (
            <button onClick={() => setActiveTab('admin')} className={`pb-2 px-4 font-bold flex items-center gap-1 ${activeTab === 'admin' ? 'text-[#144EE3] border-b-2 border-[#144EE3]' : 'text-gray-400 hover:text-white'}`}>👑 Admin Dashboard</button>
          )}
        </div>

        {activeTab === 'links' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-[#181E29] p-6 rounded-2xl border border-gray-800 h-fit shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-white">✨ สร้างลิงก์ย่อใหม่</h2>
              <form onSubmit={handleCreateLink} className="space-y-4">
                <input type="text" required value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)} placeholder="URL ปลายทาง" className="w-full px-4 py-3 bg-[#0B101B] border border-gray-800 rounded-xl text-sm outline-none text-white focus:ring-2 focus:ring-[#144EE3]" />
                <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="ชื่อย่อ (เว้นว่าง = สุ่ม 4 ตัว)" className="w-full px-4 py-3 bg-[#0B101B] border border-gray-800 rounded-xl text-sm outline-none text-white focus:ring-2 focus:ring-[#144EE3]" />
                <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Tags (คั่นด้วยคอมมา)" className="w-full px-4 py-3 bg-[#0B101B] border border-gray-800 rounded-xl text-sm outline-none text-white focus:ring-2 focus:ring-[#144EE3]" />
                <button type="submit" className="w-full bg-[#144EE3] hover:bg-[#1140C7] text-white font-bold py-3 rounded-xl">🚀 สร้างลิงก์ย่อ</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#181E29] p-6 rounded-2xl border border-gray-800 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">📋 รายการลิงก์</h2>
                <input type="text" placeholder="🔍 ค้นหา..." value={search} onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}} className="px-4 py-2 bg-[#0B101B] border border-gray-800 rounded-xl text-xs text-white" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-800/50 text-xs text-gray-400"><th className="p-3">โดเมนหลัก</th><th className="p-3">ลิงก์ย่อ / คัดลอก</th><th className="p-3">แท็ก</th><th className="p-3 text-center">จัดการ</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-sm">
                    {links.map(l => (
                      <tr key={l.id} className="hover:bg-gray-800/20">
                        <td className="p-3 font-bold text-gray-400 text-xs">{l.Domain?.name || '-'}</td>
                       <td className="p-3">
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-2">
      {/* 🟢 แสดง https:// ให้เห็นชัดๆ บนหน้าจอเลย */}
      <a href={`https://yoalink.com/${l.alias}`} target="_blank" className="text-[#61DAFB] font-bold hover:underline text-sm">
        https://yoalink.com/{l.alias}
      </a>
      {/* 🟢 ปุ่มคัดลอกแบบสีน้ำเงินเด่นๆ มีคำว่า 'Copy' */}
      <button 
        onClick={() => handleCopy(l.alias)} 
        className="flex items-center gap-1 bg-[#144EE3] hover:bg-[#1140C7] text-white px-2.5 py-1 rounded-md text-xs font-bold transition shadow-md cursor-pointer"
      >
        📋 Copy
      </button>
    </div>
    <span className="text-gray-500 text-[11px] truncate block max-w-[250px]">{l.originalUrl}{l.parameter}</span>
  </div>
</td>
                        <td className="p-3"><div className="flex gap-1">{l.tags?.map(t => <span key={t} className="bg-[#0B101B] text-[10px] border border-gray-800 px-1.5 py-0.5 rounded text-gray-400">#{t}</span>)}</div></td>
                        <td className="p-3 text-center"><button onClick={() => handleDeleteLink(l.id)} className="text-red-400 bg-red-500/10 px-2 py-1 rounded text-xs font-bold">ลบ</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 👑 ADMIN TAB */}
        {activeTab === 'admin' && user.role === 'admin' && (
          <div className="bg-[#181E29] p-6 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex gap-4 mb-6 border-b border-gray-800 pb-2">
              <button onClick={() => setAdminSubTab('users')} className={`px-4 py-2 font-bold rounded-lg ${adminSubTab === 'users' ? 'bg-[#144EE3] text-white' : 'text-gray-400'}`}>👥 สมาชิก</button>
              <button onClick={() => setAdminSubTab('domains')} className={`px-4 py-2 font-bold rounded-lg ${adminSubTab === 'domains' ? 'bg-[#144EE3] text-white' : 'text-gray-400'}`}>🌐 โดเมนทั้งหมด</button>
              <button onClick={() => setAdminSubTab('tags')} className={`px-4 py-2 font-bold rounded-lg ${adminSubTab === 'tags' ? 'bg-[#144EE3] text-white' : 'text-gray-400'}`}>🏷️ จัดการแท็ก</button>
            </div>

            {/* Admin: USERS */}
            {adminSubTab === 'users' && (
              <table className="w-full text-left text-sm"><tr className="bg-gray-800/50"><th className="p-3">Username</th><th className="p-3">Role</th><th className="p-3 text-center">จัดการ</th></tr>
                {adminUsers.map(u => (
                  <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/20">
                    <td className="p-3 text-white font-bold">{u.username}</td>
                    <td className="p-3 text-[#61DAFB]">{u.role.toUpperCase()}</td>
                    <td className="p-3 text-center">
                      {user.id !== u.id && <button onClick={() => handleAdminToggleRole(u.id, u.role)} className="bg-[#144EE3]/20 text-[#61DAFB] px-3 py-1 rounded font-bold text-xs">สลับสิทธิ์</button>}
                    </td>
                  </tr>
                ))}
              </table>
            )}

            {/* Admin: DOMAINS */}
            {adminSubTab === 'domains' && (
              <table className="w-full text-left text-sm"><tr className="bg-gray-800/50"><th className="p-3">ชื่อโดเมน (แก้ไขแล้ว User อัปเดตตามทันที)</th><th className="p-3 text-center">จัดการ</th></tr>
                {adminDomains.map(d => (
                  <tr key={d.id} className="border-b border-gray-800 hover:bg-gray-800/20">
                    <td className="p-3 text-white font-bold">{d.name}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleAdminEditDomain(d.id, d.name)} className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded font-bold text-xs mr-2">แก้ไข</button>
                    </td>
                  </tr>
                ))}
              </table>
            )}

            {/* Admin: TAGS */}
            {adminSubTab === 'tags' && (
              <table className="w-full text-left text-sm"><tr className="bg-gray-800/50"><th className="p-3">ชื่อแท็ก (ระบบจะวิ่งไปแก้ให้ทุกลิงก์)</th><th className="p-3 text-center">จัดการ</th></tr>
                {adminTags.map(t => (
                  <tr key={t} className="border-b border-gray-800 hover:bg-gray-800/20">
                    <td className="p-3 text-white font-bold">#{t}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleAdminEditTag(t)} className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded font-bold text-xs mr-2">เปลี่ยนชื่อ</button>
                      <button onClick={() => handleAdminDeleteTag(t)} className="bg-red-500/20 text-red-500 px-3 py-1 rounded font-bold text-xs">ลบแท็ก</button>
                    </td>
                  </tr>
                ))}
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
}