import { Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './LanguageContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import CardiacPage from './pages/CardiacPage'
import BloodReportPage from './pages/BloodReportPage'
import ResultsPage from './pages/ResultsPage'
import AboutPage from './pages/AboutPage'

function App() {
  return (
    <LanguageProvider>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cardiac" element={<CardiacPage />} />
          <Route path="/blood" element={<BloodReportPage />} />
          <Route path="/results/:module" element={<ResultsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <Footer />
    </LanguageProvider>
  )
}

export default App
