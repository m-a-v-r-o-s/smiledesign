import { createRoot } from 'react-dom/client'
import '@fontsource/open-sans/400.css'
import '@fontsource/open-sans/600.css'
import '@fontsource/open-sans/700.css'
import './styles.css'
import Kiosk from './Kiosk.jsx'
import Admin from './Admin.jsx'

const path = location.pathname

function Launcher() {
  return (
    <main className="launcher">
      <img src="/logo.svg" alt="Smile Design Dental Clinic" width="260" height="128" />
      <h1>Patient forms</h1>
      <div className="launcher-cards">
        <a href="/kiosk"><strong>iPad kiosk</strong><span>Patients pick their forms, fill them in and sign.</span></a>
        <a href="/admin"><strong>Clinic dashboard</strong><span>Every signed form, live, searchable by patient.</span></a>
      </div>
      <p className="credit">Built by <a href="https://www.akosds.com">Akos Digital Services</a></p>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  path.startsWith('/kiosk') ? <Kiosk /> : path.startsWith('/admin') ? <Admin /> : <Launcher />,
)
