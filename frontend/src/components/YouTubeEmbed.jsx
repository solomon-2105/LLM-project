// file: frontend/src/components/YouTubeEmbed.jsx

import React from 'react';

function YouTubeEmbed({ videoUrl }) {
  if (!videoUrl) {
    return <p>No video provided for this topic.</p>;
  }

  let videoId = null;
  try {
    // Works for both [youtube.com/watch?v=](https://youtube.com/watch?v=)... and youtu.be/... links
    const url = new URL(videoUrl);
    if (url.hostname === 'youtu.be') {
      videoId = url.pathname.slice(1);
    } else if (url.hostname.includes('youtube.com')) {
      videoId = url.searchParams.get('v');
    }
  } catch (e) {
    console.error("Invalid video URL", videoUrl);
    return <p>Invalid video link provided.</p>;
  }

  if (!videoId) {
    return <p>Could not parse video ID from link: {videoUrl}</p>;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="video-container">
      <iframe
        src={embedUrl}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Embedded YouTube Video"
      ></iframe>
    </div>
  );
}

export default YouTubeEmbed;