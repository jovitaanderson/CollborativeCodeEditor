import React, { useState } from 'react';
import '../css/lobby.css';


function Lobby() {
  const [inviteLink, setInviteLink] = useState('');
  const [name, setName] = useState('');
  const postgresqlPort = 3001;
  const {v4: uuidV4} = require('uuid');
  const [formData, setFormData] = useState({
		username: "",
		status: "",
		io: "",
	});

  const handleSubmit = (e) => {
    e.preventDefault();
    window.location = `/room?room=${uuidV4()}`;
  };

  const handleQueue = async (e) => {
    e.preventDefault();

  try {
    const response = await fetch(`http://localhost:${postgresqlPort}/join-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (response.ok) {
      // User added to the queue successfully
      // You can handle this according to your application's logic
      console.log('User added to the queue.');
    } else {
      // Handle error here
      console.error('Error adding user to the queue.');
    }
  } catch (error) {
    console.error('Error:', error);
  }

  };

  return (
    <div id="lobby-container">
      <div id="form-container">
        <div id="form__container__header">
          <p>👋 Create OR Join a Room</p>
        </div>

        <div id="form__content__wrapper">
          <form id="join-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="invite_link"
              value={inviteLink}
              onChange={(e) => setInviteLink(e.target.value)}
            />
            <input type="submit" value="Join Room" />
          </form>
          <form id="queue-form" onSubmit={handleQueue}>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input type="submit" value="Join Queue"/>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
