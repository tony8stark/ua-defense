const STORAGE_KEY = 'ua-tutorial-seen';

export function shouldShowTutorial() {
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

export function markTutorialSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Ignore storage failures and keep the tutorial usable.
  }
}
