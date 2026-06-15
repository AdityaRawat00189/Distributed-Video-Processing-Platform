// import React from 'react';
// import Videx from './components/videx';
// import './App.css';

// function App() {
//   return (
//     <div className="app-container">
//       {/* You could add a global Navbar here in the future */}
//       <main className="main-content">
//         <Videx />
//       </main>
//       {/* You could add a global Footer here in the future */}
//     </div>
//   );
// }

// export default App;

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import UploadPage from './pages/UploadPage'
import AllVideosPage from './pages/AllVideosPage'
import PlayVideoPage from './pages/PlayVideoPage'
 
export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"         element={<LandingPage />} />
        <Route path="/upload"   element={<UploadPage />} />
        <Route path="/videos"   element={<AllVideosPage />} />
        <Route path="/play/:id" element={<PlayVideoPage />} />
      </Routes>
    </BrowserRouter>
  )
}