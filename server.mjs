import { createServer } from "http";
import crypto from "crypto";

const PORT = 1337;
const users = new Map(); // Map to store users and their respective sockets
const groups = new Map(); // Map to store groups and their members
const registeredUsers = new Map(); // Map to store registered users
const conversations = new Map(); // Map to store conversations between users and groups

const WEBSOCKET_MAGIC_STRING_KEY = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

const server = createServer((req, res) => {
  res.writeHead(200);
  res.end("WebSocket chat server");
});

server.on("upgrade", (req, socket, head) => {
  const { "sec-websocket-key": key } = req.headers;
  const acceptKey = crypto
    .createHash("sha1")
    .update(key + WEBSOCKET_MAGIC_STRING_KEY)
    .digest("base64");

  const responseHeaders = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptKey}`,
  ];

  socket.write(responseHeaders.concat("\r\n").join("\r\n"));
  socket.on("data", (buffer) => onSocketData(socket, buffer));
  socket.on("close", () => onSocketClose(socket));
});

function onSocketData(socket, buffer) {
  const isMasked = buffer[1] & 0x80; // Check if the mask bit is set
  let payloadLength = buffer[1] & 0x7f;
  let maskStartIndex = 2;

  if (payloadLength === 126) {
    payloadLength = buffer.readUInt16BE(2);
    maskStartIndex = 4;
  } else if (payloadLength === 127) {
    payloadLength = buffer.readUInt32BE(2);
    maskStartIndex = 10;
  }

  const mask = buffer.slice(maskStartIndex, maskStartIndex + 4);
  const payloadData = buffer.slice(
    maskStartIndex + 4,
    maskStartIndex + 4 + payloadLength
  );

  let unmaskedData = Buffer.alloc(payloadLength);
  for (let i = 0; i < payloadLength; i++) {
    unmaskedData[i] = payloadData[i] ^ mask[i % 4]; // Unmasking the payload data
  }

  const message = JSON.parse(unmaskedData.toString("utf8"));
  handleMessage(socket, message);
}

function handleMessage(socket, message) {
  const { type, payload } = message;

  switch (type) {
    case "register":
      registerUser(socket, payload);
      break;
    case "authenticate":
      authenticateUser(socket, payload);
      break;
    case "message":
      sendMessage(socket, payload);
      break;
    case "createGroup":
      createGroup(socket, payload);
      break;
    case "addToGroup":
      addToGroup(socket, payload);
      break;
    case "getConversation":
      sendConversationHistory(socket, payload);
      break;
    case "close":
      onSocketClose(socket, payload);

    default:
      sendError(socket, "Unknown message type");
  }
}

function registerUser(socket, { userName, password }) {
  if (registeredUsers.has(userName)) {
    send(socket, {
      type: "registered",
      payload: { success: false, message: "Username already exists" },
    });
  } else {
    registeredUsers.set(userName, password);
    send(socket, { type: "registered", payload: { success: true } });
  }
}

function authenticateUser(socket, { userName, password }) {
  if (registeredUsers.get(userName) === password) {
    users.set(socket, userName);
    socket.userName = userName;

    send(socket, {
      type: "authenticated",
      payload: { success: true, userName },
    });
    broadcastUpdateUsersAndGroups(socket);
  } else {
    send(socket, { type: "authenticated", payload: { success: false } });
  }
}

function sendMessage(socket, { to, text, date }) {
  const userName = socket.userName;
  if (!userName) return sendError(socket, "User not authenticated");

  if (groups.has(to)) {
    broadcastToGroup(to, {
      type: "message",
      payload: { from: userName, text, to },
    });
  } else {
    const recipientSocket = Array.from(users.entries()).find(
      ([s, name]) => name === to
    )?.[0];
    if (recipientSocket) {
      send(recipientSocket, {
        type: "message",
        payload: { from: userName, text, to, date },
      });

      send(socket, {
        type: "message",
        payload: { from: userName, text, to, date },
      });

      const conversationKey = getConversationKey(userName, to);
      const conversation = conversations.get(conversationKey) || [];
      conversation.push({ sender: userName, message: text, to, date });
      conversations.set(conversationKey, conversation);
    }
  }
}

function createGroup(socket, { groupName }) {
  const userName = socket.userName;
  if (!userName) return sendError(socket, "User not authenticated");

  if (groups.has(groupName)) {
    send(socket, {
      type: "groupCreated",
      payload: { groupName, success: false },
    });
  } else {
    groups.set(groupName, new Set([userName]));
    send(socket, {
      type: "groupCreated",
      payload: { groupName, success: true },
    });
    broadcastUpdateUsersAndGroups(socket);
  }
}

function addToGroup(socket, { groupName, member }) {
  const userName = socket.userName;
  if (!userName) return sendError(socket, "User not authenticated");

  if (groups.has(groupName)) {
    const members = groups.get(groupName);
    members.add(member);

    send(socket, {
      type: "addedToGroup",
      payload: { groupName, member, success: true },
    });

    for (let [userSocket, name] of users.entries()) {
      if (name === member) {
        broadcastUpdateUsersAndGroups(userSocket);
      }
    }
  } else {
    send(socket, {
      type: "addedToGroup",
      payload: { groupName, success: false },
    });
  }
}

function sendConversationHistory(socket, { recipient }) {
  const userName = socket.userName;
  if (!userName) return sendError(socket, "User not authenticated");

  const conversationKey = getConversationKey(userName, recipient);
  const conversation = conversations.get(conversationKey) || [];
  send(socket, {
    type: "conversationHistory",
    payload: conversation,
  });
}

function getConversationKey(username1, username2) {
  return [username1, username2].sort().join(":");
}

function broadcastToGroup(groupName, message) {
  const groupMembers = groups.get(groupName);
  if (groupMembers) {
    groupMembers.forEach((member) => {
      for (let [userSocket, name] of users.entries()) {
        if (name === member) {
          send(userSocket, message);
        }
      }
    });
  }
}

function getKeysWithName(map, name) {
  const keys = [];
  for (let [key, valueSet] of map.entries()) {
    if (valueSet.has(name)) {
      keys.push(key);
    }
  }
  return keys;
}

function broadcastUpdateUsersAndGroups(socket) {
  const userList = Array.from(users.values());

  if (users.size > 0) {
    users.forEach((_value, userSocket) => {
      const groupList = getKeysWithName(groups, userSocket.userName);
      const updateMessage = {
        type: "currentlyUpdatedUsersAndGroups",
        payload: { users: userList, groups: groupList },
      };
      send(userSocket, updateMessage);
    });
  }
}

function sendError(socket, errorMessage) {
  send(socket, { type: "error", payload: { message: errorMessage } });
}

function send(socket, message) {
  const messageString = JSON.stringify(message);
  const messageBuffer = Buffer.from(messageString);

  let frame;
  if (messageBuffer.length < 126) {
    frame = Buffer.alloc(2 + messageBuffer.length);
    frame[0] = 0x81; // Text frame
    frame[1] = messageBuffer.length; // Payload length
    messageBuffer.copy(frame, 2);
  } else if (messageBuffer.length < 65536) {
    frame = Buffer.alloc(4 + messageBuffer.length);
    frame[0] = 0x81; // Text frame
    frame[1] = 126; // Payload length indicator for 126 - 65535 bytes
    frame.writeUInt16BE(messageBuffer.length, 2); // Actual payload length
    messageBuffer.copy(frame, 4);
  } else {
    frame = Buffer.alloc(10 + messageBuffer.length);
    frame[0] = 0x81; // Text frame
    frame[1] = 127; // Payload length indicator for > 65535 bytes
    frame.writeBigUInt64BE(BigInt(messageBuffer.length), 2); // Actual payload length
    messageBuffer.copy(frame, 10);
  }

  socket.write(frame);
}

function onSocketClose(socket) {
  const userName = socket.userName;
  if (userName) {
    const updateMessage = {
      type: "logout",
      payload: { message: "Logged Out" },
    };
    send(socket, updateMessage);
    users.delete(socket);
    groups.forEach((members) => members.delete(userName));
    if (users.size > 0) {
      users.forEach((_value, userSocket) => {
        broadcastUpdateUsersAndGroups(userSocket);
      });
    }
  }
}

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
