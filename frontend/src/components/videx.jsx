import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import './Videx.css';

const API_BASE = 'http://localhost:5000/api/upload';

export default function Videx() {
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  
  // Form State
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Status State
  const [status, setStatus] = useState({ type: '', message: '' });

  // Fetch all videos on mount
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${API_BASE}/all`);
      const data = await response.json();
      if (data.videos) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setStatus({ type: 'error', message: 'Title and File are required.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Uploading video... Please wait.' });

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Upload completed successfully!' });
        setFile(null);
        setTitle('');
        setDescription('');
        // Refresh the gallery
        fetchVideos();
      } else {
        setStatus({ type: 'error', message: 'Upload failed. Please try again.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error during upload.' });
    }
  };

  return (
    <div className="videx-container">
      <header className="videx-header">
        <h1>Videx</h1>
      </header>

      {/* Upload Form */}
      <section className="upload-card">
        <h2>Upload New Content</h2>
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>Video Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Enter an attractive title" 
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="What is this video about?"
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Select File</label>
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileChange} 
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-upload"
            disabled={status.type === 'loading'}
          >
            {status.type === 'loading' ? 'Uploading...' : 'Upload Video'}
          </button>

          {status.message && (
            <div className={`status-msg ${status.type}`}>
              {status.message}
            </div>
          )}
        </form>
      </section>

        {/* Video Gallery */}
        <section>
        <h2 style={{ color: 'var(--text-primary)' }}>Your Videos</h2>
        <div className="gallery-grid">
            {videos.map((vid) => {
            const thumbnailUrl = `http://localhost:5000/api/upload/thumbnail/${vid._id}`;

            return (
                <div key={vid._id} className="video-card" onClick={() => setActiveVideo(vid)}>
                <div className="video-thumb-container">
                    <img 
                    src={thumbnailUrl} 
                    alt={vid.title}
                    className="video-thumb"
                    // If the image truly fails to load, it will show this placeholder instead of a broken icon
                    onError={(e) => { 
                        e.target.onerror = null; // Prevent infinite loops
                        e.target.src = 'https://via.placeholder.com/640x360/1A2235/7C3AED?text=Processing...'; 
                    }}
                    />
                </div>
                <div className="video-card-info">
                    <h3 className="video-title">{vid.title}</h3>
                    <span className="video-status">{vid.status}</span>
                </div>
                </div>
            );
            })}
        </div>
        </section>

      {/* HLS Player Modal */}
      {activeVideo && (
        <PlayerModal 
          video={activeVideo} 
          onClose={() => setActiveVideo(null)} 
        />
      )}
    </div>
  );
}

// Separate component to handle the HLS video lifecycle cleanly
function PlayerModal({ video, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    let hls;
    const streamUrl = `${API_BASE}/stream/${video._id}`;

    if (videoRef.current) {
      const videoElement = videoRef.current;

      // Check if browser natively supports HLS (e.g., Safari)
      if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = streamUrl;
      } 
      // Otherwise, use HLS.js
      else if (Hls.isSupported()) {
        hls = new Hls({
          // HLS.js configuration options can go here
          debug: false,
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(videoElement);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoElement.play().catch(e => console.log("Autoplay prevented", e));
        });
      }
    }

    // Cleanup HLS instance on unmount
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [video]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{video.title}</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        <div className="player-wrapper">
          <video 
            ref={videoRef} 
            controls 
            autoPlay
            style={{ width: '100%', height: '100%', outline: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}