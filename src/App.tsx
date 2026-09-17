import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from './landing/LandingPage'
import LabApp from './lab/LabApp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lab" element={<LabApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
