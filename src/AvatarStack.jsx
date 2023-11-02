'use client';

import { useEffect } from "react";
import { Navbar } from 'flowbite-react';
import { useSpace, useMembers } from "@ably/spaces/react";
import AblyAvatar from './AblyAvatar';

function generateTwoLetterString() {
  let result = '';
  for (let i = 0; i < 2; i++) {
    result += String.fromCharCode(65 + Math.floor(Math.random() * 26));
  }
  return result;
}

// Generate a random color name
function generateRandomColor() {
  const colors = [
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function AvatarStack() {
  const name = generateTwoLetterString();
  const memberColor = generateRandomColor();

  /** 💡 Get a handle on a space instance 💡 */
  const { space } = useSpace();

  /** 💡 Enter the space as soon as it's available 💡 */
  useEffect(() => {
    space?.enter({ name, memberColor });
  }, [space]);

  /** 💡 Get everybody except the local member in the space and the local member 💡 */
  const { others, self } = useMembers();

  return (
    <div id="avatar-stack" className={`avatar-container`}>
      <Navbar fluid rounded>
        <Navbar.Brand href="/">
          <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Avatar Stack Demo</span>
        </Navbar.Brand>
        <div className="flex flex-wrap gap-2">
          <AblyAvatar user={self} />
          {others.map((user) => {
            return <AblyAvatar key={user.clientId} user={user}/>
          })}
        </div>
      </Navbar>
    </div>
  );
}
export default AvatarStack;
