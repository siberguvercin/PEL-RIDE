import React, { useState } from 'react';
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithGoogleAccount,
  signInWithAppleAccount,
  signInWithMicrosoftAccount,
  signInWithEmailPasswordAccount,
  registerWithEmailPasswordAccount,
  sendPasswordResetForEmail,
  resendVerificationEmailForCurrentUser,
  reloadCurrentAuthUser,
  signOutAccount,
  formatFirebaseAuthError,
} from '../firebase';

interface AuthGateProps {
  isLoading?: boolean;
  unverifiedUser?: FirebaseUser | null;
  onVerificationConfirmed?: (user: FirebaseUser) => void;
}

type EmailMode = 'signin' | 'register';
type BusyAction =
  | null
  | 'email'
  | 'google'
  | 'apple'
  | 'microsoft'
  | 'reset'
  | 'resend'
  | 'verify-check'
  | 'signout';

export const AuthGate: React.FC<AuthGateProps> = ({
  isLoading = false,
  unverifiedUser = null,
  onVerificationConfirmed,
}) => {
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const isBusy = busyAction !== null;

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'microsoft') => {
    setBusyAction(provider);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      if (provider === 'google') {
        await signInWithGoogleAccount();
      } else if (provider === 'apple') {
        await signInWithAppleAccount();
      } else {
        await signInWithMicrosoftAccount();
      }
    } catch (err: any) {
      const label =
        provider === 'apple' ? 'Apple' : provider === 'microsoft' ? 'Microsoft' : 'Google';
      setErrorMsg(formatFirebaseAuthError(err, label));
    } finally {
      setBusyAction(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (emailMode === 'register' && !displayName.trim()) {
      setErrorMsg('Kayıt olmak için ad soyad girin.');
      return;
    }

    setBusyAction('email');
    try {
      if (emailMode === 'register') {
        await registerWithEmailPasswordAccount(trimmedEmail, password, displayName);
        setInfoMsg('Hesabınız oluşturuldu ve doğrulama bağlantısı e-posta adresinize gönderildi.');
      } else {
        await signInWithEmailPasswordAccount(trimmedEmail, password);
      }
    } catch (err: any) {
      setErrorMsg(formatFirebaseAuthError(err, 'E-posta'));
    } finally {
      setBusyAction(null);
    }
  };

  const handlePasswordReset = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Şifre sıfırlama bağlantısı için önce e-posta adresinizi yazın.');
      return;
    }
    setBusyAction('reset');
    try {
      await sendPasswordResetForEmail(trimmedEmail);
      setInfoMsg(`${trimmedEmail} adresine şifre sıfırlama bağlantısı gönderildi.`);
    } catch (err: any) {
      setErrorMsg(formatFirebaseAuthError(err, 'E-posta'));
    } finally {
      setBusyAction(null);
    }
  };

  const handleResendVerification = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setBusyAction('resend');
    try {
      await resendVerificationEmailForCurrentUser();
      setInfoMsg('Doğrulama bağlantısı tekrar gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.');
    } catch (err: any) {
      setErrorMsg(formatFirebaseAuthError(err, 'E-posta'));
    } finally {
      setBusyAction(null);
    }
  };

  const handleCheckVerification = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setBusyAction('verify-check');
    try {
      const refreshed = await reloadCurrentAuthUser();
      if (refreshed && refreshed.emailVerified) {
        onVerificationConfirmed?.(refreshed);
      } else {
        setErrorMsg('E-posta adresi henüz doğrulanmamış görünüyor. E-postadaki bağlantıya tıkladıktan sonra tekrar deneyin.');
      }
    } catch (err: any) {
      setErrorMsg(formatFirebaseAuthError(err, 'E-posta'));
    } finally {
      setBusyAction(null);
    }
  };

  const handleSignOutUnverified = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setBusyAction('signout');
    try {
      await signOutAccount();
    } catch (_) {
      setErrorMsg('Çıkış yapılırken bir hata oluştu.');
    } finally {
      setBusyAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F4F5F7] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-xl bg-[#FC4C02] text-white flex items-center justify-center font-extrabold text-xl mb-4">
          P
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#52525B]">
          <Loader2 className="w-4 h-4 animate-spin text-[#FC4C02]" />
          <span>Oturum kontrol ediliyor...</span>
        </div>
      </div>
    );
  }

  if (unverifiedUser) {
    return (
      <div className="min-h-screen w-full bg-[#F4F5F7] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white border border-[#E2E4E9] rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FC4C02] flex items-center justify-center font-extrabold text-white text-lg">
              P
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-[#18181B]">PEL</span>
              <p className="text-xs text-[#71717A] font-medium">E-posta Doğrulaması</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-lg font-extrabold text-[#18181B] tracking-tight">
              E-posta Adresini Doğrula
            </h1>
            <p className="text-sm text-[#52525B] leading-relaxed">
              Güvenli sürüş kaydı ve bulut senkronizasyonu için{' '}
              <strong className="text-[#18181B]">{unverifiedUser.email || 'hesabınıza'}</strong>{' '}
              gönderilen doğrulama bağlantısına tıklayın.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleCheckVerification}
              disabled={isBusy}
              className="w-full py-3 px-4 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {busyAction === 'verify-check' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Doğruladım, Devam Et</span>
            </button>

            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isBusy}
              className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-[#F4F5F7] disabled:opacity-60 text-[#18181B] border border-[#E2E4E9] font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {busyAction === 'resend' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Doğrulama E-postasını Tekrar Gönder</span>
            </button>

            <button
              type="button"
              onClick={handleSignOutUnverified}
              disabled={isBusy}
              className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-[#F4F5F7] disabled:opacity-60 text-[#71717A] hover:text-[#18181B] font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Farklı Hesapla Giriş Yap</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F4F5F7] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-md bg-white border border-[#E2E4E9] rounded-xl p-6 sm:p-8 space-y-5 my-auto">
        {/* Brand */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FC4C02] flex items-center justify-center font-extrabold text-white text-lg">
              P
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-[#18181B]">PEL</span>
              <p className="text-xs text-[#71717A] font-medium">GPS Sürüş, Rotalar ve Bisiklet Kulübü</p>
            </div>
          </div>
        </div>

        {/* Mode Switcher: Sign In / Register */}
        <div className="grid grid-cols-2 p-1 rounded-lg bg-[#F4F5F7] border border-[#E2E4E9]">
          <button
            type="button"
            onClick={() => {
              setEmailMode('signin');
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`py-2 rounded-md text-xs font-bold transition cursor-pointer ${
              emailMode === 'signin'
                ? 'bg-white text-[#18181B] border border-[#E2E4E9] shadow-xs'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => {
              setEmailMode('register');
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`py-2 rounded-md text-xs font-bold transition cursor-pointer ${
              emailMode === 'register'
                ? 'bg-white text-[#18181B] border border-[#E2E4E9] shadow-xs'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {emailMode === 'register' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#52525B] mb-1">
                Ad Soyad
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Örn. Kaya Telli"
                  autoComplete="name"
                  disabled={isBusy}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-[#E2E4E9] text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#FC4C02]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#52525B] mb-1">
              E-posta
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@eposta.com"
                autoComplete="email"
                disabled={isBusy}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-[#E2E4E9] text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#FC4C02]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#52525B]">
                Şifre
              </label>
              {emailMode === 'signin' && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isBusy}
                  className="text-[11px] font-semibold text-[#FC4C02] hover:text-[#E34402] cursor-pointer disabled:opacity-50"
                >
                  {busyAction === 'reset' ? 'Gönderiliyor...' : 'Şifremi Unuttum'}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                autoComplete={emailMode === 'register' ? 'new-password' : 'current-password'}
                disabled={isBusy}
                className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-white border border-[#E2E4E9] text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#FC4C02]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#71717A] hover:text-[#18181B] cursor-pointer"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full py-2.5 px-4 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {busyAction === 'email' && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {emailMode === 'register' ? 'E-posta ile Hesap Oluştur' : 'E-posta ile Giriş Yap'}
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center py-0.5">
          <div className="flex-grow border-t border-[#E2E4E9]" />
          <span className="shrink mx-3 text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
            veya
          </span>
          <div className="flex-grow border-t border-[#E2E4E9]" />
        </div>

        {/* Social Providers: Google, Apple, Microsoft */}
        <div className="space-y-2.5">
          {/* Google */}
          <button
            type="button"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isBusy}
            className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-[#F8F9FA] disabled:opacity-60 text-[#18181B] border border-[#E2E4E9] font-bold text-sm flex items-center justify-center gap-3 transition cursor-pointer"
          >
            {busyAction === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#FC4C02]" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{busyAction === 'google' ? 'Google Açılıyor...' : 'Google ile Devam Et'}</span>
          </button>

          {/* Apple */}
          <button
            type="button"
            onClick={() => handleOAuthSignIn('apple')}
            disabled={isBusy}
            className="w-full py-2.5 px-4 rounded-lg bg-[#18181B] hover:bg-[#27272A] disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-3 transition cursor-pointer"
          >
            {busyAction === 'apple' ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            )}
            <span>{busyAction === 'apple' ? 'Apple Açılıyor...' : 'Apple ile Giriş Yap'}</span>
          </button>

          {/* Microsoft */}
          <button
            type="button"
            onClick={() => handleOAuthSignIn('microsoft')}
            disabled={isBusy}
            className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-[#F8F9FA] disabled:opacity-60 text-[#18181B] border border-[#E2E4E9] font-bold text-sm flex items-center justify-center gap-3 transition cursor-pointer"
          >
            {busyAction === 'microsoft' ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#FC4C02]" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
                <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
                <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
                <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
              </svg>
            )}
            <span>
              {busyAction === 'microsoft' ? 'Microsoft Açılıyor...' : 'Microsoft ile Giriş Yap'}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-[#71717A] font-medium pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Güvenli kimlik doğrulama</span>
        </div>
      </div>
    </div>
  );
};
