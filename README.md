# Creating an Avatar Stack with Ably and Flowbite

Websites and apps are slowly starting to integrate more collaborative features as a means of increasing interactivity and the functionality of various use-cases. Be it a collaborative document or a chat room, one common feature is to show who else is in the space with you.

Typically this’ll be done with an [Avatar Stack](https://ably.com/examples/avatar-stack), a collection of icons, each representing a client connected to the space. Usually these’ll have useful features such as a dot to indicate whether they’re active, as well as providing useful app-dependent interactions, for example a button to take you to where said user is in a text document.

In this blog post, we’ll demonstrate how you can easily get started with making your own Avatar Stack in React, making use of [Flowbite](https://www.flowbite.com) and [Ably](https://www.ably.com).

## What is Flowbite?

Flowbite is an open-source UI component library built on top of [Tailwind CSS](https://tailwindcss.com/). They provide a React library, which makes it quick to make the skeleton of a website. Importantly for this demo, they provide Avatar Stack UI elements straight out of the box.

## What is Ably?

Ably is a realtime broker based primarily on WebSockets. Ably provides tools to enable reliable, scalable messaging between any number devices, with a focus on tooling for end-user devices.

Ably has a React SDK specifically focused on implementing the communication aspects of collaborative environments called Spaces, which contains methods specifically for implementing Avatar Stacks. We’ll be using this SDK in this blog post.

## Setting up the React App

To get started, we’ll use Vite to create a React package in JavaScript:

npm create vite@latest avatar-stack -- --template react
cd avatar-stack

1. Install Tailwind

In the new project, let’s install tailwind and the other various packages required for us to make use of Flowbite with npm:

npm install -D tailwindcss postcss autoprefixer

Next, let’s instantiate our tailwind.config.js file:
 
npx tailwindcss init -p

Now, configure the template paths inside the tailwind.config.js file. These’ll allow for tailwind to work properly with Flowbite:

```json
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Finally for Tailwind, set up the Tailwind directives inside the `./src/index.css` file at the top:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

2. Install Flowbite

Install Flowbite and Flowbite React by running the following command in your terminal:

```bash
npm install flowbite flowbite-react
```

With flowbite installed, update the `plugins` section of the `tailwind.config.js` file to require flowbite:

```javascript
module.exports = {

    plugins: [
        require('flowbite/plugin')
    ]

}
```

Additionally to your own content data you should add the Flowbite source paths to apply the classes from the interactive elements in the tailwind.config.js file:

```javascript
module.exports = {

    content: [
        // ...
        'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}'
    ]

}
```

3. Install Ably

With Flowbite set up, the last thing we need to install is Ably:

```bash
npm install ably
```

### Authentication with Ably

With everything installed, we can start setting up our Avatar Stack. As we’ll be using Ably for handling the synchronization between clients of who is present, names, and so on, we’ll need to get an API key to authenticate with Ably.

Sign up for an Ably Account for free, and then create an app in your Dashboard. Once you have an App, go to the app’s API keys and copy one. We’ll be using this to generate tokens for our end-users to use.

**Creating a `.env.local` File**

Equipped with the Ably API key, let’s create a `.env.local` file in the root of the project directory to store it. This file should look like:

```env
VITE_ABLY_API_KEY=your-ably-api-key
```

Make sure to replace `your-ably-api-key` with your actual API keys from Ably.

**Creating the Ably Authentication Endpoint**

Let's create this endpoint within the Vite application, which can provide our clients their Ably Tokens. We are making this endpoint to generate tokens rather than providing the API key directly to clients in order to have better control of important authentication details, and avoid the clients from having them. This way we have tokens we can revoke as needed, should we have bad actors in a real-life situation.

Firstly, we'll need to `vite-plugin-api`, which makes it easy for us to create API endpoints for our clients to use within Vite to obtain tokens. Run the following:

```sh
npm install vite-plugin-api express
```

Next, replace the contents of `vite.config.ts` with:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pluginAPI } from "vite-plugin-api";

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [react(),
      pluginAPI({
         // Configuration options go here
      }),
   ],
});
```

Create a new file in `/src/api/token` called `index.ts`. In it, add the following code:

```js
import Ably from "ably/promises";

export const GET = async (req:any, res:any) => {
const client = new Ably.Rest(import.meta.env.VITE_ABLY_API_KEY);
const clientId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const tokenRequestData:Ably.Types.TokenRequest = await client.auth.createTokenRequest({ clientId });

return res.json(tokenRequestData);
}
```

Here we are using the Ably client library to generate a TokenRequest object, which we can return to the requesting client to use to authenticate with. Usually you'd have some form of login or check prior to just giving unlimited access to a client, but for this tutorial we'll keep things simple.

We are also assigning the token a clientId, which in this case is just a random string. This is what will be used to identify the client uniquely.
Creating the core App

With the endpoint set up, we can finally get to the exciting bit; creating the Avatar Stack.

Firstly, update the #root style in App.css to:

```css
#root {
  width: 100%;
  margin: 0;
  text-align: center;
}
```

### Setting up the Ably Spaces SDK

Next, let’s update the imports of our `App.jsx` file to include Ably, as well as import a file we will soon be adding, `AvatarStack`:

```javascript
import './App.css';
import AvatarStack from './AvatarStack';
import Spaces from "@ably/spaces";
import { SpacesProvider, SpaceProvider } from "@ably/spaces/react";
import { Realtime } from 'ably/promises';
```

With Ably imported, we can instantiate a connection to Ably, which we use to instantiate the Spaces library. We can then wrap our upcoming AvatarStack component with an SpacesProvider so that Ably’s available to it:

```javascript
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
```

## Creating the Avatar Stack

With our SpacesProvider ready, create a new file, `AvatarStack.jsx` in `/src`. Add the following base code to it:

```javascript
'use client';

import { useEffect } from "react";
import { Navbar } from 'flowbite-react';
import { useSpace, useMembers } from "@ably/spaces/react";


function AvatarStack() {
// Connect to Ably Space and enter set of connected clients

  return (
    <div id="avatar-stack" className={`example-container`}>
      <Navbar fluid rounded>
        <Navbar.Brand href="/">
          <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Avatar Stack Demo</span>
        </Navbar.Brand>
        <div className="flex flex-wrap gap-2">
          // Add Avatars
        </div>
      </Navbar>
    </div>
  );
}
export default AvatarStack;
```
Here we have a very simple page, with a header bar. We’ll be adding our Avatar Stack to the right end of this header bar.

### Creating an Avatar

Let’s set up what our Avatars will look like. We’ll have it so that our clients appear as a pair of initials, and that each Avatar has an indicator on it, which’ll be green if they’re active in the room, and red if they’re currently inactive.

Create a new file in `/src` called `AblyAvatar.jsx`, and add the following to it:

```javascript
import { Avatar } from 'flowbite-react';

const AblyAvatar = ({ user }) => {
    if (!user) return (<></>);

    return (
        <Avatar placeholderInitials={user.profileData.name} color={user.profileData.memberColor} rounded stacked status={user.isConnected ? 'online' : 'offline'} statusPosition="bottom-left" />
    );
};

export default AblyAvatar;
```

Here we are expecting an object to be passed in, which contains the initials of the user, a color for the border of their Avatar, and their online status. The `isConnected` field is auto-generated in Ably to represent if a client is connected or not.

### Generating user details

Now, let’s go back to the `AvatarStack.jsx` file to make use of this AblyAvatar component. Implement two functions at the top of the file, just below the imports, which’ll allow us to generate a random color and name initials for a user. We’ll also import the AblyAvatar file:


```javascript
'use client';

import {useEffect } from "react";
import AblyAvatar from "./AblyAvatar";
import { useSpace, useMembers } from "@ably/spaces/react";

function generateTwoLetterString() {
  let result = '';
  for (let i = 0; i < 2; i++) {
      result += String.fromCharCode(65+Math.floor(Math.random() * 26));
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
```

### Entering Clients into a Space

With functions available to generate details for our users, let’s use them to enter our Space. Here we’ll get a random name and color, get an instance of our Space, available through the SpaceProvider we used in App.jsx, and then enter it with these details. Add the following below the `// Connect to Ably Space and enter set of connected clients` comment:

```javascript
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
```

### Displaying the Avatars

Finally, let’s use these `others` and `self` fields to generate our Avatar Stack. We will always put our own Avatar first, and then display all other members after. Add the following below the `// Add Avatars` comment in `AvatarStack.jsx`:

```javascript
          <AblyAvatar user={self} />
          {others.map((user) => {
            return <AblyAvatar key={user.clientId} user={user}/>
          })}
```

With that done, our app should be working. Run the project with `npm run dev`, and you should see as you open up more browser tabs, more clients enter the Avatar Stack!

## Conclusion

With this project, you now have a template to expand out further and customize to whatever needs your application has. If you have profile images for users, you can send an additional field over Ably containing a link to the image to use. If you want to add interactivity, you can look at Flowbite’s tooling for adding a dropdown.
