'use client';
import { auth, db } from '@/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'

export function useUserRole() {
    const [role, setRole] = useState(null);
    useEffect(() => {
        const unsubscribe = auth.onIdTokenChanged(async (user) => {
            if (user) {
                try {
                    console.log(user.uid)
                    const docref = doc(db, "users", user.uid)
                    const docSnap = await getDoc(docref);
                    if (docSnap.exists()) {
                        setRole(docSnap.data().role);
                    }
                }
                catch (error) {
                    console.log(error);
                }

            }
            else {
                setRole(null);
            }
        });
        return () => unsubscribe();
    }, []);
    return role;
}
