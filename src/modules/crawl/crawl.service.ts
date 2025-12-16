import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import puppeteer from 'puppeteer-extra';
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
import { Repository } from 'typeorm';
import { Post, SocialAccount, Influencer, Social } from '@/databases/entities';
import { SocialPlatform } from '@/shared/enums';

@Injectable()
export class CrawlService implements OnModuleInit {
  private readonly maxCollectCount = 7;
  private readonly logger = new Logger(CrawlService.name);

  private browser;

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
    @InjectRepository(Influencer)
    private readonly influencerRepository: Repository<Influencer>,
    @InjectRepository(Social)
    private readonly socialRepository: Repository<Social>
  ) {}

  async onModuleInit() {
    if (process.argv.some((arg) => arg.includes('seed'))) {
      this.logger.log('Skipping browser launch in seed mode');
      return;
    }

    puppeteer.use(StealthPlugin());
    this.browser = await puppeteer.launch({
      headless: false,
      // userDataDir: './user_data',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await this.browser.newPage();
    await page.goto('https://twitter.com');
  }

  async crawlVideoPosts(username: string) {
    this.logger.log(`Starting crawl for username: ${username}`);
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
      // 1. Navigate to profile to get Name
      const profileUrl = `https://twitter.com/${username}`;
      this.logger.log(`Navigating to profile: ${profileUrl}`);
      await page.goto(profileUrl, { waitUntil: 'networkidle2' });

      // Wait for name selector
      await page.waitForSelector('div[data-testid="UserName"] span', { timeout: 10000 });

      // Extract Name (first span usually)
      const displayName = await page.evaluate(() => {
        const nameEl = document.querySelector('div[data-testid="UserName"] span span');
        return nameEl ? nameEl.textContent : null;
      });

      if (!displayName) {
        throw new Error(`Could not extract display name for ${username}`);
      }
      this.logger.log(`Extracted name: ${displayName}`);

      // 2. Find or Create Influencer
      let influencer = await this.influencerRepository.findOne({ where: { name: displayName } });
      if (!influencer) {
        this.logger.log(`Creating new influencer: ${displayName}`);
        influencer = this.influencerRepository.create({ name: displayName });
        await this.influencerRepository.save(influencer);
      }

      // 3. Find or Create SocialAccount
      // Find Social entity for Twitter
      const twitterSocial = await this.socialRepository.findOne({ where: { platform: SocialPlatform.TWITTER } });
      if (!twitterSocial) {
        throw new Error('Twitter social platform not found in DB');
      }

      let socialAccount = await this.socialAccountRepository.findOne({ where: { username } });
      if (!socialAccount) {
        this.logger.log(`Creating new social account: ${username}`);
        socialAccount = this.socialAccountRepository.create({
          username,
          influencer,
          social: twitterSocial,
          platformUserId: '',
        });
        await this.socialAccountRepository.save(socialAccount);
      } else {
        // Ensure link to influencer is correct if it was missing
        if (!socialAccount.influencer) {
          socialAccount.influencer = influencer;
          await this.socialAccountRepository.save(socialAccount);
        }
      }

      // 4. Crawl Tweets Logic (Reused)
      await this.crawlAccount(socialAccount, page);
    } catch (error) {
      this.logger.error(`Error processing account ${username}`, error);
      throw error;
    } finally {
      if (!page.isClosed()) await page.close();
    }
  }

  private async crawlAccount(account: SocialAccount, page: any) {
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
      await page.goto(startUrl, { waitUntil: 'networkidle2' });

      try {
        await page.waitForSelector('div[data-testid="cellInnerDiv"]', { timeout: 10000 });
      } catch (e) {
        this.logger.warn('Timeout waiting for tweets. Might be no results or login issue.');
      }

      let collectedCount = 0;
      let noNewTweetsCount = 0;

      while (collectedCount < this.maxCollectCount && noNewTweetsCount < 30) {
        await page.evaluate(() => {
          const scrollAmount = Math.floor(Math.random() * 500) + 300; // Random scroll 300-800px
          window.scrollBy(0, scrollAmount);
        });
        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 1000) + 1000)); // Random wait 1-2s

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
          if (collectedCount >= this.maxCollectCount) break;

          // Check if we already have this tweet
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
