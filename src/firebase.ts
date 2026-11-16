import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  limit,
  serverTimestamp,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  SavedRide,
  RideSportType,
  ChatMessage,
  LeaderboardRider,
  LeagueTier,
  PersistedUserBadge,
  EvaluatedBadge,
} from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface FirestoreUserProfileDoc {
  uid: string;
  displayName: string;
  photoUrl: string;
  bio: string;
  ftpWatts: number;
  weightKg: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PublicProfileDoc {
  uid: string;
  displayName: string;
  photoUrl: string;
  bio: string;
  ftpWatts: number;
  totalDistanceKm: number;
  totalClimbM: number;
  ridesCount: number;
  points: number;
  tier: string;
  divisionName: string;
  isPublic: boolean;
  isOnline: boolean;
  updatedAtMs?: number;
}

export interface DmThreadSummary {
  id: string;
  participantIds: string[];
  lastMessageText: string;
  lastSenderId: string;
  lastTimestamp: number;
}

const VALID_SPORT_TYPES: RideSportType[] = ['road', 'gravel', 'mtb', 'city', 'ebike'];
const VALID_LEAGUE_TIERS: LeagueTier[] = [
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Champion',
  'Unreal',
];

function clampStr(value: string, maxLen: number, fallback = ''): string {
  const trimmed = (value || fallback).trim();
  return trimmed.slice(0, maxLen);
}

function clampNum(value: number, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function sanitizeId(rawId: string): string {
  const cleaned = (rawId || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || `id-${Date.now()}`;
}

export function getDeterministicDmId(uidA: string, uidB: string): string {
  const pair = [sanitizeId(uidA), sanitizeId(uidB)].sort();
  return sanitizeId(`dm_${pair[0]}__${pair[1]}`);
}

function downsamplePoints(points: SavedRide['points'] = []): { lat: number; lng: number }[] {
  if (!Array.isArray(points) || points.length === 0) return [];
  const maxPoints = 300;
  const step = Math.max(1, Math.ceil(points.length / maxPoints));
  const result: { lat: number; lng: number }[] = [];
  for (let i = 0; i < points.length && result.length < maxPoints; i += step) {
    const pt = points[i];
    if (pt && typeof pt.lat === 'number' && typeof pt.lng === 'number') {
      result.push({ lat: Number(pt.lat.toFixed(6)), lng: Number(pt.lng.toFixed(6)) });
    }
  }
  return result;
}

export async function signInWithGoogleAccount() {
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithAppleAccount() {
  return signInWithPopup(auth, appleProvider);
}

export async function signInWithMicrosoftAccount() {
  return signInWithPopup(auth, microsoftProvider);
}

export async function signInWithEmailPasswordAccount(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function registerWithEmailPasswordAccount(
  email: string,
  password: string,
  displayName?: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const cleanName = (displayName || '').trim().slice(0, 80);
  if (cleanName) {
    try {
      await updateProfile(cred.user, { displayName: cleanName });
    } catch (_) {
      // Non-blocking if profile displayName update fails right after signup
    }
  }
  try {
    await sendEmailVerification(cred.user);
  } catch (_) {
    // User can resend verification link from the verification screen
  }
  return cred;
}

export async function resendVerificationEmailForCurrentUser() {
  if (!auth.currentUser) {
    throw new Error('Aktif kullanıcı oturumu bulunamadı.');
  }
  await sendEmailVerification(auth.currentUser);
}

export async function reloadCurrentAuthUser(): Promise<FirebaseUser | null> {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  if (auth.currentUser.emailVerified) {
    await auth.currentUser.getIdToken(true);
  }
  return auth.currentUser;
}

export async function sendPasswordResetForEmail(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

export function getAuthProviderLabel(providerId?: string): string {
  switch (providerId) {
    case 'apple.com':
      return 'Apple';
    case 'microsoft.com':
      return 'Microsoft';
    case 'password':
      return 'E-posta';
    case 'google.com':
    default:
      return 'Google';
  }
}

export function formatFirebaseAuthError(err: any, providerLabel = 'Hesap'): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Giriş penceresi kapatıldı. Devam etmek için tekrar deneyin.';
    case 'auth/popup-blocked':
      return 'Tarayıcı açılır pencereyi engelledi. Lütfen pop-up izni verip tekrar deneyin.';
    case 'auth/cancelled-popup-request':
      return 'Önceki giriş penceresi iptal edildi. Lütfen tekrar deneyin.';
    case 'auth/operation-not-allowed':
      return `${providerLabel} girişi Firebase Console üzerinde henüz etkinleştirilmemiş (Authentication → Sign-in method).`;
    case 'auth/account-exists-with-different-credential':
      return 'Bu e-posta adresi farklı bir giriş yöntemiyle zaten kayıtlı. Lütfen daha önce kullandığınız sağlayıcı ile giriş yapın.';
    case 'auth/invalid-email':
      return 'Geçerli bir e-posta adresi girin.';
    case 'auth/user-disabled':
      return 'Bu hesap yönetici tarafından devre dışı bırakılmış.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-posta adresi veya şifre hatalı.';
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi ile zaten bir hesap kayıtlı. Giriş yapmayı deneyin.';
    case 'auth/weak-password':
      return 'Şifreniz en az 6 karakter uzunluğunda olmalıdır.';
    case 'auth/too-many-requests':
      return 'Çok fazla başarısız deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin.';
    case 'auth/network-request-failed':
      return 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.';
    case 'auth/unauthorized-domain':
      return 'Bu alan adı Firebase yetkili alan adları listesinde yer almıyor.';
    default:
      return `${providerLabel} ile oturum açılırken bir hata oluştu. Lütfen tekrar deneyin.`;
  }
}

export async function signOutAccount() {
  return firebaseSignOut(auth);
}

export async function ensureUserAccountDocs(
  firebaseUser: FirebaseUser,
  overrides?: { displayName?: string; bio?: string; ftpWatts?: number; weightKg?: number }
): Promise<FirestoreUserProfileDoc> {
  const uid = sanitizeId(firebaseUser.uid);
  const fallbackName =
    firebaseUser.displayName?.trim() ||
    firebaseUser.email?.split('@')[0] ||
    'Bisikletçi';

  if (!firebaseUser.emailVerified) {
    return {
      uid,
      displayName: clampStr(overrides?.displayName ?? fallbackName, 80, fallbackName),
      photoUrl: clampStr(firebaseUser.photoURL || '', 512),
      bio: clampStr(overrides?.bio ?? 'Yol · Gravel · Dağ Bisikleti', 240),
      ftpWatts: clampNum(overrides?.ftpWatts ?? 220, 50, 800, 220),
      weightKg: clampNum(overrides?.weightKg ?? 72, 30, 250, 72),
    };
  }

  const profilePath = `users/${uid}`;
  const privatePath = `users/${uid}/private/info`;
  const profileRef = doc(db, 'users', uid);
  const privateRef = doc(db, 'users', uid, 'private', 'info');

  let existingSnap;
  try {
    existingSnap = await getDoc(profileRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, profilePath);
  }

  if (existingSnap.exists()) {
    const current = existingSnap.data() as FirestoreUserProfileDoc;
    const nextDisplayName = clampStr(
      overrides?.displayName ?? current.displayName ?? fallbackName,
      80,
      fallbackName
    );
    const nextBio = clampStr(overrides?.bio ?? current.bio ?? 'Yol · Gravel · Dağ Bisikleti', 240);
    const nextFtp = clampNum(overrides?.ftpWatts ?? current.ftpWatts ?? 220, 50, 800, 220);
    const nextWeight = clampNum(overrides?.weightKg ?? current.weightKg ?? 72, 30, 250, 72);
    const nextPhoto = clampStr(firebaseUser.photoURL ?? current.photoUrl ?? '', 512);

    if (overrides) {
      try {
        await updateDoc(profileRef, {
          displayName: nextDisplayName,
          photoUrl: nextPhoto,
          bio: nextBio,
          ftpWatts: nextFtp,
          weightKg: nextWeight,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, profilePath);
      }
    }

    return {
      uid,
      displayName: nextDisplayName,
      photoUrl: nextPhoto,
      bio: nextBio,
      ftpWatts: nextFtp,
      weightKg: nextWeight,
    };
  }

  const newProfile = {
    uid,
    displayName: clampStr(overrides?.displayName ?? fallbackName, 80, fallbackName),
    photoUrl: clampStr(firebaseUser.photoURL || '', 512),
    bio: clampStr(overrides?.bio ?? 'Yol · Gravel · Dağ Bisikleti', 240),
    ftpWatts: clampNum(overrides?.ftpWatts ?? 220, 50, 800, 220),
    weightKg: clampNum(overrides?.weightKg ?? 72, 30, 250, 72),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(profileRef, newProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, profilePath);
  }

  if (firebaseUser.email) {
    try {
      await setDoc(privateRef, {
        uid,
        email: clampStr(firebaseUser.email, 160),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, privatePath);
    }
  }

  return {
    uid,
    displayName: newProfile.displayName,
    photoUrl: newProfile.photoUrl,
    bio: newProfile.bio,
    ftpWatts: newProfile.ftpWatts,
    weightKg: newProfile.weightKg,
  };
}

export async function syncPublicProfile(
  firebaseUser: FirebaseUser,
  stats: {
    displayName: string;
    photoUrl: string;
    bio: string;
    ftpWatts: number;
    totalDistanceKm: number;
    totalClimbM: number;
    ridesCount: number;
    points: number;
    tier: string;
    divisionName: string;
    isOnline?: boolean;
  }
): Promise<void> {
  if (!firebaseUser.emailVerified) return;
  const uid = sanitizeId(firebaseUser.uid);
  const path = `publicProfiles/${uid}`;
  const ref = doc(db, 'publicProfiles', uid);

  const payload = {
    uid,
    displayName: clampStr(stats.displayName, 80, 'Bisikletçi'),
    photoUrl: clampStr(stats.photoUrl || '', 512),
    bio: clampStr(stats.bio || '', 240),
    ftpWatts: clampNum(stats.ftpWatts, 50, 800, 220),
    totalDistanceKm: clampNum(stats.totalDistanceKm, 0, 200000, 0),
    totalClimbM: clampNum(stats.totalClimbM, 0, 2000000, 0),
    ridesCount: clampNum(stats.ridesCount, 0, 50000, 0),
    points: clampNum(stats.points, 0, 1000000, 0),
    tier: clampStr(stats.tier, 40, 'Bronze'),
    divisionName: clampStr(stats.divisionName, 60, 'Bronz I'),
    isPublic: true,
    isOnline: Boolean(stats.isOnline ?? true),
    updatedAt: serverTimestamp(),
  };

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  try {
    if (existingSnap.exists()) {
      const { uid: _omit, ...updatePayload } = payload;
      await updateDoc(ref, updatePayload);
    } else {
      await setDoc(ref, payload);
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingSnap.exists() ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export function subscribePublicProfiles(
  onUpdate: (profiles: PublicProfileDoc[], leaderboard: LeaderboardRider[]) => void
): Unsubscribe {
  const path = 'publicProfiles';
  const q = query(collection(db, 'publicProfiles'), where('isPublic', '==', true), limit(100));
  return onSnapshot(
    q,
    (snapshot) => {
      const profiles: PublicProfileDoc[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: String(data.uid || d.id),
          displayName: String(data.displayName || 'Bisikletçi'),
          photoUrl: String(data.photoUrl || ''),
          bio: String(data.bio || ''),
          ftpWatts: Number(data.ftpWatts || 220),
          totalDistanceKm: Number(data.totalDistanceKm || 0),
          totalClimbM: Number(data.totalClimbM || 0),
          ridesCount: Number(data.ridesCount || 0),
          points: Number(data.points || 0),
          tier: String(data.tier || 'Bronze'),
          divisionName: String(data.divisionName || 'Bronz I'),
          isPublic: Boolean(data.isPublic),
          isOnline: Boolean(data.isOnline),
          updatedAtMs: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : undefined,
        };
      });

      const leaderboard: LeaderboardRider[] = [...profiles]
        .sort((a, b) => b.points - a.points)
        .map((p, idx) => {
          const validTier: LeagueTier = VALID_LEAGUE_TIERS.includes(p.tier as LeagueTier)
            ? (p.tier as LeagueTier)
            : 'Bronze';
          return {
            rank: idx + 1,
            id: p.uid,
            name: p.displayName,
            avatar: p.photoUrl || undefined,
            tier: validTier,
            divisionName: p.divisionName,
            points: p.points,
            totalDistanceKm: p.totalDistanceKm,
            totalClimbM: p.totalClimbM,
            ftpWatts: p.ftpWatts,
            wattsPerKg: Number((p.ftpWatts / 72).toFixed(2)),
            ridesCount: p.ridesCount,
            isOnline: p.isOnline,
            isLive: false,
          };
        });

      onUpdate(profiles, leaderboard);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribePublicMessages(
  roomId: string,
  onUpdate: (messages: ChatMessage[]) => void
): Unsubscribe {
  const cleanRoom = sanitizeId(roomId || 'global');
  const path = 'publicMessages';
  const q = query(
    collection(db, 'publicMessages'),
    where('isPublic', '==', true),
    where('roomId', '==', cleanRoom),
    limit(150)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          const mediaTypeRaw = data.mediaType;
          const mediaType: 'image' | 'video' | undefined =
            mediaTypeRaw === 'image' || mediaTypeRaw === 'video' ? mediaTypeRaw : undefined;
          return {
            id: String(data.id || d.id),
            roomId: String(data.roomId || cleanRoom),
            userId: String(data.userId || ''),
            userName: String(data.userName || 'Bisikletçi'),
            userAvatar: data.userAvatar ? String(data.userAvatar) : undefined,
            isPrivate: false,
            text: String(data.text || ''),
            mediaUrl: data.mediaUrl ? String(data.mediaUrl) : undefined,
            mediaType,
            type:
              data.msgType === 'alert' ||
              data.msgType === 'route_share' ||
              data.msgType === 'system'
                ? data.msgType
                : 'chat',
            timestamp: Number(data.clientTimestamp || Date.now()),
          };
        })
        .sort((a, b) => a.timestamp - b.timestamp);
      onUpdate(msgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function persistPublicMessage(
  firebaseUser: FirebaseUser,
  msg: {
    id: string;
    roomId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    msgType?: 'chat' | 'alert' | 'route_share' | 'system';
    timestamp?: number;
  }
): Promise<void> {
  if (!firebaseUser.emailVerified) return;
  const uid = sanitizeId(firebaseUser.uid);
  const msgId = sanitizeId(msg.id || `msg-${Date.now()}`);
  const cleanRoom = sanitizeId(msg.roomId || 'global');
  const path = `publicMessages/${msgId}`;
  const mediaUrl = clampStr(msg.mediaUrl || '', 450000);
  const mediaType =
    msg.mediaType === 'image' || msg.mediaType === 'video' ? msg.mediaType : 'none';

  const payload = {
    id: msgId,
    roomId: cleanRoom.slice(0, 80),
    userId: uid,
    userName: clampStr(msg.userName || firebaseUser.displayName || 'Bisikletçi', 80, 'Bisikletçi'),
    userAvatar: clampStr(msg.userAvatar || firebaseUser.photoURL || '', 512),
    text: clampStr(msg.text || '', 2000),
    mediaUrl,
    mediaType,
    msgType: msg.msgType || 'chat',
    isPublic: true,
    clientTimestamp: Number(msg.timestamp || Date.now()),
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'publicMessages', msgId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeDmThreads(
  myUid: string,
  onUpdate: (threads: DmThreadSummary[]) => void
): Unsubscribe {
  const cleanUid = sanitizeId(myUid);
  const path = 'dmThreads';
  const q = query(
    collection(db, 'dmThreads'),
    where('participantIds', 'array-contains', cleanUid),
    limit(80)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const threads: DmThreadSummary[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            participantIds: Array.isArray(data.participantIds) ? data.participantIds : [],
            lastMessageText: String(data.lastMessageText || ''),
            lastSenderId: String(data.lastSenderId || ''),
            lastTimestamp: Number(data.lastTimestamp || 0),
          };
        })
        .sort((a, b) => b.lastTimestamp - a.lastTimestamp);
      onUpdate(threads);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeDmMessages(
  dmRoomId: string,
  myUid: string,
  onUpdate: (messages: ChatMessage[]) => void
): Unsubscribe {
  const cleanDmId = sanitizeId(dmRoomId);
  const cleanUid = sanitizeId(myUid);
  const path = `dmThreads/${cleanDmId}/messages`;
  const q = query(
    collection(db, 'dmThreads', cleanDmId, 'messages'),
    where('participantIds', 'array-contains', cleanUid),
    limit(200)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          const mediaTypeRaw = data.mediaType;
          const mediaType: 'image' | 'video' | undefined =
            mediaTypeRaw === 'image' || mediaTypeRaw === 'video' ? mediaTypeRaw : undefined;
          return {
            id: String(data.id || d.id),
            roomId: String(data.dmRoomId || cleanDmId),
            userId: String(data.userId || ''),
            userName: String(data.userName || 'Sporcu'),
            userAvatar: data.userAvatar ? String(data.userAvatar) : undefined,
            recipientId: String(data.recipientId || ''),
            recipientName: String(data.recipientName || ''),
            isPrivate: true,
            text: String(data.text || ''),
            mediaUrl: data.mediaUrl ? String(data.mediaUrl) : undefined,
            mediaType,
            type: 'chat' as const,
            timestamp: Number(data.clientTimestamp || Date.now()),
          };
        })
        .sort((a, b) => a.timestamp - b.timestamp);
      onUpdate(msgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function persistDmMessage(
  firebaseUser: FirebaseUser,
  recipient: { id: string; name: string },
  msg: {
    id: string;
    text: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    timestamp?: number;
  }
): Promise<string> {
  const cleanUid = sanitizeId(firebaseUser.uid);
  const cleanRecipientId = sanitizeId(recipient.id);
  const dmRoomId = getDeterministicDmId(cleanUid, cleanRecipientId);
  if (!firebaseUser.emailVerified || cleanUid === cleanRecipientId) {
    return dmRoomId;
  }

  const participantIds = [cleanUid, cleanRecipientId].sort();
  const ts = Number(msg.timestamp || Date.now());
  const preview = clampStr(msg.text || (msg.mediaType ? '📷 Fotoğraf' : ''), 300);

  const threadPath = `dmThreads/${dmRoomId}`;
  const threadRef = doc(db, 'dmThreads', dmRoomId);

  try {
    const threadSnap = await getDoc(threadRef);
    if (threadSnap.exists()) {
      await updateDoc(threadRef, {
        lastMessageText: preview,
        lastSenderId: cleanUid,
        lastTimestamp: ts,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(threadRef, {
        id: dmRoomId,
        participantIds,
        lastMessageText: preview,
        lastSenderId: cleanUid,
        lastTimestamp: ts,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, threadPath);
  }

  const msgId = sanitizeId(msg.id || `dm-${Date.now()}`);
  const msgPath = `dmThreads/${dmRoomId}/messages/${msgId}`;
  const msgRef = doc(db, 'dmThreads', dmRoomId, 'messages', msgId);
  const mediaUrl = clampStr(msg.mediaUrl || '', 450000);
  const mediaType =
    msg.mediaType === 'image' || msg.mediaType === 'video' ? msg.mediaType : 'none';

  try {
    await setDoc(msgRef, {
      id: msgId,
      dmRoomId,
      participantIds,
      userId: cleanUid,
      userName: clampStr(firebaseUser.displayName || 'Bisikletçi', 80, 'Bisikletçi'),
      userAvatar: clampStr(firebaseUser.photoURL || '', 512),
      recipientId: cleanRecipientId,
      recipientName: clampStr(recipient.name || 'Sporcu', 80, 'Sporcu'),
      text: clampStr(msg.text || '', 2000),
      mediaUrl,
      mediaType,
      clientTimestamp: ts,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, msgPath);
  }

  return dmRoomId;
}

export async function fetchUserRides(uid: string): Promise<SavedRide[]> {
  const cleanUid = sanitizeId(uid);
  const path = `users/${cleanUid}/rides`;
  try {
    const q = query(collection(db, 'users', cleanUid, 'rides'), where('userId', '==', cleanUid));
    const snap = await getDocs(q);
    const list: SavedRide[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id || d.id),
        title: String(data.title || 'GPS Sürüşü'),
        date: String(data.date || new Date().toISOString()),
        sportType: VALID_SPORT_TYPES.includes(data.sportType) ? data.sportType : 'road',
        distanceKm: Number(data.distanceKm || 0),
        durationSec: Number(data.durationSec || 0),
        movingTimeSec: Number(data.movingTimeSec || data.durationSec || 0),
        avgSpeedKmH: Number(data.avgSpeedKmH || 0),
        maxSpeedKmH: Number(data.maxSpeedKmH || 0),
        climbM: Number(data.climbM || 0),
        descentM: Number(data.descentM || 0),
        effort: Number(data.effort || 5),
        notes: String(data.notes || ''),
        points: Array.isArray(data.points) ? data.points : [],
      };
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function persistUserRide(firebaseUser: FirebaseUser, ride: SavedRide): Promise<void> {
  const cleanUid = sanitizeId(firebaseUser.uid);
  const rideId = sanitizeId(ride.id || `ride-${Date.now()}`);
  const path = `users/${cleanUid}/rides/${rideId}`;

  await ensureUserAccountDocs(firebaseUser);

  const sportType: RideSportType =
    ride.sportType && VALID_SPORT_TYPES.includes(ride.sportType) ? ride.sportType : 'road';

  const payload = {
    id: rideId,
    userId: cleanUid,
    title: clampStr(ride.title, 120, 'GPS Sürüşü'),
    date: clampStr(ride.date || new Date().toISOString(), 40),
    sportType,
    distanceKm: clampNum(ride.distanceKm, 0, 2000, 0),
    durationSec: clampNum(ride.durationSec, 0, 604800, 0),
    movingTimeSec: clampNum(ride.movingTimeSec ?? ride.durationSec, 0, 604800, 0),
    avgSpeedKmH: clampNum(ride.avgSpeedKmH, 0, 150, 0),
    maxSpeedKmH: clampNum(ride.maxSpeedKmH, 0, 180, 0),
    climbM: clampNum(ride.climbM, 0, 30000, 0),
    descentM: clampNum(ride.descentM, 0, 30000, 0),
    effort: clampNum(ride.effort ?? 5, 1, 10, 5),
    notes: clampStr(ride.notes || '', 600),
    points: downsamplePoints(ride.points),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', cleanUid, 'rides', rideId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchUserBadges(uid: string): Promise<PersistedUserBadge[]> {
  const cleanUid = sanitizeId(uid);
  const path = `users/${cleanUid}/badges`;
  try {
    const q = query(collection(db, 'users', cleanUid, 'badges'), where('userId', '==', cleanUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id || d.id),
        userId: String(data.userId || cleanUid),
        badgeId: String(data.badgeId || d.id),
        unlockedAt: String(data.unlockedAt || new Date().toISOString()),
        triggerRideTitle: String(data.triggerRideTitle || 'GPS Sürüşü'),
        xpReward: Number(data.xpReward || 0),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function persistUserBadges(
  firebaseUser: FirebaseUser,
  badgesToSave: EvaluatedBadge[]
): Promise<PersistedUserBadge[]> {
  if (!firebaseUser.emailVerified || badgesToSave.length === 0) return [];

  const cleanUid = sanitizeId(firebaseUser.uid);
  await ensureUserAccountDocs(firebaseUser);

  const existing = await fetchUserBadges(cleanUid);
  const existingIds = new Set(existing.map((b) => b.badgeId));

  const savedList: PersistedUserBadge[] = [];

  for (const badge of badgesToSave) {
    if (!badge.unlocked) continue;
    const badgeId = sanitizeId(badge.id);
    if (existingIds.has(badgeId)) continue;

    const path = `users/${cleanUid}/badges/${badgeId}`;
    const unlockedAt = clampStr(badge.unlockedAt || new Date().toISOString(), 40);
    const triggerRideTitle = clampStr(badge.triggerRideTitle || 'GPS Sürüşü', 120, 'GPS Sürüşü');
    const xpReward = clampNum(badge.xpReward, 0, 10000, 0);

    const payload = {
      id: badgeId,
      userId: cleanUid,
      badgeId,
      unlockedAt,
      triggerRideTitle,
      xpReward,
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'users', cleanUid, 'badges', badgeId), payload);
      savedList.push({
        id: badgeId,
        userId: cleanUid,
        badgeId,
        unlockedAt,
        triggerRideTitle,
        xpReward,
      });
      existingIds.add(badgeId);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  return savedList;
}

