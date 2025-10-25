import os
from googleapiclient.discovery import build

def search_youtube(query):
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        return "[https://www.google.com/search?q=](https://www.google.com/search?q=)" + query.replace(" ", "+") # Fallback
    
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
            return f"[https://www.youtube.com/watch?v=](https://www.youtube.com/watch?v=){video_id}"
        else:
            return "[https://www.google.com/search?q=](https://www.google.com/search?q=)" + query.replace(" ", "+")
    except Exception as e:
        print(f"Error searching YouTube: {e}")
        return "[https://www.google.com/search?q=](https://www.google.com/search?q=)" + query.replace(" ", "+")