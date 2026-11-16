import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  LogOut,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Mail,
  Lock,
} from 'lucide-react';
import { GoogleUserProfile } from '../types';
import {
  signInWithGoogleAccount,
  signInWithAppleAccount,
  signInWithMicrosoftAccount,
  signInWithEmailPasswordAccount,
  signOutAccount,
  formatFirebaseAuthError,
  getAuthProviderLabel,
} from '../firebase';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GoogleUserProfile | null;
  onLoginSuccess?: (user: GoogleUserProfile) => void;
  onSignOut?: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignOut,
}) => {
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const isBusy = busyAction !== null;
  const providerLabel = getAuthProviderLabel(currentUser?.providerId);

  const handleProviderLogin = async (provider: 'google' | 'apple' | 'microsoft') => {
    setBusyAction(provider);
    setErrorMsg(null);
    try {
      if (provider === 'google') {
        await signInWithGoogleAccount();
      } else if (provider === 'apple') {
        await signInWithAppleAccount();
      } else {
        await signInWithMicrosoftAccount();
      }
      onClose();
    } catch (err: any) {
      const label =
        provider === 'apple' ? 'Apple' : provider === 'microsoft' ? 'Microsoft' : 'Google';
      setErrorMsg(formatFirebaseAuthError(err, label));
    } finally {
      setBusyAction(null);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setBusyAction('email');
    try {
      await signInWithEmailPasswordAccount(email, password);
      onClose();
    } catch (err: any) {
      setErrorMsg(formatFirebaseAuthError(err, 'E-posta'));
    } finally {
      setBusyAction(null);
    }
  };

  const handleSignOutClick = async () => {
    setBusyAction('signout');
    setErrorMsg(null);
    try {
      await signOutAccount();
      onSignOut?.();
      onClose();
    } catch (_) {
      setErrorMsg('Çıkış yapılırken bir hata oluştu.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative w-full max-w-md bg-white border border-[#E2E4E9] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-[#E2E4E9]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FC4C02]" />
            <h2 className="text-sm font-extrabold text-[#18181B]">Hesap ve Oturum</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717A] hover:text-[#18181B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {currentUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E2E4E9]">
                {currentUser.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#E2E4E9] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#FC4C02] text-white flex items-center justify-center font-black text-lg shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-[#18181B] truncate">{currentUser.name}</h3>
                    <CheckCircle2 className="w-4 h-4 text-[#FC4C02] shrink-0" />
                  </div>
                  <p className="text-xs text-[#71717A] truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 text-[10px] bg-[#FFF4EE] text-[#FC4C02] border border-[#FCD5C3] px-2 py-0.5 rounded font-bold uppercase">
                    {providerLabel} İle Doğrulandı
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#52525B] leading-relaxed">
                Sürüş kayıtlarınız ve kişisel profiliniz yalnızca bu hesaba bağlı olarak saklanır. Farklı bir sağlayıcı ile hesap değiştirebilir veya çıkış yapabilirsiniz.
              </p>

              {/* Quick Switch Providers */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                  Hesap Değiştir
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleProviderLogin('google')}
                    disabled={isBusy}
                    className="py-2 px-2 rounded-lg bg-white hover:bg-[#F4F5F7] text-[#18181B] border border-[#E2E4E9] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {busyAction === 'google' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FC4C02]" />
                    ) : (
                      <span>Google</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProviderLogin('apple')}
                    disabled={isBusy}
                    className="py-2 px-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {busyAction === 'apple' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <span>Apple</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProviderLogin('microsoft')}
                    disabled={isBusy}
                    className="py-2 px-2 rounded-lg bg-white hover:bg-[#F4F5F7] text-[#18181B] border border-[#E2E4E9] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {busyAction === 'microsoft' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FC4C02]" />
                    ) : (
                      <span>Microsoft</span>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOutClick}
                disabled={isBusy}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 border border-[#E2E4E9] transition cursor-pointer disabled:opacity-50"
              >
                {busyAction === 'signout' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span>Oturumu Kapat</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-[#18181B]">
                  Hesabınla Oturum Aç
                </h3>
                <p className="text-xs text-[#71717A]">
                  Google, Apple, Microsoft veya e-posta ve şifre ile giriş yapın.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleProviderLogin('google')}
                  disabled={isBusy}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#F4F5F7] disabled:opacity-60 text-[#18181B] border border-[#E2E4E9] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {busyAction === 'google' && <Loader2 className="w-4 h-4 animate-spin text-[#FC4C02]" />}
                  <span>Google ile Devam Et</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderLogin('apple')}
                  disabled={isBusy}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#18181B] hover:bg-[#27272A] disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {busyAction === 'apple' && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Apple ile Giriş Yap</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderLogin('microsoft')}
                  disabled={isBusy}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#F4F5F7] disabled:opacity-60 text-[#18181B] border border-[#E2E4E9] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {busyAction === 'microsoft' && <Loader2 className="w-4 h-4 animate-spin text-[#FC4C02]" />}
                  <span>Microsoft ile Giriş Yap</span>
                </button>
              </div>

              {!showEmailForm ? (
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full py-2 text-xs font-bold text-[#FC4C02] hover:text-[#E34402] transition cursor-pointer"
                >
                  E-posta ve şifre ile giriş yap
                </button>
              ) : (
                <form onSubmit={handleEmailLogin} className="space-y-2.5 pt-2 border-t border-[#E2E4E9]">
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="E-posta adresi"
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#E2E4E9] text-xs text-[#18181B] focus:outline-none focus:border-[#FC4C02]"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Şifre"
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#E2E4E9] text-xs text-[#18181B] focus:outline-none focus:border-[#FC4C02]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full py-2.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {busyAction === 'email' && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>E-posta ile Giriş Yap</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
