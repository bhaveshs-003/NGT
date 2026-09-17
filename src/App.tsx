import type { ReactElement } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AccessShell, AppShell } from '@/components/AppShell'
import { DeviceRegistration } from '@/screens/access/DeviceRegistration'
import { Login } from '@/screens/access/Login'
import { ForgotPassword, ResetPassword } from '@/screens/access/Recovery'
import { Splash } from '@/screens/access/Splash'
import { AssessmentResult } from '@/screens/assessment/AssessmentResult'
import { LiftPermit } from '@/screens/assessment/LiftPermit'
import { LiftingAssistance } from '@/screens/assessment/LiftingAssistance'
import { ManualEntry } from '@/screens/assessment/ManualEntry'
import { Processing } from '@/screens/assessment/Processing'
import { CapturePicker } from '@/screens/capture/CapturePicker'
import { CaptureReview } from '@/screens/capture/CaptureReview'
import { CaptureStart } from '@/screens/capture/CaptureStart'
import { CaptureViewport } from '@/screens/capture/CaptureViewport'
import { History } from '@/screens/history/History'
import { HistoryDetail } from '@/screens/history/HistoryDetail'
import { CreateJob } from '@/screens/jobs/CreateJob'
import { JobDetail } from '@/screens/jobs/JobDetail'
import { JobsList } from '@/screens/jobs/JobsList'
import { Notifications } from '@/screens/notifications/Notifications'
import { AppSettings, NotificationPreferences } from '@/screens/profile/AppSettings'
import { EditProfile } from '@/screens/profile/EditProfile'
import { DeleteAccount, Privacy, Terms } from '@/screens/profile/Legal'
import { Profile } from '@/screens/profile/Profile'
import { SyncQueue } from '@/screens/sync/SyncQueue'
import { useApp } from '@/store/useApp'

function RequireAuth({ children }: { children: ReactElement }) {
  const authUser = useApp((s) => s.authUser)
  const deviceRegistered = useApp((s) => s.deviceRegistered)
  const location = useLocation()
  if (!authUser) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!deviceRegistered) return <Navigate to="/device-registration" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* unauthenticated, still inside the handset frame */}
      <Route element={<AccessShell />}>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/device-registration" element={<DeviceRegistration />} />
      </Route>

      {/* authenticated, inside the phone shell */}
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/jobs" element={<JobsList />} />
        <Route path="/jobs/new" element={<CreateJob />} />
        <Route path="/jobs/:jobId" element={<JobDetail />} />

        <Route path="/capture" element={<CapturePicker />} />
        <Route path="/capture/:jobId" element={<CaptureStart />} />
        <Route path="/capture/:jobId/step/:stepId" element={<CaptureViewport />} />
        <Route path="/capture/:jobId/review" element={<CaptureReview />} />

        <Route path="/processing/:assessmentId" element={<Processing />} />
        <Route path="/assessment/:assessmentId" element={<AssessmentResult />} />
        <Route path="/assessment/:assessmentId/manual-entry" element={<ManualEntry />} />
        <Route path="/assessment/:assessmentId/lifting" element={<LiftingAssistance />} />
        <Route path="/assessment/:assessmentId/permit" element={<LiftPermit />} />

        <Route path="/history" element={<History />} />
        <Route path="/history/:assessmentId" element={<HistoryDetail />} />

        <Route path="/notifications" element={<Notifications />} />
        <Route path="/sync" element={<SyncQueue />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/settings" element={<AppSettings />} />
        <Route path="/profile/notifications" element={<NotificationPreferences />} />
        <Route path="/profile/terms" element={<Terms />} />
        <Route path="/profile/privacy" element={<Privacy />} />
        <Route path="/profile/delete" element={<DeleteAccount />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
