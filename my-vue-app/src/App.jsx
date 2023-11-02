import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import AvatarStack from './AvatarStack';
import Spaces from "@ably/spaces";
import { SpacesProvider, SpaceProvider } from "@ably/spaces/react";
import { Realtime } from 'ably/promises';

const ably = new Realtime.Promise({ authUrl: 'api/token' });
const spaces = new Spaces(ably);

function App() {
  return (
    <>
      <SpacesProvider client={spaces}>
        <SpaceProvider name="avatar-stack">
          <AvatarStack />
        </SpaceProvider>
      </SpacesProvider>
    </>
  )
}

export default App
