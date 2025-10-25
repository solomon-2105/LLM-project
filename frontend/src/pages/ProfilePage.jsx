import React from 'react';

function ProfilePage({ user }) {
  return (
    <div>
      <h1>👤 Profile Page</h1>
      <h2>Username:</h2>
      <p>{user}</p>
      
      {/* These are still static, but you could add them to your DB! */}
      <h2>Class:</h2>
      <p>Class 10</p>
      
      <h2>School:</h2>
      <p>Gemini High</p>
    </div>
  );
}
export default ProfilePage;