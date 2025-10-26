import os
from googleapiclient.discovery import build

def search_youtube(query):
    """
    Searches YouTube for a tutorial video and returns a clean URL.
    """
    api_key = os.environ.get("YOUTUBE_API_KEY")
    
    # Fallback: If no API key, return a Google search link
    fallback_url = "https://www.google.com/search?q=" + query.replace(" ", "+")
    
    if not api_key:
        print("Warning: YOUTUBE_API_KEY not found. Returning Google search URL.")
        return fallback_url
    
    try:
        youtube = build('youtube', 'v3', developerKey=api_key)
        
        request = youtube.search().list(
            part="snippet",
            maxResults=1,
            q=f"tutorial for {query}",
            type="video"
        )
        response = request.execute()
        
        if response['items']:
            video_id = response['items'][0]['id']['videoId']
            # Return the clean, standard YouTube URL
            return f"https://www.youtube.com/watch?v={video_id}"
        else:
            # No video found, return Google search
            return fallback_url
            
    except Exception as e:
        print(f"Error searching YouTube: {e}")
        # On error, return Google search
        return fallback_url