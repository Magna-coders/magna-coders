export interface UserProfile {
  name: string;
  username: string;
  role: string;
  secondaryRole: string;
  location: string;
  bio: string;
  verified: boolean;
  followers: number;
  following: number;
  projects: number;
  stats: {
    connections: number;
    mutualConnections: number;
    projects: number;
    followers: number;
    following: number;
    skills: number;
  };
  socials: Array<{
    name: string;
    url: string;
    icon?: any;
    color?: string;
  }>;
  skillsList: any[];
  projectsList: any[];
  activitiesList: any[];
  connectionsList: any[];
}

export const USER_DATA: UserProfile = {
  name: 'Loading...',
  username: '@user',
  role: 'Developer',
  secondaryRole: 'Builder',
  location: 'Location',
  bio: 'Loading profile...',
  verified: false,
  followers: 0,
  following: 0,
  projects: 0,
  stats: {
    connections: 0,
    mutualConnections: 0,
    projects: 0,
    followers: 0,
    following: 0,
    skills: 0
  },
  socials: [],
  skillsList: [],
  projectsList: [],
  activitiesList: [],
  connectionsList: []
};

export const PROFILE_TABS = [
  'Overview',
  'Skills',
  'Projects',
  'Activities',
  'Connections'
];
