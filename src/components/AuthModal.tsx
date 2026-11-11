import React, { useState } from 'react';
import { UserProfile, Difficulty } from '../types';
import { translations, Language } from '../utils/i18n';
import {
  loginUser,
  registerUser,
  loginAsGuest,
  AVATAR_OPTIONS,
  DEFAULT_DEMO_USER
} from '../utils/auth';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { playPop, playSuccessChime, playErrorBuzz, triggerCelebration } from '../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  currentUser: UserProfile | null;
  lang?: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  currentUser,
  lang = 'vi',
}) => {
  const t = translations[lang];

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🚀');
  const [targetLevel, setTargetLevel] = useState<Difficulty>('A1');
  const [nativeLanguage, setNativeLanguage] = useState('Vietnamese');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleQuickDemoLogin = () => {
    playPop();
    const result = loginUser(DEFAULT_DEMO_USER.email, DEFAULT_DEMO_USER.password || 'password123');
    if (result.success && result.user) {
      playSuccessChime();
      triggerCelebration();
      onAuthSuccess(result.user);
      onClose();
    }
  };

  const handleGuestLogin = () => {
    playPop();
    const guest = loginAsGuest();
    playSuccessChime();
    onAuthSuccess(guest);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'login') {
      const res = loginUser(email, password);
      if (res.success && res.user) {
        playSuccessChime();
        onAuthSuccess(res.user);
        onClose();
      } else {
        playErrorBuzz();
        setErrorMsg(
          lang === 'vi'
            ? 'Sai tên đăng nhập/email hoặc mật khẩu. Thử dùng: alex@lingualeap.com / password123 hoặc tạo tài khoản mới.'
            : res.error || 'Login failed. Please check your credentials.'
        );
      }
    } else {
      const res = registerUser({
        name,
        email: email.trim() || undefined,
        password,
        avatar: selectedAvatar,
        targetLevel,
        nativeLanguage,
      });

      if (res.success && res.user) {
        playSuccessChime();
        triggerCelebration();
        setSuccessMsg(
          lang === 'vi'
            ? 'Tạo tài khoản thành công! Chào mừng bạn đến với LinguaLeap.'
            : 'Account created successfully! Welcome to LinguaLeap.'
        );
        setTimeout(() => {
          onAuthSuccess(res.user!);
          onClose();
        }, 600);
      } else {
        playErrorBuzz();
        setErrorMsg(res.error || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xl shadow-md shadow-indigo-600/30">
              <span>🚀</span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                {mode === 'login' ? t.authWelcomeBack : t.authJoinTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'login'
                  ? t.authSignInSub
                  : t.authSignUpSub}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playPop();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers: Login vs Register */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50 gap-2">
          <button
            type="button"
            onClick={() => {
              playPop();
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.tabSignIn}
          </button>
          <button
            type="button"
            onClick={() => {
              playPop();
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.tabCreateAccount}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Register-only fields */}
          {mode === 'register' && (
            <>
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.fullNameLabel}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder={lang === 'vi' ? 'ví dụ: Nguyễn Văn A' : 'e.g. Alex Miller'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.avatarLabel}
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        playPop();
                        setSelectedAvatar(emoji);
                      }}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition shrink-0 ${
                        selectedAvatar === emoji
                          ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Email / Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {mode === 'login' ? t.loginIdentifierLabel : t.emailLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={mode === 'login' ? 'text' : 'email'}
                required={mode === 'login'}
                placeholder={
                  mode === 'login'
                    ? lang === 'vi'
                      ? 'ví dụ: Alex Miller hoặc alex@lingualeap.com'
                      : 'e.g. Alex Miller or alex@lingualeap.com'
                    : lang === 'vi'
                    ? 'Không bắt buộc (có thể để trống)'
                    : 'Optional (you can leave blank)'
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {mode === 'register' && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {lang === 'vi'
                  ? '💡 Không bắt buộc: Bạn chỉ cần nhập Họ tên và Mật khẩu để tạo tài khoản.'
                  : '💡 Not required: You can register with just your Name and Password.'}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Register: Target Level & Native Language */}
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  {t.targetLevelLabel}
                </label>
                <select
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value as Difficulty)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="A1">A1 (Mới bắt đầu - Beginner)</option>
                  <option value="A2">A2 (Sơ cấp - Elementary)</option>
                  <option value="B1">B1 (Trung cấp - Intermediate)</option>
                  <option value="B2">B2 (Trung cao cấp - Upper Intermediate)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  {t.supportLangLabel}
                </label>
                <select
                  value={nativeLanguage}
                  onChange={(e) => setNativeLanguage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="Vietnamese">Tiếng Việt</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2"
            >
              <span>{mode === 'login' ? t.btnSubmitSignIn : t.btnSubmitSignUp}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Login Options */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="relative text-center">
              <span className="px-2 text-[11px] font-bold text-slate-400 bg-white dark:bg-slate-900">
                {t.orQuickAccess}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
                title="Đăng nhập nhanh tài khoản học viên mẫu"
              >
                <span>{t.btnDemoLogin}</span>
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
                title="Học thử ngay mà không cần tạo tài khoản"
              >
                <span>{t.btnGuestMode}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
