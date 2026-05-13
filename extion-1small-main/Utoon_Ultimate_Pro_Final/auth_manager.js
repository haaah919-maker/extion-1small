const SUPABASE_URL = "https://zxrgztmwepyqyrkhhtmr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4cmd6dG13ZXB5cXlya2hodG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODc0NjksImV4cCI6MjA5Mzc2MzQ2OX0.dsgkoKciaHo58qfKwbfUYh3-nJFDeFOvTVmnvsrrxRw";

function getDeviceId() {
    let id = localStorage.getItem('u_device_id');
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('u_device_id', id);
    }
    return id;
}

async function checkSubscriptionStatus() {
    const deviceId = getDeviceId();
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/licenses?device_id=eq.${deviceId}&select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            const license = data[0];
            const now = new Date();
            const expiry = new Date(license.expires_at);
            if (expiry > now) {
                localStorage.setItem('isPremium', 'true');
                return { isPremium: true, expiry: license.expires_at };
            }
        }
        localStorage.setItem('isPremium', 'false');
        return { isPremium: false };
    } catch (e) {
        return { isPremium: false };
    }
}

async function activateLicense(licenseKey) {
    const deviceId = getDeviceId();
    const activatedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 Days from now

    try {
        // Find if key exists and is not used by another device
        const res = await fetch(`${SUPABASE_URL}/rest/v1/licenses?key=eq.${licenseKey}&select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const keys = await res.json();
        
        if (keys.length > 0 && (!keys[0].device_id || keys[0].device_id === deviceId)) {
            // Update the key with device info
            const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/licenses?key=eq.${licenseKey}`, {
                method: 'PATCH',
                headers: { 
                    'apikey': SUPABASE_KEY, 
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    device_id: deviceId,
                    activated_at: activatedAt.toISOString(),
                    expires_at: expiresAt.toISOString()
                })
            });
            if (updateRes.ok) return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

async function getDailyUsage() {
    const deviceId = getDeviceId();
    const today = new Date().toISOString().split('T')[0];
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/unlocked_chapters?device_id=eq.${deviceId}&unlocked_at=gte.${today}&select=count`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=exact' }
        });
        const count = parseInt(res.headers.get('content-range')?.split('/')[1] || 0);
        return count;
    } catch (e) {
        return 0;
    }
}

async function checkAndUnlockChapter(mangaSlug, chapterSlug, isLockedOnSite) {
    // 1. Check local status first (faster)
    const sub = await checkSubscriptionStatus();
    if (sub.isPremium) return { allowed: true };

    // 2. If it's a free chapter on the site, don't count it
    if (!isLockedOnSite) return { allowed: true };

    const deviceId = getDeviceId();

    try {
        // 3. Check if already unlocked forever for this device
        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/unlocked_chapters?device_id=eq.${deviceId}&manga_slug=eq.${mangaSlug}&chapter_slug=eq.${chapterSlug}&select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const existing = await checkRes.json();
        if (existing && existing.length > 0) return { allowed: true };

        // 4. Count daily usage
        const usedToday = await getDailyUsage();
        if (usedToday >= 2) {
            return { 
                allowed: false, 
                message: "Daily Free Limit Reached! (2/2 Locked Chapters).\n\nUpgrade to VIP for Unlimited access, No Ads, and more features!\n\nOwner ID: Hpwin\nDiscord: discord.gg/utoon" 
            };
        }

        // 5. Unlock and record
        await fetch(`${SUPABASE_URL}/rest/v1/unlocked_chapters`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                device_id: deviceId,
                manga_slug: mangaSlug,
                chapter_slug: chapterSlug
            })
        });

        return { allowed: true };
    } catch (e) {
        return { allowed: true }; // Error fallback
    }
}
