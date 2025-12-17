import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import puppeteer from 'puppeteer-extra';
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
import { Repository } from 'typeorm';
import { Post, SocialAccount, Influencer, Social } from '@/databases/entities';
import { SocialPlatform } from '@/shared/enums';
import { CrawlPostDto } from './dto/crawl-post.dto';
import { parseSocialCount } from '@/utils/string.util';
import { typeWithRandomDelay } from '@/utils/puppeteer.util';
import { ConfigService } from '@nestjs/config';
import { HackathonConfig } from '@/configs';

@Injectable()
export class CrawlService implements OnModuleInit, OnModuleDestroy {
  private readonly maxCollectCount = 10;
  private readonly logger = new Logger(CrawlService.name);

  private browser;
  private twitterGoogleEmail: string;
  private twitterGooglePassword: string;

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
    @InjectRepository(Influencer)
    private readonly influencerRepository: Repository<Influencer>,
    @InjectRepository(Social)
    private readonly socialRepository: Repository<Social>,
    private readonly configService: ConfigService<HackathonConfig>
  ) {}

  async onModuleInit() {
    this.twitterGoogleEmail = this.configService.getOrThrow('main.twitterGoogleEmail', { infer: true });
    this.twitterGooglePassword = this.configService.getOrThrow('main.twitterGooglePassword', { infer: true });

    if (process.argv.some((arg) => arg.includes('seed'))) {
      this.logger.log('Skipping browser launch in seed mode');
      return;
    }

    puppeteer.use(StealthPlugin());
    this.browser = await puppeteer.launch({
      headless: false,
      userDataDir: './user_data',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await this.browser.newPage();
    try {
      await page.goto('https://twitter.com');
      await Promise.resolve(setTimeout(() => {}, 2000));
      await this.loginWithGoogle(page);
    } catch (error) {
      this.logger.warn('Failed to navigate to twitter on init', error);
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async loginWithGoogle(page: any) {
    try {
      this.logger.log('Starting Google login flow...');

      try {
        if (page.url().includes('home')) {
          this.logger.log('Already logged in (url check).');
          return;
        }

        await Promise.race([
          page.waitForSelector('div[data-testid="SideNav_AccountSwitcher_Button"]', { timeout: 15000 }),
          page.waitForSelector('a[data-testid="AppTabBar_Home_Link"]', { timeout: 15000 }),
          page.waitForSelector('div[data-testid="primaryColumn"]', { timeout: 15000 }),
        ]);
        this.logger.log('Already logged in.');
        return;
      } catch (e) {
        this.logger.log('Not logged in.' + e);
      }

      this.logger.log('Waiting for Google Sign-In container...');

      try {
        const selector = 'div[data-testid="google_sign_in_container"]';
        await page.waitForSelector(selector, { timeout: 20000 });

        await page.click(selector);
        this.logger.log('Clicked Google Sign-In container');
      } catch (e) {
        this.logger.error(
          `Error finding Google button with selector div[data-testid="google_sign_in_container"] at ${page.url()}`,
          e
        );
        return;
      }

      const newTarget = await this.browser.waitForTarget((target: any) => target.opener() === page.target());
      const googlePage = await newTarget.page();

      if (!googlePage) {
        this.logger.error('Google popup page not found');
        return;
      }

      this.logger.log('Waiting for popup to load...');
      await new Promise((r) => setTimeout(r, 3000));

      this.logger.log('Waiting for email input or account chooser...');
      await new Promise((r) => setTimeout(r, 2000));
      const emailInputSelector = 'input[type="email"]';
      const targetEmail = this.twitterGoogleEmail;

      try {
        await googlePage.waitForFunction(
          (selector, email) => {
            return (
              document.querySelector(selector) ||
              Array.from(document.querySelectorAll('div')).some((el) => el.textContent?.trim() === email)
            );
          },
          { timeout: 15000 },
          emailInputSelector,
          targetEmail
        );
      } catch (e) {
        this.logger.warn('Timeout waiting for email input or account chooser');
      }

      const emailInput = await googlePage.$(emailInputSelector);

      if (emailInput) {
        this.logger.log('Email input found. Typing email...');
        await typeWithRandomDelay(googlePage, emailInputSelector, targetEmail);
        await googlePage.keyboard.press('Enter');
      } else {
        this.logger.log('Email input not found. Checking for account chooser...');
        const clicked = await googlePage.evaluate((email) => {
          const elements = Array.from(document.querySelectorAll('div'));
          const target = elements.find((el) => el.textContent?.trim() === email);
          if (target) {
            target.click();
            return true;
          }
          return false;
        }, targetEmail);

        if (clicked) {
          this.logger.log(`Clicked account: ${targetEmail}`);
        } else {
          this.logger.warn('Could not find email input or account to click. Login might fail.');
        }
      }

      try {
        await googlePage.waitForSelector('input[type="password"]', { visible: true, timeout: 15000 });
        this.logger.log('Password input found. Typing password...');
        await typeWithRandomDelay(googlePage, 'input[type="password"]', this.twitterGooglePassword);
        await googlePage.keyboard.press('Enter');
      } catch (e) {
        this.logger.log('Password input not found (or timed out). Assuming password skipped or already logged in.');
      }

      this.logger.log('Credentials entered. Waiting for login to complete...');

      try {
        await Promise.race([
          page.waitForSelector('div[data-testid="SideNav_AccountSwitcher_Button"]', { timeout: 100000 }),
          page.waitForSelector('a[data-testid="AppTabBar_Home_Link"]', { timeout: 100000 }),
          page.waitForSelector('div[data-testid="primaryColumn"]', { timeout: 100000 }),
        ]);
        this.logger.log('Successfully logged in!');
      } catch (error) {
        this.logger.warn('Login verification timed out, but continuing to check if we can proceed...');
      }
    } catch (error) {
      this.logger.error('Google login failed', error);
    }
  }

  async crawlVideoPosts(crawlDto: CrawlPostDto) {
    const { username, maxCollectCount } = crawlDto;
    const limit = maxCollectCount || this.maxCollectCount;
    this.logger.log(`Starting crawl for username: ${username} with limit: ${limit}`);
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
      const profileUrl = `https://twitter.com/${username}`;
      this.logger.log(`Navigating to profile: ${profileUrl}`);
      await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 20000 });

      await page.waitForSelector('div[data-testid="UserName"] span', { timeout: 10000 });

      const displayName = await page.evaluate(() => {
        const nameEl = document.querySelector('div[data-testid="UserName"] span span');
        return nameEl ? nameEl.textContent : null;
      });

      if (!displayName) {
        throw new Error(`Could not extract display name for ${username}`);
      }
      this.logger.log(`Extracted name: ${displayName}`);

      const { bio, followingCount, followersCount, joinDate, avatar } = await page.evaluate(() => {
        const bioEl = document.querySelector('div[data-testid="UserDescription"]');
        const followingEl = document.querySelector('a[href$="/following"] span span');
        const followersEl =
          document.querySelector('a[href$="/verified_followers"] span span') ||
          document.querySelector('a[href$="/followers"] span span');
        let joinDateEl = document.querySelector('span[data-testid="UserJoinDate"]');
        const avatarEl = document.querySelector('a[href$="/photo"] img');

        if (!joinDateEl) {
          const spans = Array.from(document.querySelectorAll('span'));
          joinDateEl = spans.find((span) => span.textContent && span.textContent.includes('Joined')) || null;
        }

        return {
          bio: bioEl ? bioEl.textContent : null,
          followingCount: followingEl ? followingEl.textContent : null,
          followersCount: followersEl ? followersEl.textContent : null,
          joinDate: joinDateEl ? joinDateEl.textContent : null,
          avatar: avatarEl ? avatarEl.getAttribute('src') : null,
        };
      });

      this.logger.log(
        `Extracted info - Bio: ${bio}, Following: ${followingCount}, Followers: ${followersCount}, Join: ${joinDate}, Avatar: ${avatar}`
      );

      let influencer = await this.influencerRepository.findOne({ where: { name: displayName } });
      if (!influencer) {
        this.logger.log(`Creating new influencer: ${displayName}`);
        influencer = this.influencerRepository.create({ name: displayName });
        await this.influencerRepository.save(influencer);
      }

      const twitterSocial = await this.socialRepository.findOne({ where: { platform: SocialPlatform.TWITTER } });
      if (!twitterSocial) {
        throw new Error('Twitter social platform not found in DB');
      }

      let parsedJoinDate: Date | null = null;
      if (joinDate) {
        try {
          const dateStr = joinDate.replace('Joined ', '');
          parsedJoinDate = new Date(dateStr);
          if (isNaN(parsedJoinDate.getTime())) {
            parsedJoinDate = null;
          }
        } catch (e) {
          this.logger.warn(`Failed to parse join date: ${joinDate}`);
        }
      }

      const parsedFollowingCount = parseSocialCount(followingCount);
      const parsedFollowersCount = parseSocialCount(followersCount);

      let socialAccount = await this.socialAccountRepository.findOne({ where: { username } });
      if (!socialAccount) {
        this.logger.log(`Creating new social account: ${username}`);
        socialAccount = this.socialAccountRepository.create({
          username,
          influencer,
          social: twitterSocial,
          platformUserId: null,
          bio,
          followingCount: parsedFollowingCount,
          followersCount: parsedFollowersCount,
          joinDate: parsedJoinDate,
          avatar,
        });
        await this.socialAccountRepository.save(socialAccount);
      } else {
        socialAccount.bio = bio;
        socialAccount.followingCount = parsedFollowingCount;
        socialAccount.followersCount = parsedFollowersCount;
        socialAccount.joinDate = parsedJoinDate;
        socialAccount.avatar = avatar;

        if (!socialAccount.influencer) {
          socialAccount.influencer = influencer;
        }
        await this.socialAccountRepository.save(socialAccount);
      }

      await this.crawlAccount(socialAccount, page, limit);
    } catch (error) {
      this.logger.error(`Error processing account ${username}`, error);
      throw error;
    } finally {
      if (!page.isClosed()) await page.close();
    }
  }

  private async crawlAccount(account: SocialAccount, page: any, limit: number) {
    try {
      const oldestPost = await this.postRepository.findOne({
        where: { socialAccountId: account.id },
        order: { postedAt: 'ASC' },
      });

      let startUrl = `https://twitter.com/${account.username}`;
      let minTweetId = oldestPost ? oldestPost.tweetId : null;

      if (oldestPost) {
        const date = oldestPost.postedAt.toISOString().split('T')[0];
        this.logger.log(`Found existing data. Resuming from date: ${date}`);
        startUrl = `https://twitter.com/search?q=from%3A${account.username}%20until%3A${date}&src=typed_query&f=live`;
      }

      this.logger.log(`Navigating to: ${startUrl}`);
      await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 60000 });

      try {
        await page.waitForSelector('div[data-testid="cellInnerDiv"]', { timeout: 10000 });
      } catch (e) {
        this.logger.warn('Timeout waiting for tweets. Might be no results or login issue.');
      }

      let collectedCount = 0;
      let noNewTweetsCount = 0;

      while (collectedCount < limit && noNewTweetsCount < 30) {
        await page.evaluate(() => {
          const scrollAmount = Math.floor(Math.random() * 500) + 300;
          window.scrollBy(0, scrollAmount);
        });
        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 1000) + 1000));

        const newTweets = await page.evaluate(() => {
          const items = [];
          const cells = document.querySelectorAll('div[data-testid="cellInnerDiv"]');

          cells.forEach((cell) => {
            const videoComponent = cell.querySelector('div[data-testid="videoComponent"]');
            if (videoComponent) {
              const links = Array.from(cell.querySelectorAll('a[href*="/status/"]'));
              const timeElement = cell.querySelector('time');
              const textElement = cell.querySelector('div[data-testid="tweetText"]');

              let tweetUrl = '';
              let tweetId = '';
              for (const link of links) {
                const href = link.getAttribute('href');
                if (href && href.includes('/status/') && !href.includes('/analytics')) {
                  tweetUrl = href.startsWith('http') ? href : `https://twitter.com${href}`;
                  tweetId = tweetUrl.split('/status/')[1];
                  break;
                }
              }

              if (tweetUrl && timeElement) {
                const datetime = timeElement.getAttribute('datetime');
                const title = textElement ? textElement.textContent : '';

                const hashtags = [];
                if (textElement) {
                  const hashtagLinks = textElement.querySelectorAll('a[href*="/hashtag/"]');
                  hashtagLinks.forEach((a) => {
                    hashtags.push(a.textContent);
                  });
                }

                if (datetime) {
                  items.push({
                    url: tweetUrl,
                    tweetId,
                    date: datetime,
                    title,
                    hashtags,
                  });
                }
              }
            }
          });
          return items;
        });

        let addedInThisStep = 0;
        for (const tweet of newTweets) {
          if (collectedCount >= limit) break;

          const exists = await this.postRepository.findOne({ where: { tweetId: tweet.tweetId } });
          if (!exists) {
            if (minTweetId && tweet.tweetId >= minTweetId) {
              continue;
            }

            await this.postRepository.save({
              url: tweet.url,
              tweetId: tweet.tweetId,
              title: tweet.title,
              hashtags: tweet.hashtags,
              postedAt: new Date(tweet.date),
              socialAccountId: account.id,
              isDownloaded: false,
            });
            collectedCount++;
            addedInThisStep++;
            this.logger.log(`Saved new tweet: ${tweet.tweetId}`);
          }
        }

        if (addedInThisStep === 0) {
          noNewTweetsCount++;
        } else {
          noNewTweetsCount = 0;
        }
      }

      this.logger.log(`Finished account ${account.username}. Collected ${collectedCount} tweets.`);
    } catch (error) {
      this.logger.error(`Error processing account ${account.username}`, error);
      throw error;
    }
  }
}
