import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '@/databases/entities/media.entity';
import { getYtDlpPath } from '@/utils/yt-dlp.util';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly publicDir = path.join(process.cwd(), 'public');

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>
  ) {
    this.ensurePublicDir();
  }

  private ensurePublicDir() {
    if (!fs.existsSync(this.publicDir)) {
      fs.mkdirSync(this.publicDir, { recursive: true });
    }
  }

  /**
   * Downloads media from a URL using yt-dlp and saves it to the public directory.
   * Updates the Media entity with the file path.
   * @param mediaId The ID of the Media entity to update.
   * @param url The URL of the media to download.
   */
  async downloadMedia(mediaId: number, url: string): Promise<string> {
    const ytDlpPath = getYtDlpPath();
    // Use %(id)s instead of %(title)s to avoid invalid filename characters on Windows
    const filename = `${uuidv4()}_%(id)s.%(ext)s`;
    const outputPathTemplate = path.join(this.publicDir, filename);

    this.logger.log(`Starting download for media ${mediaId} from ${url}`);
    console.log(`[FileService] Using binary: ${ytDlpPath}`);
    console.log(`[FileService] Output template: ${outputPathTemplate}`);

    return new Promise((resolve, reject) => {
      const childProcess = spawn(ytDlpPath, ['-o', outputPathTemplate, '--no-playlist', url]);

      let stdoutData = '';
      let stderrData = '';

      childProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdoutData += chunk;
        // console.log('[yt-dlp stdout]', chunk); // Unleash for extreme verbosity
      });

      childProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderrData += chunk;
        console.log('[yt-dlp stderr]', chunk); // Often contains progress info
      });

      childProcess.on('close', async (code) => {
        console.log(`[yt-dlp] Process exited with code ${code}`);

        if (code !== 0) {
          const errorMsg = `yt-dlp process exited with code ${code}. Stderr: ${stderrData}`;
          this.logger.error(errorMsg);
          return reject(new Error(errorMsg));
        }

        let downloadedFilePath = '';
        const destinationMatch = stdoutData.match(/\[download\] Destination: (.+)/);
        const mergerMatch = stdoutData.match(/\[Merger\] Merging formats into "(.+)"/);

        if (mergerMatch && mergerMatch[1]) {
          downloadedFilePath = mergerMatch[1].replace(/"/g, '').trim();
        } else if (destinationMatch && destinationMatch[1]) {
          downloadedFilePath = destinationMatch[1].trim();
        } else {
          const uuidPrefix = path.basename(outputPathTemplate).split('_')[0];
          const files = fs.readdirSync(this.publicDir);
          const foundFile = files.find((f) => f.startsWith(uuidPrefix));
          if (foundFile) {
            downloadedFilePath = path.join(this.publicDir, foundFile);
          }
        }

        console.log(`[FileService] Detected file path: ${downloadedFilePath}`);

        if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
          const relativePath = path.relative(process.cwd(), downloadedFilePath);

          try {
            // Update DB only if successful
            await this.mediaRepository.update(mediaId, {
              filePath: relativePath,
              isDownloaded: true,
            });

            this.logger.log(`Downloaded media ${mediaId} to ${relativePath}`);
            resolve(relativePath);
          } catch (dbError) {
            console.error('[FileService] DB Update Error:', dbError);
            reject(dbError);
          }
        } else {
          const msg = `Could not determine downloaded file path. Stdout: ${stdoutData.slice(-200)}`;
          console.error(`[FileService] ${msg}`);
          reject(new Error(msg));
        }
      });

      childProcess.on('error', (err) => {
        this.logger.error('Failed to start subprocess.', err);
        console.error('[FileService] Spawn Error:', err);
        reject(err);
      });
    });
  }
}
