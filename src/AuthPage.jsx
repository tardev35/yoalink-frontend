/* frontend/src/AuthPage.jsx */
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(`http://localhost:5000${endpoint}`, {
        username,
        password
      });

      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        // 👉 Popup ล็อกอินสำเร็จ (สีน้ำเงินแบรนด์)
        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ!',
          showConfirmButton: false,
          timer: 1500,
          confirmButtonColor: '#144EE3' // น้ำเงินแบรนด์
        }).then(() => {
          navigate('/dashboard'); 
        });

      } else {
        // 👉 Popup สมัครสมาชิกสำเร็จ (สีน้ำเงินแบรนด์)
        Swal.fire({
          icon: 'success',
          title: 'สมัครสมาชิกสำเร็จ!',
          text: 'กรุณาเข้าสู่ระบบด้วยบัญชีใหม่ของคุณ',
          confirmButtonColor: '#144EE3' // น้ำเงินแบรนด์
        });
        setIsLogin(true); 
        setPassword(''); 
      }
    } catch (error) {
      // 👉 Popup แจ้งเตือน Error (สีน้ำเงินแบรนด์)
      Swal.fire({
        icon: 'error',
        title: 'อ๊ะ! มีบางอย่างผิดพลาด',
        text: error.response?.data?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
        confirmButtonColor: '#144EE3' // น้ำเงินแบรนด์
      });
    }
  };

  return (
    // 👉 ปรับพื้นหลังดำ (#0B101B) ตาม REF
    <div className="min-h-screen bg-[#0B101B] flex items-center justify-center p-4">
      
      {/* 🟢 กล่อง Card หลัก - 👉 ปรับการ์ดดำ (#181E29) ลบขอบตาม REF */}
      <div className="max-w-md w-full bg-[#181E29] rounded-3xl shadow-xl border border-gray-700 overflow-hidden">
        
        {/* ส่วนหัว - 👉 ปรับส่วนหัวให้สีชมพู (#EB568E) หรือน้ำเงิน (#144EE3) ตาม REF */}
        <div className="bg-[#181E29] p-8 text-center border-b border-gray-700">
          {/* 👉 แสดงชื่อระบบ Yoalink.com และชื่อ ย่อลิงค์ */}
          <h2 className="text-3xl font-black tracking-tight flex flex-col gap-1">
            <span className="text-[#61DAFB]">Yoalink.com</span>
            <span className="text-sm font-medium text-[#C9CED6]">ย่อลิงค์</span>
          </h2>
          <p className="text-[#C9CED6] mt-3 text-sm font-medium">
            URL Shortener System for Professional Teams
          </p>
        </div>

        {/* ส่วนฟอร์ม */}
        <div className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-[#C9CED6] mb-2">Username</label>
              {/* 👉 ปรับอินพุตพื้นหลังดำ (#0B101B) ตาม REF */}
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
                className="w-full px-5 py-4 bg-[#0B101B] border border-gray-700 rounded-xl text-[#C9CED6] focus:outline-none focus:ring-2 focus:ring-[#144EE3] focus:bg-[#181E29] transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#C9CED6] mb-2">Password</label>
              {/* 👉 ปรับอินพุตพื้นหลังดำ (#0B101B) ตาม REF */}
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-[#0B101B] border border-gray-700 rounded-xl text-[#C9CED6] focus:outline-none focus:ring-2 focus:ring-[#144EE3] focus:bg-[#181E29] transition-all duration-200"
              />
            </div>

            {/* 👉 เปลี่ยนปุ่มเป็นสีน้ำเงิน (#144EE3) + แสงเรืองแสงตาม REF */}
            <button 
              type="submit" 
              className="w-full bg-[#144EE3] hover:bg-[#1140C7] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#144EE3]/20 transition transform hover:-translate-y-0.5"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* สลับหน้า Login / Register */}
          <div className="mt-8 text-center bg-[#181E29] py-4 rounded-xl border border-gray-700 relative overflow-hidden">
            {/* 👉 แสงเรืองแสงสีน้ำเงินที่มุมตาม REF */}
            <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-[#144EE3] rounded-full blur-2xl opacity-20"></div>
            
            <p className="text-[#C9CED6] text-sm relative z-10">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              {/* 👉 เปลี่ยนปุ่มสลับเป็นสีชมพู (#EB568E) หรือน้ำเงิน (#144EE3) ตาม REF */}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#EB568E] font-bold hover:text-pink-600 transition-colors"
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