import * as path from 'path';
import * as os from 'os';

export function getYtDlpPath(): string {
  const platform = os.platform();
  const rootDir = process.cwd(); // Assuming execution from project root
  const binDir = path.join(rootDir, 'bin');

  let binaryName: string;

  switch (platform) {
    case 'win32':
      binaryName = 'yt-dlp.exe';
      break;
    case 'linux':
      binaryName = 'yt-dlp_linux';
      break;
    case 'darwin':
      binaryName = 'yt-dlp_macos';
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  return path.join(binDir, binaryName);
}
