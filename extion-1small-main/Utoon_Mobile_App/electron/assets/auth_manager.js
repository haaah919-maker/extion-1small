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

async function getUserStatus() {
    const sub = await checkSubscriptionStatus();
    const usedToday = await getDailyUsage();
    const remaining = Math.max(0, 5 - usedToday);
    
    if (sub.isPremium) {
        const expiryDate = new Date(sub.expiry);
        const formattedExpiry = expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return {
            isPremium: true,
            statusText: `VIP • Expires: ${formattedExpiry}`,
            remaining: 'Unlimited',
            expiry: sub.expiry
        };
    } else {
        return {
            isPremium: false,
            statusText: `Free: ${usedToday}/5 chapters today`,
            remaining: remaining,
            expiry: null
        };
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
        if (usedToday >= 5) {
            return { 
                allowed: false, 
                message: "Daily Free Limit Reached! (5/5 Locked Chapters).\n\nUpgrade to VIP for Unlimited access, No Ads, and more features!\n\nOwner ID: Hpwin\nDiscord: discord.gg/utoon" 
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

// === Unified UI for Pro Dashboard (Works in Extension & Electron & Mobile) ===
async function showProDashboard() {
    if (document.getElementById('u-pro-dashboard')) return;

    const modal = document.createElement('div');
    modal.id = 'u-pro-dashboard';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999999; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(5px); font-family:sans-serif;';
    
    modal.innerHTML = `
        <div style="background:#130a2a; padding:30px; border-radius:15px; border:2px solid #7c3aed; width:90%; max-width:400px; box-shadow:0 10px 40px rgba(0,0,0,0.6); text-align:center; color:white; position:relative;">
            <button id="u-close-dash" style="position:absolute; top:10px; right:15px; background:none; border:none; color:#a78bfa; font-size:24px; cursor:pointer;">×</button>
            <h2 style="color:#a78bfa; margin-top:0; margin-bottom:20px;">Utoon Ultimate Pro</h2>
            
            <div style="background:rgba(124,58,237,0.1); padding:15px; border-radius:10px; margin-bottom:20px; text-align:left; font-size:14px; border:1px solid rgba(124,58,237,0.3);">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="color:#94a3b8;">Plan:</span>
                    <span id="dash-plan" style="font-weight:bold;">Loading...</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="color:#94a3b8;">Daily Quota:</span>
                    <span id="dash-quota" style="font-weight:bold; color:white;">--/5 Left</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:#94a3b8;">Expiry Date:</span>
                    <span id="dash-expiry" style="font-weight:bold; color:white;">--</span>
                </div>
            </div>

            <div id="dash-activate-ui">
                <input type="text" id="dash-key-input" placeholder="Enter License Key" style="width:100%; padding:12px; margin-bottom:15px; border-radius:8px; border:1px solid #4b5563; background:#1f2937; color:white; box-sizing:border-box;">
                <button id="dash-activate-btn" style="width:100%; padding:12px; border-radius:8px; border:none; background:linear-gradient(135deg,#a855f7,#7c3aed); color:white; font-weight:bold; cursor:pointer; font-size:15px;">Activate Premium</button>
            </div>

            <div style="margin-top:25px; font-size:12px; color:#64748b; border-top:1px solid #333; padding-top:15px;">
                Owner: <span style="color:white;">Hpwin</span><br>
                Need Help? <a href="https://discord.gg/utoon" target="_blank" style="color:#a78bfa; text-decoration:none; font-weight:bold;">Join Discord Support</a>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('u-close-dash').onclick = () => modal.remove();

    const status = await checkSubscriptionStatus();
    const planEl = document.getElementById('dash-plan');
    
    if (status.isPremium) {
        planEl.innerText = "💎 VIP Premium";
        planEl.style.color = "#22c55e";
        document.getElementById('dash-quota').innerText = "♾️ Unlimited";
        document.getElementById('dash-expiry').innerText = new Date(status.expiry).toLocaleDateString();
        document.getElementById('dash-activate-ui').style.display = 'none';
    } else {
        planEl.innerText = "🆓 Free Plan";
        planEl.style.color = "#ef4444";
        const usedToday = await getDailyUsage();
        document.getElementById('dash-quota').innerText = Math.max(0, 5 - usedToday) + " Left";
        document.getElementById('dash-expiry').innerText = "None";
        
        document.getElementById('dash-activate-btn').onclick = async () => {
            const key = document.getElementById('dash-key-input').value.trim();
            if (!key) return alert("Please enter a key");
            const btn = document.getElementById('dash-activate-btn');
            btn.innerText = "Verifying...";
            btn.disabled = true;
            
            const success = await activateLicense(key);
            if (success) {
                alert("Activated Successfully! Enjoy VIP.");
                location.reload();
            } else {
                alert("Invalid, Expired, or Already Used Key");
                btn.innerText = "Activate Premium";
                btn.disabled = false;
            }
        };
    }
}
