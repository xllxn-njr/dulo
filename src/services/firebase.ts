import { Analytics, getAnalytics, isSupported } from 'firebase/analytics';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  User,
  getAuth,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Firestore,
  doc,
  getDocFromServer,
  getFirestore,
} from 'firebase/firestore';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyCAMGKvA8zCgU3N3uigXYjVE7JvGBSVjRY',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'dulo-app.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'dulo-app',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'dulo-app.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '512998076321',
  appId: env.VITE_FIREBASE_APP_ID || '1:512998076321:web:ba638b4f04784e272825e0',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-B9QJVQLL2V',
};

const firestoreDatabaseId = env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = firestoreDatabaseId
  ? getFirestore(firebaseApp, firestoreDatabaseId)
  : getFirestore(firebaseApp);

export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  void isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(firebaseApp);
      }
    })
    .catch(() => {
      // Ignore analytics initialization errors in restricted environments
    });
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
void testConnection();

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signInAnonymousIfNeeded(): Promise<{
  user: User | null;
  anonymousProviderDisabled?: boolean;
  error?: string;
}> {
  if (auth.currentUser) {
    return { user: auth.currentUser };
  }
  try {
    const cred = await signInAnonymously(auth);
    return { user: cred.user };
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (
      code === 'auth/operation-not-allowed' ||
      code === 'auth/admin-restricted-operation'
    ) {
      return {
        user: null,
        anonymousProviderDisabled: true,
        error:
          'Anonymous sign-in is disabled in Firebase Console. Sign in with Google to enable cloud sync.',
      };
    }
    return {
      user: null,
      error: err instanceof Error ? err.message : 'Anonymous sign-in unavailable',
    };
  }
}

export async function signInWithGoogleModal(): Promise<User> {
  if (auth.currentUser && auth.currentUser.isAnonymous) {
    try {
      const linked = await linkWithPopup(auth.currentUser, googleProvider);
      return linked.user;
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (
        code === 'auth/credential-already-in-use' ||
        code === 'auth/email-already-in-use'
      ) {
        const res = await signInWithPopup(auth, googleProvider);
        return res.user;
      }
      throw err;
    }
  }
  const res = await signInWithPopup(auth, googleProvider);
  return res.user;
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}
