import { Injectable, Logger } from '@nestjs/common';
import { getYtDlpPath } from '@/utils/yt-dlp.util';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly publicDir = path.join(process.cwd(), 'public');

  constructor() {
    this.ensurePublicDir();
  }

  private ensurePublicDir() {
    if (!fs.existsSync(this.publicDir)) {
      fs.mkdirSync(this.publicDir, { recursive: true });
    }
  }

  async downloadMedia(url: string): Promise<string> {
    const ytDlpPath = getYtDlpPath();
    const filename = `${uuidv4()}_%(id)s.%(ext)s`;
    const outputPathTemplate = path.join(this.publicDir, filename);

    return new Promise((resolve, reject) => {
      const childProcess = spawn(ytDlpPath, ['-o', outputPathTemplate, '--no-playlist', url]);

      let stdoutData = '';
      let stderrData = '';

      childProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdoutData += chunk;
      });

      childProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderrData += chunk;
      });

      childProcess.on('close', async (code) => {
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

        if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
          const relativePath = path.relative(process.cwd(), downloadedFilePath);
          resolve(relativePath);
        } else {
          const msg = `Could not determine downloaded file path. Stdout: ${stdoutData.slice(-200)}`;
          this.logger.error(`[FileService] ${msg}`);
          reject(new Error(msg));
        }
      });

      childProcess.on('error', (err) => {
        this.logger.error('Failed to start subprocess.', err);
        reject(err);
      });
    });
  }
}
