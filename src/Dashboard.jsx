/* frontend/src/Dashboard.jsx */
import { useState, useEffect } from 'react';
import axiosInstance from 'axios'; 
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('links'); 
  const [adminSubTab, setAdminSubTab] = useState('users'); 
  
  const [links, setLinks] = useState([]); 
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(''); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [domains, setDomains] = useState([]);
  
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminDomains, setAdminDomains] = useState([]);
  const [adminTags, setAdminTags] = useState([]);

  const [originalUrl, setOriginalUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [topLinks, setTopLinks] = useState([]);

  // 🔥 States ศูนย์รวมสถิติครบ 4 หมวดย่อยใน Modal (เพิ่ม Referrer)
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [activeStatLink, setActiveStatLink] = useState(null);
  const [statsSubTab, setStatsSubTab] = useState('channels'); // channels, timeTrends, devices, referrers
  const [channelStats, setChannelStats] = useState({ totalChannelClicks: 0, stats: [] });
  const [timeStatsData, setTimeStatsData] = useState({ hourly: [], daily: [] }); 
  const [deviceStatsData, setDeviceStatsData] = useState({ totalDeviceClicks: 0, stats: [] }); 
  const [referrerStatsData, setReferrerStatsData] = useState({ totalReferrerClicks: 0, stats: [] }); // 🔥 โมดูล 5

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const uniqueTagsInView = Array.from(new Set(links.flatMap(l => l.tags || [])));

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    if (activeTab === 'links') fetchLinks();
    else if (activeTab === 'domains') fetchDomains();
    else if (activeTab === 'report') fetchTopLinks(); 
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

  const fetchDomains = async () => { try { const res = await axiosInstance.get('/api/domains', axiosConfig); setDomains(res.data || []); } catch (err) {} };

  const fetchTopLinks = async () => {
    try {
      const res = await axiosInstance.get('/api/links/rank/top', axiosConfig);
      setTopLinks(res.data || []);
    } catch (err) { console.error('Error fetching top links'); }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/links', { originalUrl, alias, tags: tagsInput }, axiosConfig);
      Swal.fire({ icon: 'success', title: 'สร้างลิงก์สำเร็จ!', background: '#181E29', color: '#C9CED6', showConfirmButton: false, timer: 1500 });
      setOriginalUrl(''); setAlias(''); setTagsInput(''); setCurrentPage(1); fetchLinks();
    } catch (err) { Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.response?.data?.message || 'รูปแบบ URL ไม่ถูกต้อง', background: '#181E29', color: '#C9CED6' }); }
  };

  const handleCopy = (alias) => {
    const fullLink = `https://yoalink.com/${alias}`;
    navigator.clipboard.writeText(fullLink);
    Swal.fire({ icon: 'success', title: 'คัดลอกลิงก์แล้ว!', text: fullLink, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#181E29', color: '#C9CED6' });
  };

  // 🔥 หน้าบ้าน: กดก๊อปปี้แยกค่ายการตลาด แปลงร่างเป็น ?s=1,2,3,4,5 อัตโนมัติ
  const handleCopyChannelLink = (alias, channelType) => {
    // ระบบพจนานุกรม Mapping Key => Value 
    const channelMap = {
      'facebook': '1',
      'tiktok': '2',
      'line': '3',
      'sms': '4',
      'seo': '5'
    };
    
    const sCode = channelMap[channelType];
    const generatedLink = `https://yoalink.com/${alias}?s=${sCode}`;
    navigator.clipboard.writeText(generatedLink);
    
    Swal.fire({ 
      icon: 'success', 
      title: `ก๊อปปี้ลิงก์ช่องทาง ${channelType.toUpperCase()} แล้ว!`, 
      text: generatedLink, 
      toast: true, 
      position: 'top-end', 
      showConfirmButton: false, 
      timer: 2000, 
      background: '#181E29', 
      color: '#C9CED6' 
    });
  };

  // 🔥 อัปเกรด: เปิด Modal วิเคราะห์ ดึงข้อมูลควบ 4 เส้นทาง (ช่องทาง, เวลาพีก, อุปกรณ์, โดเมนต้นทาง)
  const handleOpenStats = async (linkItem) => {
    try {
      setActiveStatLink(linkItem);
      setStatsSubTab('channels'); 
      
      const resChannel = await axiosInstance.get(`/api/links/${linkItem.id}/channel-stats`, axiosConfig);
      const resTime = await axiosInstance.get(`/api/links/${linkItem.id}/time-stats`, axiosConfig);
      const resDevice = await axiosInstance.get(`/api/links/${linkItem.id}/device-stats`, axiosConfig); 
      const resReferrer = await axiosInstance.get(`/api/links/${linkItem.id}/referrer-stats`, axiosConfig); // 🔥 โมดูล 5
      
      setChannelStats(resChannel.data || { totalChannelClicks: 0, stats: [] });
      setTimeStatsData(resTime.data || { hourly: [], daily: [] });
      setDeviceStatsData(resDevice.data || { totalDeviceClicks: 0, stats: [] }); 
      setReferrerStatsData(resReferrer.data || { totalReferrerClicks: 0, stats: [] }); // 🔥 บันทึกลง State
      
      setShowStatsModal(true);
    } catch (err) { Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'ไม่สามารถดึงข้อมูลสถิติมาร์เก็ตติ้งรวมได้', background: '#181E29', color: '#C9CED6' }); }
  };

  // ✏️ ฟังก์ชันใหม่: กล่องเด้งสำหรับแก้ไขแท็กรายลิงก์
  const handleEditTags = (linkId, currentTags) => {
    const tagsString = Array.isArray(currentTags) ? currentTags.join(', ') : '';
    
    Swal.fire({
      title: 'แก้ไขแท็กของลิงก์ย่อนี้',
      input: 'text',
      inputValue: tagsString,
      inputPlaceholder: 'พิมพ์แท็กใหม่คั่นด้วยคอมมา (เช่น: pg, market, cam1)',
      background: '#181E29',
      color: '#C9CED6',
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#144EE3'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosInstance.put(`/api/links/${linkId}/tags`, { tags: result.value }, axiosConfig);
          Swal.fire({ icon: 'success', title: 'อัปเดตแท็กสำเร็จ!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#181E29', color: '#C9CED6' });
          fetchLinks(); // รีเฟรชตาราง
        } catch (error) {
          Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'ไม่สามารถอัปเดตแท็กได้', background: '#181E29', color: '#C9CED6' });
        }
      }
    });
  };

  const handleDeleteLink = (id) => {
    Swal.fire({ title: 'ลบลิงก์นี้?', background: '#181E29', color: '#C9CED6', showCancelButton: true, confirmButtonColor: '#EB568E' })
      .then(async (res) => { if (res.isConfirmed) { await axiosInstance.delete(`/api/links/${id}`, axiosConfig); fetchLinks(); fetchTopLinks(); } });
  };

  // ================= ADMIN FUNCTIONS =================
  const fetchAdminUsers = async () => { try { const res = await axiosInstance.get('/api/admin/users', axiosConfig); setAdminUsers(res.data); } catch (err) { setActiveTab('links'); } };
  const fetchAdminDomains = async () => { try { const res = await axiosInstance.get('/api/admin/domains', axiosConfig); setAdminDomains(res.data); } catch (err) {} };
  const fetchAdminTags = async () => { try { const res = await axiosInstance.get('/api/admin/tags', axiosConfig); setAdminTags(res.data); } catch (err) {} };

  const handleAdminToggleRole = (id, role) => {
    const newRole = role === 'admin' ? 'user' : 'admin';
    Swal.fire({ title: `เปลี่ยนสิทธิ์เป็น ${newRole.toUpperCase()}?`, background: '#181E29', color: '#C9CED6', showCancelButton: true })
      .then(async (res) => { if (res.isConfirmed) { await axiosInstance.put(`/api/admin/users/${id}/role`, { role: newRole }, axiosConfig); fetchAdminUsers(); } });
  };

  const handleAdminDeleteUser = (id, username) => {
    Swal.fire({ title: `ลบสมาชิก: ${username}?`, text: "สิทธิ์การเข้าใช้งานระบบจะถูกทำลายทันที!", background: '#181E29', color: '#C9CED6', showCancelButton: true, confirmButtonColor: '#EB568E' })
      .then(async (res) => { if (res.isConfirmed) { await axiosInstance.delete(`/api/admin/users/${id}`, axiosConfig); fetchAdminUsers(); } });
  };

  const handleAdminEditDomain = (id, currentName) => {
    Swal.fire({ title: 'แก้ไข Root Domain', input: 'text', inputValue: currentName, background: '#181E29', color: '#C9CED6', showCancelButton: true })
      .then(async (res) => { if (res.isConfirmed && res.value) { await axiosInstance.put(`/api/admin/domains/${id}`, { name: res.value }, axiosConfig); fetchAdminDomains(); } });
  };

  const handleAdminDeleteDomain = (id, domainName) => {
    Swal.fire({ title: `ลบโดเมนหลัก: ${domainName}?`, text: "โปรดตรวจสอบว่าไม่มีลิงก์ใช้งานโดเมนนี้อยู่!", background: '#181E29', color: '#C9CED6', showCancelButton: true, confirmButtonColor: '#EB568E' })
      .then(async (res) => { if (res.isConfirmed) { await axiosInstance.delete(`/api/admin/domains/${id}`, axiosConfig); fetchAdminDomains(); } });
  };

  const handleAdminEditTag = (oldTag) => {
    Swal.fire({ title: `เปลี่ยนชื่อแท็ก: #${oldTag}`, input: 'text', inputValue: oldTag, background: '#181E29', color: '#C9CED6', showCancelButton: true })
      .then(async (res) => { if (res.isConfirmed && res.value && res.value !== oldTag) { await axiosInstance.put(`/api/admin/tags`, { oldTag, newTag: res.value }, axiosConfig); fetchAdminTags(); } });
  };

  const handleAdminDeleteTag = (tag) => {
    Swal.fire({ title: `ลบแท็ก #${tag} ออกจากทุกลิงก์?`, background: '#181E29', color: '#C9CED6', showCancelButton: true, confirmButtonColor: '#EB568E' })
      .then(async (res) => { if (res.isConfirmed) { await axiosInstance.delete(`/api/admin/tags`, { data: { tag }, ...axiosConfig }); fetchAdminTags(); } });
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  return (
    <div className="min-h-screen pb-12 bg-[#0B101B] text-[#C9CED6] font-sans">
      <nav className="bg-[#181E29] border-b border-gray-800 relative overflow-hidden shadow-xl">
        <div className="max-w-[1490px] mx-auto px-6 py-5 flex justify-between items-center relative z-10">
          <h1 className="text-3xl font-black flex items-center gap-2 text-[#61DAFB]">Yoalink.com</h1>
          <div className="flex items-center gap-6">
            <span className="text-base text-gray-400">ผู้ใช้: <strong className="text-white text-lg">{user.username}</strong></span>
            <button onClick={handleLogout} className="bg-gray-800 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-700 cursor-pointer transition">Log out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1640px] mx-auto px-6 mt-10">
        
        {/* 🔥 MAIN NAVIGATION TABS */}
        <div className="flex flex-wrap gap-6 mb-8 border-b border-gray-800 pb-3">
          <button onClick={() => setActiveTab('links')} className={`pb-3 px-6 text-lg font-bold cursor-pointer transition ${activeTab === 'links' ? 'text-[#EB568E] border-b-4 border-[#EB568E]' : 'text-gray-400 hover:text-white'}`}>🔗 จัดการลิงก์</button>
          <button onClick={() => setActiveTab('domains')} className={`pb-3 px-6 text-lg font-bold cursor-pointer transition ${activeTab === 'domains' ? 'text-[#EB568E] border-b-4 border-[#EB568E]' : 'text-gray-400 hover:text-white'}`}>🌐 โดเมนของฉัน</button>
          <button onClick={() => setActiveTab('report')} className={`pb-3 px-6 text-lg font-bold cursor-pointer transition flex items-center gap-2 ${activeTab === 'report' ? 'text-amber-400 border-b-4 border-amber-400' : 'text-gray-400 hover:text-white'}`}>🏆 Top Rank Leaderboard</button>
          {user.role === 'admin' && (
            <button onClick={() => setActiveTab('admin')} className={`pb-3 px-6 text-lg font-bold flex items-center gap-2 cursor-pointer transition ${activeTab === 'admin' ? 'text-[#144EE3] border-b-4 border-[#144EE3]' : 'text-gray-400 hover:text-white'}`}>👑 Admin Dashboard</button>
          )}
        </div>

        {/* 🏆 TAB: TOP RANK LEADERBOARD */}
        {activeTab === 'report' && (
          <div className="bg-[#181E29] p-8 rounded-2xl border border-gray-800 shadow-lg animate-fade-in min-h-[500px]">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-500 to-orange-500 inline-block mb-3 drop-shadow-lg">
                🏆 Top Score Leaderboard
              </h2>
              <p className="text-lg text-gray-400">
                {user.role === 'admin' 
                  ? 'จัดอันดับทราฟฟิกชอร์ตลิงก์ที่ร้อนแรงที่สุดในระบบ (แข่งขันระดับองค์กร)' 
                  : 'จัดอันดับสุดยอดชอร์ตลิงก์ของคุณที่ทำผลงานได้ดีที่สุด'}
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {topLinks.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <span className="text-5xl block mb-4">📭</span>
                  <p className="text-xl font-bold">ยังไม่มีข้อมูลการคลิกในระบบ</p>
                  <p>เริ่มนำลิงก์ไปแชร์เพื่อไต่อันดับได้เลย!</p>
                </div>
              ) : (
                topLinks.map((link, index) => {
                  const rank = index + 1;
                  const maxClicks = topLinks[0]?.clicks || 1;
                  const widthPer = Math.max((link.clicks / maxClicks) * 100, 2); 
                  
                  let barColor = 'from-blue-600 to-cyan-400';
                  let rankBadge = 'bg-gray-800 text-gray-400';
                  let crown = '';

                  if (rank === 1) { 
                    barColor = 'from-yellow-400 to-orange-500'; 
                    rankBadge = 'bg-yellow-500/20 text-yellow-400 text-2xl shadow-[0_0_20px_rgba(250,204,21,0.5)] border border-yellow-500/50'; 
                    crown = '👑';
                  } else if (rank === 2) { 
                    barColor = 'from-gray-300 to-gray-500'; 
                    rankBadge = 'bg-gray-400/20 text-gray-300 text-xl shadow-[0_0_15px_rgba(156,163,175,0.4)] border border-gray-400/50'; 
                  } else if (rank === 3) { 
                    barColor = 'from-orange-400 to-red-500'; 
                    rankBadge = 'bg-orange-500/20 text-orange-400 text-xl shadow-[0_0_15px_rgba(249,115,22,0.4)] border border-orange-500/50'; 
                  }

                  return (
                    <div key={link.id} className="relative bg-[#0B101B] p-5 rounded-2xl border border-gray-800 flex items-center gap-6 hover:border-gray-600 transition-colors group">
                      <div className={`flex items-center justify-center font-black w-16 h-16 rounded-full shrink-0 ${rankBadge}`}>
                        {crown} #{rank}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-3 gap-2">
                          <div className="truncate pr-4">
                            <h4 className="text-xl font-bold text-white mb-1 truncate">
                              <a href={`https://yoalink.com/${link.alias}`} target="_blank" rel="noreferrer" className="hover:text-[#61DAFB] transition-colors">
                                yoalink.com/{link.alias}
                              </a>
                            </h4>
                            <p className="text-sm text-gray-500 truncate">{link.originalUrl}</p>
                            
                            {user.role === 'admin' && (
                              <p className="text-xs text-indigo-400 font-bold mt-1.5 flex items-center gap-1">
                                👤 สร้างโดย: <span className="text-white bg-indigo-500/20 px-2 py-0.5 rounded-md">{link.User?.username || 'ระบบ'}</span>
                              </p>
                            )}
                          </div>
                          
                          <div className="text-left sm:text-right shrink-0">
                            <span className="text-3xl font-black text-white tracking-wide">{link.clicks.toLocaleString()} <span className="text-sm text-gray-400 font-normal">คลิก</span></span>
                          </div>
                        </div>

                        <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden border border-gray-800 shadow-inner">
                          <div 
                            className={`bg-gradient-to-r ${barColor} h-full rounded-full transition-all duration-1000 relative`} 
                            style={{ width: `${widthPer}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                          </div>
                        </div>
                      </div>

                      <button onClick={() => handleOpenStats(link)} className="hidden sm:flex absolute right-5 top-5 bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-xl text-sm font-bold transition opacity-0 group-hover:opacity-100 cursor-pointer">
                        📊 เจาะลึก
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 🔗 TAB 1: จัดการลิงก์ย่อ */}
        {activeTab === 'links' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="bg-[#181E29] p-8 rounded-2xl border border-gray-800 h-fit shadow-lg lg:col-span-1">
              <h2 className="text-2xl font-bold mb-6 text-white">✨ สร้างลิงก์ย่อใหม่</h2>
              <form onSubmit={handleCreateLink} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">URL ปลายทางที่ต้องการย่อ</label>
                  <input type="text" required value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)} placeholder="https://example.com/page" className="w-full px-4 py-3.5 bg-[#0B101B] border border-gray-800 rounded-xl text-base outline-none text-white focus:ring-2 focus:ring-[#144EE3]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">ชื่อย่อ (ALIAS)</label>
                  <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="เว้นว่างไว้เพื่อสุ่ม 4 ตัว" className="w-full px-4 py-3.5 bg-[#0B101B] border border-gray-800 rounded-xl text-base outline-none text-white focus:ring-2 focus:ring-[#144EE3]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">TAGS คัดกรอง (คั่นด้วยคอมมา)</label>
                  <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="เช่น pg, market, cam1" className="w-full px-4 py-3.5 bg-[#0B101B] border border-gray-800 rounded-xl text-base outline-none text-white focus:ring-2 focus:ring-[#144EE3]" />
                </div>
                <button type="submit" className="w-full bg-[#144EE3] hover:bg-[#1140C7] text-white font-bold py-4 rounded-xl text-base cursor-pointer transition shadow-md">🚀 สร้างลิงก์ย่อระบบ</button>
              </form>
            </div>

            <div className="lg:col-span-3 bg-[#181E29] p-8 rounded-2xl border border-gray-800 shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-white">📋 รายการลิงก์ย่อในระบบ</h2>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  {selectedTag && ( <button onClick={() => setSelectedTag('')} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 text-sm px-3 py-2 rounded-xl flex items-center gap-1 font-bold cursor-pointer transition">❌ ล้างแท็ก: #{selectedTag}</button> )}
                  <select value={selectedTag} onChange={(e) => { setSelectedTag(e.target.value); setCurrentPage(1); }} className="px-4 py-2.5 bg-[#0B101B] border border-gray-800 rounded-xl text-sm text-gray-300 outline-none cursor-pointer focus:border-gray-600">
                    <option value="">🏷️ กรองตามแท็กทั้งหมด</option>
                    {uniqueTagsInView.map(t => ( <option key={t} value={t}>#{t}</option> ))}
                  </select>
                  <input type="text" placeholder="🔍 ค้นหา (ชื่อย่อ / URL ปลายทาง)..." value={search} onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}} className="px-5 py-2.5 bg-[#0B101B] border border-gray-800 rounded-xl text-sm text-white outline-none min-w-[260px] focus:border-gray-600" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-800/60 text-sm font-bold text-gray-300 border-b border-gray-700">
                      <th className="p-4 w-[12%]">โดเมนหลัก</th>
                      <th className="p-4 w-[38%]">ลิงก์ย่อ / ปุ่มก๊อปแยกค่ายการตลาดด่วน (Marketing Menu)</th>
                      <th className="p-4 w-[12%]">แท็ก</th>
                      {user.role === 'admin' && <th className="p-4 w-[12%] text-indigo-400">ผู้สร้าง (Owner)</th>}
                      <th className="p-4 w-[26%] text-center">จัดการลิงก์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-base">
                    {links.length === 0 ? ( <tr><td colSpan={user.role === 'admin' ? "5" : "4"} className="text-center py-10 text-gray-400 font-medium">📭 ไม่พบข้อมูลรายการลิงก์</td></tr> ) : (
                      links.map(l => (
                        <tr key={l.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="p-4 font-bold text-gray-300 text-sm tracking-wide">{l.Domain?.name || '-'}</td>
                          <td className="p-4">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-3">
                                <a href={`https://yoalink.com/${l.alias}`} target="_blank" rel="noreferrer" className="text-[#61DAFB] text-lg font-bold hover:underline tracking-wide">https://yoalink.com/{l.alias}</a>
                                <button onClick={() => handleCopy(l.alias)} className="flex items-center gap-1.5 bg-[#144EE3] hover:bg-[#1140C7] text-white px-3 py-1.5 rounded-lg text-sm font-bold transition shadow-md cursor-pointer">📋 Copy</button>
                              </div>
                              <span className="text-gray-400 text-sm truncate block max-w-[450px]" title={`${l.originalUrl}${l.parameter || ''}`}>{l.originalUrl}{l.parameter}</span>
                              <div className="flex flex-wrap gap-1.5 bg-[#0B101B] p-2 rounded-xl border border-gray-800/60 w-fit">
                                <button onClick={() => handleCopyChannelLink(l.alias, 'facebook')} className="bg-blue-600/10 hover:bg-blue-600/30 text-blue-400 text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition">🔵 FB</button>
                                <button onClick={() => handleCopyChannelLink(l.alias, 'tiktok')} className="bg-pink-600/10 hover:bg-pink-600/30 text-pink-400 text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition">🎵 TikTok</button>
                                <button onClick={() => handleCopyChannelLink(l.alias, 'line')} className="bg-green-600/10 hover:bg-green-600/30 text-green-400 text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition">🟢 LINE</button>
                                <button onClick={() => handleCopyChannelLink(l.alias, 'sms')} className="bg-orange-600/10 hover:bg-orange-600/30 text-orange-400 text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition">📱 SMS</button>
                                <button onClick={() => handleCopyChannelLink(l.alias, 'seo')} className="bg-purple-600/10 hover:bg-purple-600/30 text-purple-400 text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition">🔍 SEO</button>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {/* 🔥 ปุ่มกดเพื่อแก้ไขแท็ก (Edit Tags) */}
                            <div className="flex gap-1.5 flex-wrap items-center">
                              {l.tags && l.tags.length > 0 ? ( 
                                l.tags.map(t => ( 
                                  <button key={t} onClick={() => { setSelectedTag(t); setCurrentPage(1); }} className="bg-[#0B101B] hover:bg-[#144EE3]/30 hover:text-[#61DAFB] text-xs font-semibold border border-gray-800 px-2.5 py-1 rounded-md text-gray-400 cursor-pointer transition">#{t}</button> 
                                )) 
                              ) : ( 
                                <span className="text-gray-600 text-sm italic mr-1">ไม่มี</span> 
                              )}
                              <button onClick={() => handleEditTags(l.id, l.tags)} className="text-gray-500 hover:text-white ml-1 cursor-pointer transition p-1" title="แก้ไขแท็ก">
                                ✏️
                              </button>
                            </div>
                          </td>
                          {user.role === 'admin' && ( <td className="p-4 font-bold text-indigo-400 text-sm">👤 {l.User?.username || 'ระบบกลาง'}</td> )}
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleOpenStats(l)} className="text-[#61DAFB] bg-[#61DAFB]/10 hover:bg-[#61DAFB]/20 px-3 py-1.5 rounded-xl text-sm font-bold cursor-pointer transition flex items-center gap-1">📊 วิเคราะห์ ({l.clicks || 0})</button>
                              <button onClick={() => handleDeleteLink(l.id)} className="text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl text-sm font-bold cursor-pointer transition">ลบข้อมูล</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 🌐 TAB 2: โดเมนของฉัน */}
        {activeTab === 'domains' && (
          <div className="bg-[#181E29] p-8 rounded-2xl border border-gray-800 shadow-lg">
            <h2 className="text-2xl font-bold mb-3 text-white flex items-center gap-2"><span>🌐</span> โดเมนของฉัน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {domains.length === 0 ? ( <p className="text-gray-500 py-10 text-center text-base col-span-full">ยังไม่มีข้อมูลโดเมนที่ลงทะเบียน</p> ) : ( domains.map(d => ( <div key={d.id} className="bg-[#0B101B] p-6 rounded-xl border border-gray-800 text-white font-bold text-xl">{d.name}</div> )) )}
            </div>
          </div>
        )}

        {/* 👑 TAB 3: ADMIN DASHBOARD */}
        {activeTab === 'admin' && user.role === 'admin' && (
          <div className="bg-[#181E29] p-8 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex gap-4 mb-8 border-b border-gray-800 pb-3">
              <button onClick={() => setAdminSubTab('users')} className={`px-5 py-2.5 text-base font-bold rounded-xl cursor-pointer ${adminSubTab === 'users' ? 'bg-[#144EE3] text-white' : 'text-gray-400'}`}>👥 สมาชิกทั้งหมด</button>
              <button onClick={() => setAdminSubTab('domains')} className={`px-5 py-2.5 text-base font-bold rounded-xl cursor-pointer ${adminSubTab === 'domains' ? 'bg-[#144EE3] text-white' : 'text-gray-400'}`}>🌐 โดเมนทั้งหมด</button>
              <button onClick={() => setAdminSubTab('tags')} className={`px-5 py-2.5 text-base font-bold rounded-xl cursor-pointer ${adminSubTab === 'tags' ? 'bg-[#144EE3] text-white' : 'text-gray-400'}`}>🏷️ จัดการแท็กส่วนกลาง</button>
            </div>
            {adminSubTab === 'users' && ( <table className="w-full text-left text-base"><tbody>{adminUsers.map(u => ( <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/20"><td className="p-4 text-white font-bold">{u.username}</td><td className="p-4 text-center"><button onClick={() => handleAdminToggleRole(u.id, u.role)} className="bg-[#144EE3]/20 text-[#61DAFB] px-3 py-1.5 rounded-xl text-sm mr-2">สลับสิทธิ์</button><button onClick={() => handleAdminDeleteUser(u.id, u.username)} className="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-xl text-sm">ลบ</button></td></tr> ))}</tbody></table> )}
            {adminSubTab === 'domains' && ( <table className="w-full text-left text-base"><tbody>{adminDomains.map(d => ( <tr key={d.id} className="border-b border-gray-800 hover:bg-gray-800/20"><td className="p-4 text-white font-bold">{d.name}</td><td className="p-4 text-center"><button onClick={() => handleAdminEditDomain(d.id, d.name)} className="bg-yellow-500/20 text-yellow-500 px-3 py-1.5 rounded-xl text-sm mr-2">แก้ไข</button><button onClick={() => handleAdminDeleteDomain(d.id, d.name)} className="bg-red-500/20 text-red-500 px-3 py-1.5 rounded-xl text-sm">ลบ</button></td></tr> ))}</tbody></table> )}
            {adminSubTab === 'tags' && ( <table className="w-full text-left text-base"><tbody>{adminTags.map(t => ( <tr key={t} className="border-b border-gray-800 hover:bg-gray-800/20"><td className="p-4 text-white">#{t}</td><td className="p-4 text-center"><button onClick={() => handleAdminEditTag(t)} className="bg-yellow-500/20 text-yellow-500 px-3 py-1.5 rounded-xl text-sm mr-2">เปลี่ยนชื่อ</button><button onClick={() => handleAdminDeleteTag(t)} className="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-xl text-sm">ลบ</button></td></tr> ))}</tbody></table> )}
          </div>
        )}
      </div>

      {/* ==================================================================================== */}
      {/* 📊 🔥 MODAL ร่องทอง: รวม 4 โมดูล (เพิ่มแท็บ 4: โดเมนอ้างอิง Top Referrer) */}
      {/* ==================================================================================== */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#181E29] border border-gray-800 rounded-3xl p-8 max-w-3xl w-full shadow-2xl relative">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">📊 ศูนย์วิเคราะห์ข้อมูลมาร์เก็ตติ้งรวม</h3>
                <p className="text-sm text-gray-400 mt-1">ลิงก์ย่อ: <span className="text-[#61DAFB] font-bold">yoalink.com/{activeStatLink?.alias}</span></p>
              </div>
              <button onClick={() => setShowStatsModal(false)} className="text-gray-400 hover:text-white bg-[#0B101B] px-3 py-2 rounded-xl text-sm font-bold border border-gray-800 cursor-pointer transition">✕ ปิดหน้าต่าง</button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-800 pb-2">
              <button onClick={() => setStatsSubTab('channels')} className={`pb-2 px-4 font-bold text-sm cursor-pointer transition ${statsSubTab === 'channels' ? 'text-[#61DAFB] border-b-2 border-[#61DAFB]' : 'text-gray-400 hover:text-white'}`}>🎯 แยกช่องทาง</button>
              <button onClick={() => setStatsSubTab('timeTrends')} className={`pb-2 px-4 font-bold text-sm cursor-pointer transition ${statsSubTab === 'timeTrends' ? 'text-[#EB568E] border-b-2 border-[#EB568E]' : 'text-gray-400 hover:text-white'}`}>⏰ เวลาทองคำ</button>
              <button onClick={() => setStatsSubTab('devices')} className={`pb-2 px-4 font-bold text-sm cursor-pointer transition ${statsSubTab === 'devices' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400 hover:text-white'}`}>📱 อุปกรณ์คนใช้</button>
              <button onClick={() => setStatsSubTab('referrers')} className={`pb-2 px-4 font-bold text-sm cursor-pointer transition ${statsSubTab === 'referrers' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>🌐 โดเมนต้นทาง</button>
            </div>

            {statsSubTab === 'channels' && (
              <div className="space-y-4">
                <div className="bg-[#0B101B] border border-gray-800 rounded-2xl p-4 flex justify-between items-center shadow-inner">
                  <span className="text-gray-400 text-sm font-semibold">📈 ยอดคลิกแยกค่ายรวม:</span>
                  <span className="text-2xl font-black text-[#61DAFB]">{channelStats.totalChannelClicks} ครั้ง</span>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {channelStats.stats?.map((item, idx) => {
                    let barColor = 'from-gray-600 to-gray-400'; let channelTitle = item.channel.toUpperCase();
                    if (item.channel === 'facebook') { barColor = 'from-blue-600 to-blue-400'; channelTitle = '🔵 FACEBOOK AD'; }
                    else if (item.channel === 'tiktok') { barColor = 'from-pink-600 to-purple-500'; channelTitle = '🎵 TIKTOK AD'; }
                    else if (item.channel === 'line') { barColor = 'from-green-600 to-green-400'; channelTitle = '🟢 LINE CAMPAIGN'; }
                    else if (item.channel === 'sms') { barColor = 'from-orange-600 to-amber-500'; channelTitle = '📱 SMS BROADCAST'; }
                    else if (item.channel === 'seo') { barColor = 'from-indigo-600 to-violet-400'; channelTitle = '🔍 SEO / ORGANIC'; }
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm font-bold text-gray-400"><span>{channelTitle}</span><span className="text-white">{item.clicks} คลิก ({item.percentage}%)</span></div>
                        <div className="w-full bg-[#0B101B] rounded-full h-5 overflow-hidden border border-gray-800/40 relative">
                          <div className={`bg-gradient-to-r ${barColor} h-full rounded-full flex items-center justify-end pr-3`} style={{ width: `${item.percentage || (item.clicks > 0 ? 2 : 0)}%` }}>
                            {item.percentage > 5 && <span className="text-white text-xs font-black">{item.percentage}%</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {statsSubTab === 'timeTrends' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-gray-400 mb-2">📅 เทรนด์ยอดคลิกรายวัน (7 วันล่าสุด)</h4>
                  <div className="grid grid-cols-7 gap-2 items-end bg-[#0B101B] p-4 rounded-2xl border border-gray-800 h-28 shadow-inner">
                    {timeStatsData.daily?.map((d, i) => {
                      const maxClicks = Math.max(...timeStatsData.daily.map(o => o.clicks), 1);
                      const heightPercent = Math.min(Math.max((d.clicks / maxClicks) * 100, 8), 100);
                      return (
                        <div key={i} className="flex flex-col items-center gap-1 group relative cursor-pointer">
                          <span className="absolute -top-6 bg-gray-800 text-white text-[10px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition z-10">{d.clicks} คลิก</span>
                          <div className="w-full bg-gradient-to-t from-[#EB568E]/60 to-[#EB568E] rounded transition-all duration-700 shadow-md" style={{ height: `${heightPercent}px` }}></div>
                          <span className="text-[9px] text-gray-500 mt-1">{d.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-400 mb-1.5">⏰ คัดกรองความพีกตามชั่วโมงทองคำ</h4>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-2 bg-[#0B101B] p-3 rounded-2xl border border-gray-800">
                    {timeStatsData.hourly?.map((h, idx) => {
                      const totalAllClicks = timeStatsData.hourly.reduce((s, o) => s + o.clicks, 0); const per = totalAllClicks > 0 ? Math.round((h.clicks / totalAllClicks) * 100) : 0;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-mono w-10">{h.hour}</span>
                          <div className="flex-1 bg-gray-950 rounded-full h-3 border border-gray-800 relative">
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full" style={{ width: `${per || (h.clicks > 0 ? 3 : 0)}%` }}></div>
                          </div>
                          <span className="text-xs text-orange-400 w-16 text-right font-bold">{h.clicks} คลิก</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {statsSubTab === 'devices' && (
              <div className="space-y-4">
                <div className="bg-[#0B101B] border border-gray-800 rounded-2xl p-4 flex justify-between items-center shadow-inner">
                  <span className="text-gray-400 text-sm font-semibold">📈 ยอดสแกนรหัสอุปกรณ์รวม:</span>
                  <span className="text-2xl font-black text-amber-400">{deviceStatsData.totalDeviceClicks || 0} ครั้ง</span>
                </div>
                <div className="space-y-5 max-h-[300px] overflow-y-auto pr-2">
                  {deviceStatsData.stats?.map((item, idx) => {
                    let barColor = 'from-purple-600 to-indigo-400'; let iconTitle = '⚙️ OTHER DEVICES';
                    if (item.platform === 'iOS') { barColor = 'from-slate-300 to-slate-100'; iconTitle = '🍏 APPLE iOS (iPhone/iPad)'; }
                    else if (item.platform === 'Android') { barColor = 'from-green-500 to-lime-400'; iconTitle = '🤖 GOOGLE ANDROID'; }
                    else if (item.platform === 'Desktop') { barColor = 'from-blue-600 to-cyan-400'; iconTitle = '💻 DESKTOP (PC/Mac)'; }
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm font-bold text-gray-400"><span>{iconTitle}</span><span className="text-white">{item.clicks} คลิก ({item.percentage}%)</span></div>
                        <div className="w-full bg-[#0B101B] rounded-full h-5 overflow-hidden border border-gray-800/40 relative">
                          <div className={`bg-gradient-to-r ${barColor} h-full rounded-full flex items-center justify-end pr-3`} style={{ width: `${item.percentage || (item.clicks > 0 ? 2 : 0)}%` }}>
                            {item.percentage > 5 && <span className="text-gray-900 text-xs font-black">{item.percentage}%</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🔥 หน้าที่ 4: สถิติโดเมนต้นทางอ้างอิง (Top Referrer) แบบกราฟแท่งหรูหรา */}
            {statsSubTab === 'referrers' && (
              <div className="space-y-4">
                <div className="bg-[#0B101B] border border-gray-800 rounded-2xl p-4 flex justify-between items-center shadow-inner">
                  <span className="text-gray-400 text-sm font-semibold">📈 ยอดคลิกแกะรอยเว็บไซต์ต้นทางรวม:</span>
                  <span className="text-2xl font-black text-indigo-400 tracking-wide">{referrerStatsData.totalReferrerClicks || 0} ครั้ง</span>
                </div>

                <div className="space-y-5 max-h-[350px] overflow-y-auto pr-2">
                  {referrerStatsData.stats && referrerStatsData.stats.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 text-base italic">📭 ยังไม่มีข้อมูลโดเมนอ้างอิง</p>
                  ) : (
                    referrerStatsData.stats?.map((item, idx) => {
                      const isDirect = item.domain === 'Direct, Email, SMS';
                      const barColor = isDirect ? 'from-gray-600 to-gray-500' : 'from-indigo-600 to-cyan-400';
                      const domainTitle = isDirect ? '✉️ Direct Traffic (ไม่ผ่านเว็บอื่น)' : `🔗 ${item.domain}`;

                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-sm font-bold text-gray-300">
                            <span className={isDirect ? 'text-gray-500' : 'text-white'}>{domainTitle}</span>
                            <span className="text-white">{item.clicks} คลิก (<span className="text-indigo-400">{item.percentage}%</span>)</span>
                          </div>
                          <div className="w-full bg-[#0B101B] rounded-full h-6 overflow-hidden relative border border-gray-800/40 shadow-inner">
                            <div 
                              className={`bg-gradient-to-r ${barColor} h-full rounded-full transition-all duration-1000 flex items-center justify-end pr-3`}
                              style={{ width: `${item.percentage || (item.clicks > 0 ? 2 : 0)}%` }}
                            >
                              {item.percentage > 5 && (
                                <span className="text-white text-xs font-black drop-shadow-md">{item.percentage}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* สไตล์อนิเมชันสำหรับเอฟเฟกต์ไฟวิ่งของกราฟ */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

    </div>
  );
}