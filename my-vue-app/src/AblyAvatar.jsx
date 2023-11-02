import { Avatar } from 'flowbite-react';

const AblyAvatar = ({ user }) => {
    if (!user) return (<></>);

    return (
        <Avatar placeholderInitials={user.profileData.name} color={user.profileData.memberColor} rounded stacked status={user.isConnected ? 'online' : 'offline'} statusPosition="bottom-left" />
    );
};

export default AblyAvatar;