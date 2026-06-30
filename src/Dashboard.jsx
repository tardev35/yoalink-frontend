/* frontend/src/Dashboard.jsx */
import { useState, useEffect } from 'react';
import axiosInstance from 'axios'; 
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('links'); 
  
  // 📋 States สำหรับระบบจัดการลิงก์
  const [links, setLinks] = useState([]); 
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 🌐 States สำหรับระบบจัดการโดเมน
  const [domains, setDomains] = useState([]);
  
  // 👑 States สำหรับระบบ Admin (User Management)
  const [usersList, setUsersList] = useState([]);

  // 📝 States สำหรับฟอร์มสร้างลิงก์ย่อ
  const [originalUrl, setOriginalUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [tags, setTags] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    if (activeTab === 'links') {
      fetchLinks();
    } else if (activeTab === 'domains') {
      fetchDomains();
    } else if (activeTab === 'admin') {
      fetchAdminUsers();
    }
  }, [activeTab, search, selectedTag, currentPage]);

  // 🔵 1. ฟังก์ชันดึงลิงก์
  const fetchLinks = async () => {
    try {
      const res = await axiosInstance.get(
        `/api/links?page=${currentPage}&limit=20&search=${search}&tag=${selectedTag}`,
        axiosConfig
      );
      setLinks(res.data.links || []); 
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching links:', err);
    }
  };

  // 🌐 2. ฟังก์ชันดึงรายการโดเมนทั้งหมด
  const fetchDomains = async () => {
    try {
      const res = await axiosInstance.get('/api/domains', axiosConfig);
      setDomains(res.data || []);
    } catch (err) {
      console.error('Error fetching domains:', err);
    }
  };

  // 👑 3. ฟังก์ชันดึงรายการสมาชิก (เฉพาะ Admin)
  const fetchAdminUsers = async () => {
    try {
      const res = await axiosInstance.get('/api/admin/users', axiosConfig);
      setUsersList(res.data || []);
    } catch (err) {
      console.error('Not authorized to view users');
      Swal.fire('ปฏิเสธการเข้าถึง', 'คุณไม่มีสิทธิ์เข้าถึงเมนูผู้ดูแลระบบ', 'error');
      setActiveTab('links'); // เด้งกลับหน้าหลัก
    }
  };

  // 🚀 4. ฟังก์ชันสร้างลิงก์ย่อ
  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/links', { originalUrl, alias, tags }, axiosConfig);
      Swal.fire({ 
        icon: 'success', 
        title: 'สร้างลิงก์ย่อสำเร็จ!', 
        background: '#181E29', color: '#C9CED6', confirmButtonColor: '#144EE3',
        showConfirmButton: false, timer: 1500 
      });
      setOriginalUrl(''); setAlias(''); setTags('');
      setCurrentPage(1);
      fetchLinks();
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'ผิดพลาด', 
        text: err.response?.data?.message || 'รูปแบบ URL ไม่ถูกต้อง',
        background: '#181E29', color: '#C9CED6', confirmButtonColor: '#EB568E'
      });
    }
  };

  // 🌐 5. ฟังก์ชันแก้ไขสลับเปลี่ยนโดเมนหลักยกล็อต
  const handleBulkEditDomain = (domainId, currentName) => {
    Swal.fire({
      title: '🌐 แก้ไข Root Domain ยกล็อต',
      text: 'ระบบจะสลับชื่อโดเมนหลักให้ทุกลิงก์ลูก โดยพารามิเตอร์ท้ายยังอยู่ครบถ้วน',
      input: 'text',
      inputValue: currentName,
      background: '#181E29', color: '#C9CED6',
      showCancelButton: true, confirmButtonColor: '#144EE3', cancelButtonColor: '#374151',
      confirmButtonText: 'อัปเดตโดเมน', cancelButtonText: 'ยกเลิก'
    }).then(async (res) => {
      if (res.isConfirmed && res.value) {
        try {
          await axiosInstance.put(`/api/domains/${domainId}`, { name: res.value }, axiosConfig);
          Swal.fire({ icon: 'success', title: 'อัปเดตโดเมนสำเร็จ!', background: '#181E29', color: '#C9CED6' });
          fetchDomains();
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'ไม่สามารถอัปเดตโดเมนได้', background: '#181E29', color: '#C9CED6' });
        }
      }
    });
  };

  // 🔴 6. ฟังก์ชันลบลิงก์ย่อ
  const handleDeleteLink = (id) => {
    Swal.fire({
      title: 'คุณต้องการลบลิงก์นี้ใช่หรือไม่?',
      background: '#181E29', color: '#C9CED6',
      showCancelButton: true, confirmButtonColor: '#EB568E', cancelButtonColor: '#374151',
      confirmButtonText: 'ยืนยันการลบ', cancelButtonText: 'ยกเลิก'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await axiosInstance.delete(`/api/links/${id}`, axiosConfig);
          fetchLinks();
        } catch (err) {
          Swal.fire('ผิดพลาด', 'ลบลิงก์ไม่สำเร็จ', 'error');
        }
      }
    });
  };

  // 📋 7. ฟังก์ชันคัดลอกลิงก์แบบไฮเทค (แถม https:// ให้พร้อม)
  const handleCopy = (alias) => {
    const fullLink = `https://yoalink.com/${alias}`;
    navigator.clipboard.writeText(fullLink);
    
    Swal.fire({
      icon: 'success',
      title: 'คัดลอกลิงก์แล้ว!',
      text: fullLink,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      background: '#181E29',
      color: '#C9CED6',
      iconColor: '#61DAFB'
    });
  };

  // 👑 8. ฟังก์ชันแอดมิน: สลับสิทธิ์ผู้ใช้งาน (Toggle Role)
  const handleToggleRole = (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    Swal.fire({
      title: `เปลี่ยนสิทธิ์เป็น ${newRole.toUpperCase()}?`,
      background: '#181E29', color: '#C9CED6',
      showCancelButton: true, confirmButtonColor: '#144EE3',
      confirmButtonText: 'ยืนยันการเปลี่ยน'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await axiosInstance.put(`/api/admin/users/${userId}/role`, { role: newRole }, axiosConfig);
          fetchAdminUsers();
        } catch (err) {
          Swal.fire('Error', 'เปลี่ยนสิทธิ์ไม่สำเร็จ', 'error');
        }
      }
    });
  };

  // 👑 9. ฟังก์ชันแอดมิน: เตะคนออกจากระบบ (Delete User)
  const handleDeleteUser = (userId, username) => {
    Swal.fire({
      title: `ลบสมาชิก ${username}?`,
      text: '⚠️ การลบสมาชิกอาจทำให้ลิงก์ย่อที่เขาสร้างไว้กลายเป็นลิงก์กำพร้า',
      icon: 'warning',
      background: '#181E29', color: '#C9CED6',
      showCancelButton: true, confirmButtonColor: '#EB568E',
      confirmButtonText: 'ลบเลย!'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await axiosInstance.delete(`/api/admin/users/${userId}`, axiosConfig);
          fetchAdminUsers();
        } catch (err) {
          Swal.fire('Error', 'เตะสมาชิกไม่สำเร็จ', 'error');
        }
      }
    });
  };

  // 🚪 10. ฟังก์ชันออกจากระบบ (Logout)
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-12 bg-[#0B101B] text-[#C9CED6] font-sans">
      
      {/* TOP HEADER NAVBAR */}
      <nav className="bg-[#181E29] border-b border-gray-800 relative overflow-hidden shadow-xl">
        <div className="absolute -top-10 left-10 w-40 h-40 bg-[#144EE3] rounded-full blur-3xl opacity-10"></div>
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center relative z-10">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span className="text-[#61DAFB]">Yoalink.com</span>
            <span className="text-xs font-medium bg-[#144EE3]/20 text-[#61DAFB] border border-[#144EE3]/30 px-2 py-0.5 rounded-md">ย่อลิงค์</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">ผู้ใช้งาน: <strong className="text-white">{user.username || 'User'}</strong></span>
            <button onClick={handleLogout} className="bg-[#181E29] hover:bg-gray-800 border border-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* เมนูแท็บสลับหน้าจอทำงาน */}
        <div className="flex flex-wrap gap-4 mb-6 border-b border-gray-800 pb-2">
          <button onClick={() => { setActiveTab('links'); setCurrentPage(1); }} className={`pb-2 px-4 font-bold transition cursor-pointer ${activeTab === 'links' ? 'text-[#EB568E] border-b-2 border-[#EB568E]' : 'text-gray-400 hover:text-white'}`}>🔗 จัดการลิงก์</button>
          <button onClick={() => setActiveTab('domains')} className={`pb-2 px-4 font-bold transition cursor-pointer ${activeTab === 'domains' ? 'text-[#EB568E] border-b-2 border-[#EB568E]' : 'text-gray-400 hover:text-white'}`}>🌐 จัดการโดเมน (Bulk Edit)</button>
          
          {/* ซ่อนแท็บนี้ถ้าไม่ใช่ Admin */}
          {user.role === 'admin' && (
            <button onClick={() => setActiveTab('admin')} className={`pb-2 px-4 font-bold transition cursor-pointer flex items-center gap-1 ${activeTab === 'admin' ? 'text-[#144EE3] border-b-2 border-[#144EE3]' : 'text-gray-400 hover:text-white'}`}>👑 ระบบผู้ดูแล (Admin)</button>
          )}
        </div>

        {activeTab === 'links' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* ฝั่งซ้าย: ฟอร์มการสร้างลิงก์ */}
            <div className="bg-[#181E29] p-6 rounded-2xl border border-gray-800 h-fit shadow-lg">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white"><span>✨</span> สร้างลิงก์ย่อใหม่</h2>
              <form onSubmit={handleCreateLink} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">URL ปลายทางที่ต้องการย่อ</label>
                  <input type="text" required value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)} placeholder="https://pigauto99.com/?register=1" className="w-full px-4 py-3 bg-[#0B101B] border border-gray-800 rounded-xl outline-none text-[#C9CED6] text-sm focus:ring-2 focus:ring-[#144EE3]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">ชื่อย่อ (Alias) <span className="text-gray-500 font-normal normal-case">(เว้นว่างเพื่อสุ่ม 4 ตัว)</span></label>
                  <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="เช่น cam1 (ไม่กรอก = สุ่มอัตโนมัติ)" className="w-full px-4 py-3 bg-[#0B101B] border border-gray-800 rounded-xl outline-none text-[#C9CED6] text-sm focus:ring-2 focus:ring-[#144EE3]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Tags คัดกรอง (คั่นด้วยคอมมา)</label>
                  <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="marketing, fb, line" className="w-full px-4 py-3 bg-[#0B101B] border border-gray-800 rounded-xl outline-none text-[#C9CED6] text-sm focus:ring-2 focus:ring-[#144EE3]" />
                </div>
                <button type="submit" className="w-full bg-[#144EE3] hover:bg-[#1140C7] text-white font-bold py-3.5 rounded-xl transition shadow-lg cursor-pointer text-sm">🚀 สร้างลิงก์ย่อระบบ</button>
              </form>
            </div>

            {/* ฝั่งขวา: ตารางแสดงข้อมูลลิงก์ */}
            <div className="lg:col-span-2 bg-[#181E29] p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">📋 รายการลิงก์ย่อ</h2>
                    {selectedTag && <span className="bg-[#EB568E]/20 text-[#EB568E] border border-[#EB568E]/30 text-xs px-2.5 py-1 rounded-md font-bold flex items-center gap-1">#{selectedTag} <button onClick={() => { setSelectedTag(''); setCurrentPage(1); }} className="hover:text-white font-black ml-1">✕</button></span>}
                  </div>
                  <input type="text" placeholder="🔍 ค้นหาลิงก์..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="px-4 py-2 bg-[#0B101B] border border-gray-800 rounded-xl text-xs outline-none text-[#C9CED6] w-full sm:w-48 focus:ring-2 focus:ring-[#144EE3]" />
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-800/50 text-xs uppercase tracking-wider text-gray-400 border-y border-gray-800">
                        <th className="py-3.5 px-4 font-bold">โดเมนหลัก</th>
                        <th className="py-3.5 px-4 font-bold">ลิงก์ย่อ / URL จริง</th>
                        <th className="py-3.5 px-4 text-center font-bold">ยอดคลิก</th>
                        <th className="py-3.5 px-4 font-bold">แท็ก</th>
                        <th className="py-3.5 px-4 text-center font-bold">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm">
                      {links.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-10 text-gray-500">ยังไม่มีข้อมูลลิงก์ในระบบ หรือไม่พบผลลัพธ์การค้นหา</td>
                        </tr>
                      ) : (
                        links.map(l => (
                          <tr key={l.id} className="hover:bg-gray-800/20 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-gray-400 text-xs">{l.Domain ? l.Domain.name : '-'}</td>
                            <td className="py-3.5 px-4">
                              {/* 🟢 อัปเดตใหม่: ปุ่มก๊อปปี้ลิงก์พร้อมใช้ */}
                              <div className="flex items-center gap-2">
                                <a href={`https://yoalink.com/${l.alias}`} target="_blank" rel="noreferrer" className="text-[#61DAFB] font-bold hover:underline">
                                  https://yoalink.com/{l.alias}
                                </a>
                                <button onClick={() => handleCopy(l.alias)} className="text-gray-400 hover:text-white transition cursor-pointer text-base bg-gray-800 hover:bg-gray-700 px-2 py-0.5 rounded-md" title="คัดลอกลิงก์">
                                  📋
                                </button>
                              </div>
                              <span className="text-gray-500 block text-[11px] truncate max-w-[180px] mt-0.5" title={`${l.originalUrl}${l.parameter || ''}`}>
                                {l.originalUrl}{l.parameter}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="bg-[#144EE3]/10 text-[#61DAFB] border border-[#144EE3]/20 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">{l.clicks || 0}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {l.tags?.map(t => <button key={t} onClick={() => { setSelectedTag(t); setCurrentPage(1); }} className="bg-[#0B101B] text-[10px] font-bold border border-gray-800 px-1.5 py-0.5 rounded-md text-gray-400 hover:text-[#EB568E] hover:border-[#EB568E]/40 transition cursor-pointer">#{t}</button>)}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button onClick={() => handleDeleteLink(l.id)} className="text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-red-500/20 transition cursor-pointer">ลบ</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-800">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="px-3 py-1 bg-[#0B101B] rounded-lg border border-gray-800 disabled:opacity-20 font-bold cursor-pointer">◀</button>
                  <span className="text-xs text-gray-400">หน้า {currentPage} จากทั้งหมด {totalPages} หน้า</span>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className="px-3 py-1 bg-[#0B101B] rounded-lg border border-gray-800 disabled:opacity-20 font-bold cursor-pointer">▶</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* แท็บ 🌐 ระบบจัดการโดเมน */}
        {activeTab === 'domains' && (
          <div className="bg-[#181E29] p-6 rounded-2xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold mb-2 text-white flex items-center gap-2"><span>🖥️</span> ระบบจัดการโดเมนหลักทั้งหมด</h2>
            <p className="text-xs text-gray-400 mb-6">ระบบอัจฉริยะจะดึงข้อมูล Root Domain มาสร้างให้อัตโนมัติเมื่อมีการสร้างลิงก์ย่อ</p>
            <div className="space-y-3">
              {domains.length === 0 ? (
                <p className="text-gray-500 py-6 text-center text-sm">ยังไม่มีข้อมูลโดเมนหลักผูกในระบบในขณะนี้</p>
              ) : (
                domains.map(d => (
                  <div key={d.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0B101B] p-5 rounded-xl border border-gray-800 gap-4">
                    <div>
                      <p className="font-bold text-white text-lg">{d.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">ทุกลิงก์ย่อในระบบที่ใช้ Root Domain นี้ จะถูกปรับโครงสร้างตามหากมีการกดแก้ไข</p>
                    </div>
                    <button onClick={() => handleBulkEditDomain(d.id, d.name)} className="bg-[#144EE3] hover:bg-[#1140C7] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-[#144EE3]/10 cursor-pointer w-full sm:w-auto">📝 Edit Bulk Root</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* แท็บ 👑 ระบบจัดการสมาชิก (เฉพาะ Admin) */}
        {activeTab === 'admin' && user.role === 'admin' && (
          <div className="bg-[#181E29] p-6 rounded-2xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2"><span>👑</span> บริหารจัดการสมาชิก (User Management)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800/50 text-xs uppercase text-gray-400 border-y border-gray-800">
                    <th className="py-3.5 px-4">Username</th>
                    <th className="py-3.5 px-4 text-center">สิทธิ์ (Role)</th>
                    <th className="py-3.5 px-4 text-center">วันที่สมัคร</th>
                    <th className="py-3.5 px-4 text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-gray-800/20">
                      <td className="py-3.5 px-4 font-bold text-white">{u.username}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${u.role === 'admin' ? 'bg-[#144EE3]/20 text-[#61DAFB] border border-[#144EE3]/30' : 'bg-gray-800 text-gray-400'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-gray-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('th-TH')}
                      </td>
                      <td className="py-3.5 px-4 text-center space-x-2">
                        {/* ป้องกัน Admin กดเปลี่ยนสิทธิ์ตัวเอง */}
                        {user.id !== u.id && (
                          <>
                            <button onClick={() => handleToggleRole(u.id, u.role)} className="text-[#61DAFB] bg-[#144EE3]/10 hover:bg-[#144EE3]/30 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer">
                              สลับสิทธิ์
                            </button>
                            <button onClick={() => handleDeleteUser(u.id, u.username)} className="text-red-400 bg-red-500/10 hover:bg-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer">
                              เตะออก
                            </button>
                          </>
                        )}
                        {user.id === u.id && <span className="text-xs text-gray-500 italic">(ตัวคุณเอง)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}