const SUPABASE_URL = "https://zxrgztmwepyqyrkhhtmr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4cmd6dG13ZXB5cXlya2hodG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODc0NjksImV4cCI6MjA5Mzc2MzQ2OX0.dsgkoKciaHo58qfKwbfUYh3-nJFDeFOvTVmnvsrrxRw";

async function verifyLicense(licenseKey) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/licenses?key=eq.${licenseKey}&select=*`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            const license = data[0];
            const now = new Date();
            const expiry = new Date(license.expiry_date);
            if (expiry > now) {
                return { valid: true, premium: license.is_premium };
            }
        }
        return { valid: false };
    } catch (e) {
        console.error("Auth Error:", e);
        return { valid: false };
    }
}

function getDeviceId() {
    let id = localStorage.getItem('u_device_id');
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('u_device_id', id);
    }
    return id;
}

async function checkAndUnlockChapter(mangaSlug, chapterSlug, isLockedOnSite) {
    const isPremium = localStorage.getItem('isPremium') === 'true';
    if (isPremium) return { allowed: true };
    if (!isLockedOnSite) return { allowed: true }; // Free chapters on site don't count

    const deviceId = getDeviceId();
    const today = new Date().toISOString().split('T')[0];

    try {
        // 1. Check if already unlocked forever
        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/unlocked_chapters?device_id=eq.${deviceId}&manga_slug=eq.${mangaSlug}&chapter_slug=eq.${chapterSlug}&select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const existing = await checkRes.json();
        if (existing && existing.length > 0) return { allowed: true };

        // 2. Count how many unlocked today
        const countRes = await fetch(`${SUPABASE_URL}/rest/v1/unlocked_chapters?device_id=eq.${deviceId}&unlocked_at=gte.${today}&select=count`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=exact' }
        });
        // Note: Supabase count response handling varies, assuming simple count for now
        const count = parseInt(countRes.headers.get('content-range')?.split('/')[1] || 0);

        if (count >= 2) {
            return { allowed: false, message: "Daily limit reached (2 chapters). Subscribe for unlimited access!" };
        }

        // 3. Unlock this chapter
        await fetch(`${SUPABASE_URL}/rest/v1/unlocked_chapters`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                device_id: deviceId,
                manga_slug: mangaSlug,
                chapter_slug: chapterSlug,
                unlocked_at: new Date().toISOString()
            })
        });

        return { allowed: true };
    } catch (e) {
        console.error("Limit Check Error:", e);
        return { allowed: true }; // Fallback to allow on error
    }
}

