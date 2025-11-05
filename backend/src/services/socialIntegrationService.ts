import axios from 'axios';
import { prisma, db } from '../utils/prismaClient';

interface SocialProfile {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
  followers?: number;
  following?: number;
  posts?: number;
  verified?: boolean;
}

interface SocialPost {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  likes: number;
  comments: number;
  shares: number;
  url: string;
  platform: string;
}

class SocialIntegrationService {
  private prisma: any;

  constructor() {
    this.prisma = prisma;
  }

  // GitHub Integration
  async connectGitHub(userId: string, accessToken: string): Promise<void> {
    try {
      const profile = await this.getGitHubProfile(accessToken);
      const repos = await this.getGitHubRepos(accessToken);

  await db.socialIntegration.upsert({
        where: {
          userId_platform: {
            userId,
            platform: 'GITHUB'
          }
        },
        update: {
          accessToken,
          profileData: profile as any,
          isConnected: true,
          connectedAt: new Date(),
        },
        create: {
          userId,
          platform: 'GITHUB',
          accessToken,
          profileData: profile as any,
          isConnected: true,
          connectedAt: new Date(),
        }
      });

      // Update user skills based on GitHub repos
      await this.updateUserSkillsFromGitHub(userId, repos);

    } catch (error) {
      console.error('GitHub connection failed:', error);
      throw new Error('Failed to connect GitHub account');
    }
  }

  async getGitHubProfile(accessToken: string): Promise<SocialProfile> {
    const response = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return {
      id: response.data.id.toString(),
      username: response.data.login,
      name: response.data.name || response.data.login,
      email: response.data.email,
      avatar: response.data.avatar_url,
      bio: response.data.bio,
      followers: response.data.followers,
      following: response.data.following,
      posts: response.data.public_repos,
      verified: true,
    };
  }

