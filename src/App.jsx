import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import DesignLibrary from './pages/DesignLibrary'
import FilamentCalculator from './pages/FilamentCalculator'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/design-library" element={<DesignLibrary />} />
        <Route path="/filament-calculator" element={<FilamentCalculator />} />
      </Routes>
    </Layout>
  )
}
