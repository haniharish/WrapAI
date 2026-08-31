export function formatTimecode(seconds) {
  if (isNaN(seconds) || seconds === null) return '00:00:00';
  const sec = Math.floor(seconds);
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;
  
  const pad = (num) => String(num).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(remainingSecs)}`;
}

export function formatShortTime(seconds) {
  if (isNaN(seconds) || seconds === null) return '00:00';
  const sec = Math.floor(seconds);
  const mins = Math.floor(sec / 60);
  const remainingSecs = sec % 60;
  const pad = (num) => String(num).padStart(2, '0');
  return `${pad(mins)}:${pad(remainingSecs)}`;
}

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(isoDateString) {
  if (!isoDateString) return 'N/A';
  const d = new Date(isoDateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
