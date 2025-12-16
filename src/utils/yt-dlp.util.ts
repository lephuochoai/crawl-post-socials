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
      console.log('Windows: chạy script .bat hoặc .cmd');
      break;
    case 'linux':
      binaryName = 'yt-dlp_linux';
      console.log('Linux: chạy shell script .sh');
      break;
    case 'darwin':
      binaryName = 'yt-dlp_macos';
      console.log('macOS: chạy shell script .sh');
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  return path.join(binDir, binaryName);
}
