Here's a professional and well-documented README file for your WebSocket chat application:

---

# WebSocket Chat Application

## Overview

This project is a WebSocket-based chat application that allows users to register, log in, and communicate in real-time. It supports one-on-one messaging as well as group chats. The application uses native WebSocket with Node.js on the server side and a simple HTML/CSS frontend.

## Features

- **User Registration & Login**: Users can register and log in to access the chat functionalities.

- **Real-time Messaging**: Supports one-on-one messaging and group chats.

- **Group Management**: Users can create groups and add members.

- **Conversation History**: Fetches and displays conversation history for a selected user or group.

- **Online User List**: Displays the list of currently online users.

## Getting Started

To run the chat application locally, follow these steps:

### Prerequisites

- **Node.js**: Ensure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).

### Installation

1. **Clone the Repository**

```bash

git clone

cd

```

2. **Install Dependencies**

Navigate to the project directory and install the required dependencies:

```bash

npm install

```

3. **Run the Server**

Start the WebSocket server:

```bash

node server.mjs

```

4. **Open the Application**

Open `index.html` in your web browser. You can do this by navigating to the file in your file explorer and double-clicking it, or by serving it through a local HTTP server.

## File Structure

- `index.html`: The main HTML file that contains the front-end of the chat application. It includes the chat UI, registration, and login forms.

- `server.mjs`: The Node.js WebSocket server script. Handles WebSocket connections, user authentication, message broadcasting, and group management.

## Code Overview

### Frontend (`index.html`)

- **WebSocket Initialization**: `initializeWebSocket` function establishes a WebSocket connection to the server.

- **User Registration/Login**: Functions `register` and `login` handle user registration and authentication.

- **Message Handling**: Functions `sendMessage`, `displayMessage`, and `populateOnlineUserAndGroupList` manage message sending, display, and updating the user and group lists.

- **Group Management**: Functions `createGroup` and `addToGroup` handle group creation and member addition.

- **Conversation History**: Function `fetchConversation` retrieves and displays conversation history.

### Backend (`server.mjs`)

- **WebSocket Upgrade**: Handles WebSocket upgrade requests and establishes connections.

- **Message Handling**: Functions `handleMessage`, `registerUser`, `authenticateUser`, `sendMessage`, `createGroup`, `addToGroup`, and `sendConversationHistory` process various WebSocket messages.

- **Broadcasting**: Functions `broadcastToGroup` and `broadcastUpdateUsersAndGroups` manage broadcasting messages and updates to users and groups.

- **Connection Management**: Functions `send`, `sendError`, and `onSocketClose` handle sending messages, errors, and closing connections.

## Usage

- **Register**: Enter a username and password to register a new account.

- **Login**: Use your registered credentials to log in.

- **Send Messages**: Select a user or group from the sidebar to start chatting.

- **Create Groups**: Enter a group name and click "Create Group" to create a new group.

- **Add Members**: Enter a username and group name to add a member to a group.

## Troubleshooting

- **Connection Issues**: Ensure that the WebSocket server is running and accessible at `ws://localhost:1337`.

- **Authentication Errors**: Verify that you are using the correct username and password.

- **UI Issues**: Check the browser console for any JavaScript errors and ensure that `index.html` is correctly loaded.



## Contact

For any questions or feedback, please contact the project maintainer at `sundayucheawaji@gmail.com`.

---

