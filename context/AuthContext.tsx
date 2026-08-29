import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { generateReferralCode } from '@/utils/referralCode';
import { POINTS_RULES } from '@/data/pointsRules';

type SignUpDetails = {
  fullName: string;
  phone: string;
};

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  profileCompleted: boolean;
  profileLoading: boolean;
  signUp: (email: string, password: string, details: SignUpDetails) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
      if (!firebaseUser) {
        setProfileCompleted(false);
        setProfileLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    // Real-time listener — the moment the interests screen writes
    // profileCompleted: true, this fires and Stack.Protected redirects into
    // the main app automatically, no manual navigation needed.
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setProfileCompleted(!!snap.data()?.profileCompleted);
        setProfileLoading(false);
      },
      (err) => {
        console.error('Profile listener error:', err);
        setProfileLoading(false);
      }
    );
    return unsubscribe;
  }, [user]);

  const signUp = async (email: string, password: string, details: SignUpDetails) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    // Full profile shape written up front, so nothing downstream (Profile,
    // Points, VIP, Referrals) ever reads an undefined field — profile-setup
    // and edit-profile just update pieces of this same doc later.
    // Account-creation points (client requirement #11) are credited directly
    // here rather than via a separate awardPoints() call, since VIP status
    // is always false for a brand-new account (no multiplier to apply).
    await setDoc(doc(db, 'users', credential.user.uid), {
      name: details.fullName,
      phone: details.phone,
      email,
      avatar: '',
      bio: '',
      city: '',
      area: '',
      occupation: '',
      company: '',
      education: '',
      dob: '',
      languages: [],
      interests: [],
      connectionGoals: [],
      isVip: false,
      points: POINTS_RULES.createAccount,
      profileCompleted: false,
      referralCode: generateReferralCode(details.fullName),
      referralCount: 0,
      createdAt: serverTimestamp(),
    });
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, isLoading, profileCompleted, profileLoading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}