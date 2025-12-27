"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { User as FirebaseUser } from "firebase/auth"
import { onAuthStateChange, getCurrentUserData } from "@/lib/firebase/auth"
import { User } from "@/types"

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    if (firebaseUser) {
      const userData = await getCurrentUserData(firebaseUser)
      setUser(userData)
    } else {
      setUser(null)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      if (firebaseUser) {
        const userData = await getCurrentUserData(firebaseUser)
        setUser(userData)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

