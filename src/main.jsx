import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import BootLoader from './components/BootLoader'
import './index.css'
import './styles/nexus-ui.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <BootLoader />
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
