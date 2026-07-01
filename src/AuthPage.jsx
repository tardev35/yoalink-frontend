/* frontend/src/AuthPage.jsx */
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 🟢 ใช้ Relative Path สำหรับยิงผ่าน Nginx บน Server จริง
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(endpoint, { username, password });

      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ!',
          showConfirmButton: false,
          timer: 1500,
          background: '#181E29',
          color: '#C9CED6',
          confirmButtonColor: '#144EE3'
        }).then(() => {
          navigate('/dashboard'); 
        });

      } else {
        Swal.fire({
          icon: 'success',
          title: 'สมัครสมาชิกสำเร็จ!',
          text: 'กรุณาเข้าสู่ระบบด้วยบัญชีใหม่ของคุณ',
          background: '#181E29',
          color: '#C9CED6',
          confirmButtonColor: '#144EE3'
        });
        setIsLogin(true); 
        setPassword(''); 
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'อ๊ะ! มีบางอย่างผิดพลาด',
        text: error.response?.data?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
        background: '#181E29',
        color: '#C9CED6',
        confirmButtonColor: '#EB568E'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B101B] flex items-center justify-center p-4">
      {/* Card หลักสไตล์โมเดิร์นไร้ขอบ */}
      <div className="max-w-md w-full bg-[#181E29] rounded-3xl shadow-2xl border border-gray-800 overflow-hidden">
        
        {/* ส่วนหัวแสดงแบรนด์ Yoalink.com */}
        <div className="bg-[#181E29] p-8 text-center border-b border-gray-800">
          <h2 className="text-3xl font-black tracking-tight flex flex-col gap-1">
            <span className="text-[#61DAFB]">Yoalink.com</span>
            <span className="text-sm font-medium text-[#C9CED6]">ย่อลิงค์</span>
          </h2>
          <p className="text-[#C9CED6] mt-3 text-sm font-medium">
            URL Shortener System for Professional Teams
          </p>
        </div>

        {/* ส่วนฟอร์มกรอกข้อมูล */}
        <div className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-[#C9CED6] mb-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
                className="w-full px-5 py-4 bg-[#0B101B] border border-gray-800 rounded-xl text-[#C9CED6] focus:outline-none focus:ring-2 focus:ring-[#144EE3] focus:bg-[#181E29] transition-all duration-200 text-sm"
              />
            </div>

           <div>
  <label className="block text-sm font-semibold text-gray-400 mb-2">รหัสผ่าน (Password)</label>
  
  {/* 🔥 2. สร้างกล่องครอบช่องกรอก (relative) เพื่อให้ปุ่มตาวางซ้อนทับได้ */}
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"} // ถ้ากดปุ่มให้เปลี่ยนเป็นข้อความธรรมดา
      required
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="••••••••"
      className="w-full px-4 py-3.5 bg-[#0B101B] border border-gray-800 rounded-xl text-base outline-none text-white focus:ring-2 focus:ring-[#144EE3] pr-12" 
    />
    
    {/* 🔥 3. ปุ่มกดเปิด/ปิดตา (วางชิดขวา absolute) */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl text-gray-500 hover:text-[#61DAFB] transition-colors cursor-pointer"
    >
      {showPassword ? "🙈" : "👁️"}
    </button>
  </div>
</div>

            <button 
              type="submit" 
              className="w-full bg-[#144EE3] hover:bg-[#1140C7] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#144EE3]/20 transition transform hover:-translate-y-0.5 cursor-pointer text-sm"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* สลับหน้าจอเบื้องหลัง */}
          <div className="mt-8 text-center bg-[#181E29] py-4 rounded-xl border border-gray-800 relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-[#144EE3] rounded-full blur-2xl opacity-20"></div>
            <p className="text-[#C9CED6] text-sm relative z-10">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#EB568E] font-bold hover:text-pink-600 transition-colors cursor-pointer ml-1"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}