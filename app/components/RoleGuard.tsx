// src/components/guards/RoleGuard.tsx
import { useLayoutEffect, useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authStore } from 'app/stores/authStore'  // ← DÙNG STORE TRỰC TIẾP
import { useTranslation } from 'react-i18next'

interface RoleGuardProps {
  children: ReactNode
  allow: string[]
}

export function RoleGuard({ children, allow }: RoleGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [isChecking, setIsChecking] = useState(true)

  useLayoutEffect(() => {
    const { user } = authStore.getState()
    const isAuthenticated = !!user

    if (!isAuthenticated) {
      navigate('/auth/login', {
        replace: true,
        state: { from: location },
      })
      return
    }

    if (!allow.includes(user.role)) {
      navigate('/forbidden', { replace: true })
      return
    }

    setIsChecking(false)
  }, [navigate, location, allow])

  // TRẢ VỀ NULL KHI ĐANG CHECK HOẶC KHÔNG ĐƯỢC PHÉP
  if (isChecking) {
    return <LoadingSkeleton message={t('checking_auth')} />
  }

  const { user } = authStore.getState()
  if (!user || !allow.includes(user.role)) {
    return null
  }

  return <>{children}</>
}

function LoadingSkeleton({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  )
}