  async getGitHubRepos(accessToken: string): Promise<any[]> {
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { sort: 'updated', per_page: 100 }
    });
    return response.data;
  }

  async updateUserSkillsFromGitHub(userId: string, repos: any[]): Promise<void> {
    const languages = new Map<string, number>();

    repos.forEach(repo => {
      if (repo.language) {
        languages.set(repo.language, (languages.get(repo.language) || 0) + 1);
      }
    });

    const topSkills = Array.from(languages.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([language]) => language);

  await db.users.update({
      where: { id: userId },
      data: { skills: topSkills }
    });
  }

  // LinkedIn Integration
  async connectLinkedIn(userId: string, accessToken: string): Promise<void> {
    try {
      const profile = await this.getLinkedInProfile(accessToken);

  await db.socialIntegration.upsert({
        where: {
          userId_platform: {
            userId,
            platform: 'LINKEDIN'
          }
        },
        update: {
          accessToken,
          profileData: profile as any,
          isConnected: true,
          connectedAt: new Date(),
        },
        create: {
          userId,
          platform: 'LINKEDIN',
          accessToken,
          profileData: profile as any,
          isConnected: true,
          connectedAt: new Date(),
        }
      });

    } catch (error) {
      console.error('LinkedIn connection failed:', error);
      throw new Error('Failed to connect LinkedIn account');
    }
  }

  async getLinkedInProfile(accessToken: string): Promise<SocialProfile> {
    const response = await axios.get('https://api.linkedin.com/v2/people/~', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return {
      id: response.data.id,
      username: response.data.vanityName,
      name: `${response.data.firstName} ${response.data.lastName}`,
      avatar: response.data.profilePicture?.displayImage,
      bio: response.data.summary,
      verified: true,
    };
  }

  // Twitter/X Integration
  async connectTwitter(userId: string, accessToken: string, refreshToken?: string): Promise<void> {
    try {
      const profile = await this.getTwitterProfile(accessToken);

  await db.socialIntegration.upsert({
        where: {
          userId_platform: {
            userId,
            platform: 'TWITTER'
          }
        },
        update: {
          accessToken,
          refreshToken,
          profileData: profile as any,
          isConnected: true,
          connectedAt: new Date(),
        },
        create: {
          userId,
          platform: 'TWITTER',
          accessToken,
          refreshToken,
          profileData: profile as any,
          isConnected: true,
          connectedAt: new Date(),
        }
      });

    } catch (error) {
      console.error('Twitter connection failed:', error);
      throw new Error('Failed to connect Twitter account');
    }
  }

  async getTwitterProfile(accessToken: string): Promise<SocialProfile> {
    const response = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        'user.fields': 'name,username,profile_image_url,description,public_metrics,verified'
      }
    });

    const user = response.data.data;
    const metrics = user.public_metrics;

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.profile_image_url,
      bio: user.description,
      followers: metrics?.followers_count,
      following: metrics?.following_count,
      posts: metrics?.tweet_count,
      verified: user.verified,
    };
  }

  // Discord Integration
  async connectDiscord(userId: string, accessToken: string, refreshToken?: string): Promise<void> {
    try {
      const profile = await this.getDiscordProfile(accessToken);

  await db.socialIntegration.upsert({
        where: {
          userId_platform: {
            userId,
            platform: 'DISCORD'
          }
        },
        update: {
          accessToken,
          refreshToken,
          profileData: profile as any,
          isConnected: true,
          connectedAt: new Date(),
        },
        create: {
          userId,
          platform: 'DISCORD',
          accessToken,
          refreshToken,
          profileData: profile as any,
          isConnected: true,
          connectedAt: new Date(),
        }
      });

    } catch (error) {
      console.error('Discord connection failed:', error);
      throw new Error('Failed to connect Discord account');
    }
  }

  async getDiscordProfile(accessToken: string): Promise<SocialProfile> {
    const response = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return {
      id: response.data.id,
      username: response.data.username,
      name: response.data.global_name || response.data.username,
      avatar: response.data.avatar ?
        `https://cdn.discordapp.com/avatars/${response.data.id}/${response.data.avatar}.png` :
        undefined,
      verified: response.data.verified,
    };
  }

  // Generic social sharing
  async shareToSocialPlatforms(userId: string, content: string, platforms: string[]): Promise<void> {
  const integrations = await db.socialIntegration.findMany({
      where: {
        userId,
        platform: { in: platforms as any },
        isConnected: true
      }
    });

    const sharePromises = integrations.map((integration: any) =>
      this.shareToPlatform(integration, content)
    );

    await Promise.allSettled(sharePromises);
  }

  private async shareToPlatform(integration: any, content: string): Promise<void> {
    switch (integration.platform) {
      case 'TWITTER':
        await this.shareToTwitter(integration.accessToken, content);
        break;
      case 'LINKEDIN':
        await this.shareToLinkedIn(integration.accessToken, content);
        break;
      // Add other platforms as needed as u may wish
    }
  }

  private async shareToTwitter(accessToken: string, content: string): Promise<void> {
    await axios.post('https://api.twitter.com/2/tweets',
      { text: content },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }

  private async shareToLinkedIn(accessToken: string, content: string): Promise<void> {
    await axios.post('https://api.linkedin.com/v2/ugcPosts',
      {
        author: 'urn:li:person:123456789',
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }

  // Get user's connected platforms
  async getConnectedPlatforms(userId: string): Promise<any[]> {
  return await db.socialIntegration.findMany({
      where: {
        userId,
        isConnected: true
      },
      select: {
        platform: true,
        connectedAt: true,
        profileData: true
      }
    });
  }

  // Disconnect platform
  async disconnectPlatform(userId: string, platform: string): Promise<void> {
  await db.socialIntegration.updateMany({
      where: {
        userId,
        platform: platform as any
      },
      data: {
        isConnected: false,
        accessToken: null,
        refreshToken: null
      }
    });
  }

  // Sync social media data
  async syncSocialData(userId: string): Promise<void> {
  const integrations = await db.socialIntegration.findMany({
      where: {
        userId,
        isConnected: true
      }
    });

    for (const integration of integrations) {
      try {
        let updatedProfile: SocialProfile;

        switch (integration.platform) {
          case 'GITHUB':
            updatedProfile = await this.getGitHubProfile(integration.accessToken!);
            break;
          case 'LINKEDIN':
            updatedProfile = await this.getLinkedInProfile(integration.accessToken!);
            break;
          case 'TWITTER':
            updatedProfile = await this.getTwitterProfile(integration.accessToken!);
            break;
          case 'DISCORD':
            updatedProfile = await this.getDiscordProfile(integration.accessToken!);
            break;
          default:
            continue;
        }

          await db.socialIntegration.update({
          where: {
            userId_platform: {
              userId,
              platform: integration.platform
            }
          },
          data: {
            profileData: updatedProfile as any,
            lastSyncedAt: new Date()
          }
        });

      } catch (error) {
        console.error(`Failed to sync ${integration.platform}:`, error);
      }
    }
  }
}

export default SocialIntegrationService;