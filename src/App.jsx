import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import BottomNav from './components/BottomNav.jsx'
import PromoCarousel from './components/PromoCarousel.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'

import Home from './pages/Home.jsx'
import Doctors from './pages/Doctors.jsx'
import DoctorDetail from './pages/DoctorDetail.jsx'
import MyAppointments from './pages/MyAppointments.jsx'
import DoctorRegister from './pages/DoctorRegister.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import LabTests from './pages/LabTests.jsx'
import LabTestDetail from './pages/LabTestDetail.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Profile from './pages/Profile.jsx'
import AddressBook from './pages/AddressBook.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import StaticPage from './pages/StaticPage.jsx'
import StaffLogin from './pages/StaffLogin.jsx'
import StaffRegister from './pages/StaffRegister.jsx'
import NotFound from './pages/NotFound.jsx'

// NOTE: the old medical-store marketplace pages (medicines listing/detail,
// cart, checkout, order tracking, wishlist, store search/page, owner
// dashboard/prescriptions/store-profile/subscription, delivery dashboard)
// have all been removed along with that business — MedNex is now a Doctor
// Appointment platform (search, booking, live token queue, doctor/staff
// dashboard, subscriptions) below.

function PageWrap({ children }) {
  const location = useLocation()
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrap><Home /></PageWrap>} />
            <Route path="/doctors" element={<PageWrap><Doctors /></PageWrap>} />
            <Route path="/doctors/:id" element={<PageWrap><DoctorDetail /></PageWrap>} />
            <Route path="/appointments" element={<PageWrap><MyAppointments /></PageWrap>} />
            <Route path="/lab-tests" element={<PageWrap><LabTests /></PageWrap>} />
            <Route path="/lab-tests/:id" element={<PageWrap><LabTestDetail /></PageWrap>} />
            <Route path="/login" element={<PageWrap><Login /></PageWrap>} />
            <Route path="/signup" element={<PageWrap><Signup /></PageWrap>} />
            <Route path="/forgot-password" element={<PageWrap><ForgotPassword /></PageWrap>} />
            <Route path="/profile" element={<PageWrap><Profile /></PageWrap>} />
            <Route path="/profile/addresses" element={<PageWrap><AddressBook /></PageWrap>} />
            <Route path="/profile/notifications" element={<PageWrap><NotificationsPage /></PageWrap>} />
            <Route path="/about" element={<PageWrap><StaticPage type="about" /></PageWrap>} />
            <Route path="/contact" element={<PageWrap><StaticPage type="contact" /></PageWrap>} />
            <Route path="/faq" element={<PageWrap><StaticPage type="faq" /></PageWrap>} />
            <Route path="/privacy" element={<PageWrap><StaticPage type="privacy" /></PageWrap>} />
            <Route path="/terms" element={<PageWrap><StaticPage type="terms" /></PageWrap>} />
            {/* No admin routes here by design — MedNex Company Admin lives
                entirely in the separate, private mednex-admin app. */}
            <Route path="/staff/login" element={<PageWrap><StaffLogin /></PageWrap>} />
            <Route path="/staff/register" element={<PageWrap><StaffRegister /></PageWrap>} />
            <Route path="/doctor/register" element={<PageWrap><DoctorRegister /></PageWrap>} />
            <Route path="/doctor" element={<PageWrap><DoctorDashboard /></PageWrap>} />
            <Route path="*" element={<PageWrap><NotFound /></PageWrap>} />
          </Routes>
        </AnimatePresence>
      </main>
      <PromoCarousel />
      <Footer />
      <BottomNav />
      <InstallPrompt />
    </div>
  )
}
