/* frontend/src/Dashboard.jsx */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('links'); // สลับแท็บ 'links' หรือ 'domains'
  
  // 📋 States สำหรับระบบจัดการลิงก์
  const [links, setLinks] = useState([]); // การันตีเป็น Array เสมอ
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 🌐 States สำหรับระบบจัดการโดเมน (Bulk Edit)
  const [domains, setDomains] = useState([]);
  
  // 📝 States สำหรับฟอร์มสร้างลิงก์ย่อ
  const [originalUrl, setOriginalUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [tags, setTags] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // คอยเฝ้าดึงข้อมูลเมื่อมีการเปลี่ยนสถานะหน้าจอ
  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    if (activeTab === 'links') {
      fetchLinks();
    } else {
      fetchDomains();
    }
  }, [activeTab, search, selectedTag, currentPage]);

  // 🔵 1. ฟังก์ชันดึงลิงก์ (แกะก้อน Object เอา Array ด้านในมาใส่ ป้องกันบั๊ก .map)
  const fetchLinks = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/links?page=${currentPage}&limit=20&search=${search}&tag=${selectedTag}`,
        axiosConfig
      );
      // 🔥 จุดสำคัญ: หลังบ้านส่งแบบคัดหน้ามา ต้องแกะเข้าเอาเฉพาะ .links ที่เป็น Array
      setLinks(res.data.links || []); 
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching links:', err);
    }
  };

  // 🌐 2. ฟังก์ชันดึงรายการโดเมนทั้งหมด
  const fetchDomains = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/domains', axiosConfig);
      setDomains(res.data || []);
    } catch (err) {
      console.error('Error fetching domains:', err);
    }
  };

  // 🚀 3. ฟังก์ชันสร้างลิงก์ย่อ (ส่งลิงก์เต็มไปหั่นหลังบ้าน)
  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/links', { originalUrl, alias, tags }, axiosConfig);
      Swal.fire({ icon: 'success', title: 'สร้างลิงก์สำเร็จ!', showConfirmButton: false, timer: 1500 });
      setOriginalUrl(''); setAlias(''); setTags('');
      setCurrentPage(1);
      fetchLinks();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.response?.data?.message || 'รูปแบบ URL ไม่ถูกต้อง' });
    }
  };

  // 🌐 4. ฟังก์ชันแก้ไขเปลี่ยนโดเมนหลักยกล็อต (Edit Bulk Domain)
  const handleBulkEditDomain = (domainId, currentName) => {
    Swal.fire({
      title: '🌐 แก้ไข Root Domain ยกล็อต',
      text: 'เปลี่ยนโดเมนหลักทุกลิงก์ลูก โดยพารามิเตอร์ท้ายยังอยู่ครบถ้วน',
      input: 'text',
      inputValue: currentName,
      background: '#181E29', color: '#C9CED6',
      showCancelButton: true, confirmButtonColor: '#144EE3', cancelButtonColor: '#374151',
      confirmButtonText: 'อัปเดต', cancelButtonText: 'ยกเลิก'
    }).then(async (res) => {
      if (res.isConfirmed && res.value) {
        try {
          await axios.put(`http://localhost:5000/api/domains/${domainId}`, { name: res.value }, axiosConfig);
          Swal.fire('สำเร็จ', 'ระบบสลับโดเมนหลักให้ทุกลิงก์เรียบร้อย!', 'success');
          fetchDomains();
        } catch (err) {
          Swal.fire('ผิดพลาด', 'ไม่สามารถอัปเดตโดเมนได้', 'error');
        }
      }
    });
  };

  // 🔴 5. ฟังก์ชันลบลิงก์
  const handleDeleteLink = (id) => {
    Swal.fire({
      title: 'ต้องการลบลิงก์นี้?', background: '#181E29', color: '#C9CED6',
      showCancelButton: true, confirmButtonColor: '#EB568E', confirmButtonText: 'ลบเลย'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5000/api/links/${id}`, axiosConfig);
          fetchLinks();
        } catch (err) {
          Swal.fire('ผิดพลาด', 'ลบลิงก์ไม่สำเร็จ', 'error');
        }
      }
    });
  };

  // 🚪 6. ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-12 bg-[#0B101B] text-[#C9CED6] font-sans">
      {/* Top Navbar */}
      <nav className="bg-[#181E29] shadow-sm border-b border-gray-700 relative overflow-hidden">
        <div className="absolute -top-10 left-10 w-40 h-40 bg-[#144EE3] rounded-full blur-3xl opacity-10"></div>
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center relative z-10">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span className="text-[#61DAFB]">Yoalink.com</span>
            <span className="text-xs font-medium bg-[#144EE3]/20 text-[#61DAFB] border border-[#144EE3]/30 px-2 py-0.5 rounded-md">ย่อลิงค์</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">ผู้ใช้งาน: <strong className="text-white">{user.username || 'User'}</strong></span>
            <button onClick={handleLogout} className="bg-[#181E29] hover:bg-gray-800 border border-gray-600 px-4 py-2 rounded-xl text-xs font-bold transition">
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {/* แท็บเมนูสลับการทำงาน */}
        <div className="flex gap-4 mb-6 border-b border-gray-700 pb-2">
          <button onClick={() => setActiveTab('links')} className={`pb-2 px-4 font-bold transition ${activeTab === 'links' ? 'text-[#EB568E] border-b-2 border-[#EB568E]' : 'text-gray-400'}`}>🔗 จัดการลิงก์</button>
          <button onClick={() => setActiveTab('domains')} className={`pb-2 px-4 font-bold transition ${activeTab === 'domains' ? 'text-[#EB568E] border-b-2 border-[#EB568E]' : 'text-gray-400'}`}>🌐 จัดการโดเมน (Bulk Edit)</button>
        </div>

        {activeTab === 'links' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ฝั่งซ้าย: ฟอร์มกรอกลิงก์ตัวเดียวจบตามที่คุณต้องการ */}
            <div className="bg-[#181E29] p-6 rounded-2xl border border-gray-700 h-fit">
              <h2 className="text-xl font-bold mb-6">✨ สร้างลิงก์ย่อใหม่</h2>
              <form onSubmit={handleCreateLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1">URL ปลายทาง (ก๊อปมาวางทั้งหมด)</label>
                  <input type="text" required value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)} placeholder="วางโดเมน" className="w-full px-4 py-3 bg-[#0B101B] border border-gray-700 rounded-xl outline-none text-[#C9CED6]" />
                </div>
                {/* แก้ไขช่องกรอก Alias ใน frontend/src/Dashboard.jsx */}
<div>
  <label className="block text-sm font-bold mb-1">ชื่อย่อ (Alias) <span className="text-gray-500 font-normal">(เว้นว่างไว้เพื่อสุ่มออโต้ 4 ตัว)</span></label>
  <input 
    type="text" 
    value={alias} 
    onChange={(e) => setAlias(e.target.value)} 
    placeholder="เช่น cam1 (ไม่กรอก = สุ่ม เช่น a85s)" 
    className="w-full px-4 py-3 bg-[#0B101B] border border-gray-700 rounded-xl outline-none text-[#C9CED6]" 
  />
</div>
                <div>
                  <label className="block text-sm font-bold mb-1">Tags (คั่นด้วยคอมมา)</label>
                  <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="marketing, fb" className="w-full px-4 py-3 bg-[#0B101B] border border-gray-700 rounded-xl outline-none text-[#C9CED6]" />
                </div>
                <button type="submit" className="w-full bg-[#144EE3] hover:bg-[#1140C7] text-white font-bold py-3 rounded-xl transition shadow-lg">🚀 สร้างลิงก์</button>
              </form>
            </div>

            {/* ฝั่งขวา: ตารางแสดงผลรายการลิงก์ */}
            <div className="lg:col-span-2 bg-[#181E29] p-6 rounded-2xl border border-gray-700 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">📋 รายการลิงก์</h2>
                    {selectedTag && <span className="bg-[#EB568E]/20 text-[#EB568E] text-xs px-2 py-1 rounded">#{selectedTag} <button onClick={() => setSelectedTag('')}>✕</button></span>}
                  </div>
                  <input type="text" placeholder="🔍 ค้นหาลิงก์..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="px-4 py-2 bg-[#0B101B] border border-gray-700 rounded-lg text-sm outline-none text-[#C9CED6]" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-800 text-sm border-y border-gray-700">
                        <th className="py-3 px-4">โดเมนหลัก</th>
                        <th className="py-3 px-4">URL + พารามิเตอร์</th>
                        <th className="py-3 px-4 text-center">คลิก</th>
                        <th className="py-3 px-4">แท็ก</th>
                        <th className="py-3 px-4 text-center">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {links.map(l => (
                        <tr key={l.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                          <td className="py-3 px-4 font-bold text-gray-400 text-sm">
                            {l.Domain ? l.Domain.name : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <a href={`http://localhost:5000/${l.alias}`} target="_blank" rel="noreferrer" className="text-[#144EE3] font-bold hover:underline">/{l.alias}</a>
                            <span className="text-gray-500 block text-xs truncate max-w-[180px]">{l.originalUrl}{l.parameter}</span>
                          </td>
                          <td className="py-3 px-4 text-center"><span className="bg-[#144EE3]/10 text-[#144EE3] px-2 py-0.5 rounded-full text-xs font-bold">{l.clicks}</span></td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {l.tags?.map(t => <button key={t} onClick={() => setSelectedTag(t)} className="bg-[#0B101B] text-xs border border-gray-700 px-1.5 py-0.5 rounded hover:text-[#EB568E]">#{t}</button>)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button onClick={() => handleDeleteLink(l.id)} className="text-red-400 bg-red-500/10 px-2 py-1 rounded text-xs font-bold hover:bg-red-500/20">ลบ</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Pagination ระบบเปลี่ยนหน้า */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-700">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="px-3 py-1 bg-[#0B101B] rounded border border-gray-700 disabled:opacity-30">◀</button>
                  <span className="text-sm">หน้า {currentPage} / {totalPages}</span>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className="px-3 py-1 bg-[#0B101B] rounded border border-gray-700 disabled:opacity-30">▶</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* แท็บจัดการโดเมน (Edit Bulk Root) */
          <div className="bg-[#181E29] p-6 rounded-2xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">🖥️ โดเมนทั้งหมดในระบบ Yoalink ของคุณ</h2>
            <div className="space-y-3">
              {domains.length === 0 ? (
                <p className="text-gray-500 py-4 text-center">ระบบจะดึงรายชื่อโดเมนหลักให้เองเมื่อคุณเริ่มต้นย่อลิงก์ในหน้าแรก</p>
              ) : (
                domains.map(d => (
                  <div key={d.id} className="flex justify-between items-center bg-[#0B101B] p-4 rounded-xl border border-gray-700">
                    <div>
                      <p className="font-bold text-white text-lg">{d.name}</p>
                      <p className="text-xs text-gray-500">ทุกลิงก์ย่อที่มี Path และ Parameter ผูกกับตัวนี้ จะทำงานผ่านโดเมนด้านบน</p>
                    </div>
                    <button onClick={() => handleBulkEditDomain(d.id, d.name)} className="bg-[#144EE3] hover:bg-[#1140C7] text-white text-xs font-bold px-4 py-2 rounded-lg transition">📝 Edit Bulk Root</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}