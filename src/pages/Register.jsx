import { useState } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { WalletIcon } from "@heroicons/react/24/outline";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/register", { name, email, password });
      localStorage.setItem("token", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.setItem("role", res.data.role);
      if (res.data.name) localStorage.setItem("name", res.data.name);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Registrasi gagal, coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25">
            <WalletIcon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">FinanceApp</h1>
          <p className="text-sm text-surface-500 mt-1">Buat akun baru</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-surface-200 p-6">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">{error}</div>}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Nama Lengkap</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" placeholder="Contoh: Budi Santoso" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" placeholder="email@contoh.com" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" placeholder="••••••" required />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 transition-all">Daftar Akun</button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-surface-500">
              Sudah punya akun? <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Masuk</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
