import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BackgroundMesh from './components/BackgroundMesh'
import HomePage from './pages/HomePage'
import CardiacPage from './pages/CardiacPage'
import SkinPage from './pages/SkinPage'
import BloodReportPage from './pages/BloodReportPage'
import ResultsPage from './pages/ResultsPage'
import AboutPage from './pages/AboutPage'

function App() {
  return (
    <>
      <BackgroundMesh />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cardiac" element={<CardiacPage />} />
          <Route path="/skin" element={<SkinPage />} />
          <Route path="/blood" element={<BloodReportPage />} />
          <Route path="/results/:module" element={<ResultsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
